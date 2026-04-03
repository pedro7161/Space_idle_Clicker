import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ALL_ITEM_IDS,
  AUTO_MINERS,
  CRAFTED_DEFS,
  PLANETS,
  RECIPES,
  RESOURCE_DEFS,
  RESOURCE_IDS,
  RESOURCE_UPGRADES,
  SPACE_STATION_BLUEPRINTS,
  SHIPS,
  SHIP_PARTS,
} from '../constants';
import {
  AutoMiner,
  GameState,
  ItemCost,
  ItemId,
  OwnedShip,
  OwnedSpaceStation,
  Planet,
  Recipe,
  ResourceDef,
  ResourceId,
  ResourceUpgrade,
  Ship,
  ShipPart,
  ShipRoute,
  ShipStatus,
  SpaceStationBlueprint,
} from '../models';
import {
  buildDefaultGameState,
  CURRENT_SAVE_KEY,
  mergeSavedStateWithDefaults,
  SAVE_TRANSFER_PREFIX,
} from '../storage/game-save';
import type { LegacySavedState } from '../storage/game-save';
const SAVE_INTERVAL_MS = 10_000;
const TICK_INTERVAL_MS = 200;
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;
const BASE_TRAVEL_TIME_MS = 12_000;

function buildNumberRecord<T extends string>(ids: readonly T[]): Record<T, number> {
  return ids.reduce(
    (record, id) => {
      record[id] = 0;
      return record;
    },
    {} as Record<T, number>,
  );
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private state!: GameState;
  private initialized = false;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;

  readonly resources = RESOURCE_DEFS;
  readonly craftedItems = CRAFTED_DEFS;
  readonly upgrades = RESOURCE_UPGRADES;
  readonly autoMiners = AUTO_MINERS;
  readonly recipes = RECIPES;
  readonly planets = PLANETS;
  readonly shipParts = SHIP_PARTS;
  readonly shipDefinitions = SHIPS;
  readonly spaceStationBlueprints = SPACE_STATION_BLUEPRINTS;

  readonly state$ = new BehaviorSubject<GameState>(buildDefaultGameState());

  init(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.state = this.loadOrDefault();
    this.applyOfflineProgress();
    this.emit();
    this.startTick();
    this.saveInterval = setInterval(() => this.save(), SAVE_INTERVAL_MS);
  }

  destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    if (this.initialized) {
      this.state.lastTickAt = Date.now();
      this.save();
      this.initialized = false;
    }
  }

  mineActiveResource(): number {
    const resourceId = this.state.activeResourceId;
    const planetId = this.state.currentPlanetId;
    const gained = this.getManualYield(resourceId, planetId);

    this.addItem(resourceId, gained, planetId);
    this.state.totalClicks += 1;
    this.state.totalMined[resourceId] += gained;
    this.emit();

    return gained;
  }

  setActiveResource(resourceId: ResourceId): void {
    if (this.state.activeResourceId === resourceId) {
      return;
    }

    this.state.activeResourceId = resourceId;
    this.emit();
  }

  buyUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(item => item.id === upgradeId);
    if (!upgrade) {
      return false;
    }

    if (!this.isUpgradeVisible(upgrade)) {
      return false;
    }

    const level = this.getUpgradeLevel(this.state.currentPlanetId, upgrade.id);
    if (level >= upgrade.maxLevel) {
      return false;
    }

    const cost = this.getScaledCost(upgrade.baseCost, level, upgrade.costScaling);
    if (!this.canAfford(cost, this.state.currentPlanetId)) {
      return false;
    }

    this.spendItems(cost, this.state.currentPlanetId);
    this.state.upgradeLevels[this.getPlanetScopedKey(this.state.currentPlanetId, upgrade.id)] = level + 1;
    this.emit();

    return true;
  }

  buyAutoMiner(minerId: string): boolean {
    const miner = this.autoMiners.find(item => item.id === minerId);
    if (!miner) {
      return false;
    }

    if (!this.isAutoMinerVisible(miner)) {
      return false;
    }

    const count = this.getAutoMinerCount(this.state.currentPlanetId, miner.id);
    const cost = this.getScaledCost(miner.baseCost, count, miner.costScaling);
    if (!this.canAfford(cost, this.state.currentPlanetId)) {
      return false;
    }

    this.spendItems(cost, this.state.currentPlanetId);
    this.state.autoMinerCounts[this.getPlanetScopedKey(this.state.currentPlanetId, miner.id)] = count + 1;
    this.emit();

    return true;
  }

  craft(recipeId: string): boolean {
    const recipe = this.recipes.find(item => item.id === recipeId);
    if (
      !recipe ||
      !this.isRecipeVisible(recipe) ||
      !this.canAfford(recipe.ingredients, this.state.currentPlanetId)
    ) {
      return false;
    }

    this.spendItems(recipe.ingredients, this.state.currentPlanetId);
    this.addItem(recipe.outputId, recipe.outputAmount, this.state.currentPlanetId);
    this.emit();

    return true;
  }

  buildShipPart(partId: string): boolean {
    const part = this.shipParts.find(item => item.id === partId);
    if (
      !part ||
      this.isShipPartBuilt(part.id) ||
      !this.canAfford(part.cost, this.state.currentPlanetId)
    ) {
      return false;
    }

    this.spendItems(part.cost, this.state.currentPlanetId);
    this.state.builtShipPartIds = [...this.state.builtShipPartIds, part.id];
    this.emit();

    return true;
  }

  launchShip(): boolean {
    if (this.state.shipLaunched || !this.canLaunchShip()) {
      return false;
    }

    this.state.shipLaunched = true;
    if (this.state.ships.length === 0) {
      this.state.ships = [...this.state.ships, this.createShipInstance('shuttle', this.state.currentPlanetId)];
    }
    this.emit();
    return true;
  }

  buildShip(definitionId: string): boolean {
    const definition = this.getShipDefinition(definitionId);
    if (
      !definition ||
      !this.state.shipLaunched ||
      !this.canAfford(definition.buildCost, this.state.currentPlanetId)
    ) {
      return false;
    }

    this.spendItems(definition.buildCost, this.state.currentPlanetId);
    this.state.ships = [...this.state.ships, this.createShipInstance(definition.id, this.state.currentPlanetId)];
    this.emit();
    return true;
  }

  buildSpaceStation(planetId: string = this.state.currentPlanetId): boolean {
    const planet = this.getPlanet(planetId);
    const blueprint = this.getSpaceStationBlueprintForPlanet(planetId);

    if (
      !planet ||
      !blueprint ||
      !this.state.shipLaunched ||
      !this.isPlanetDiscovered(planetId) ||
      this.hasSpaceStation(planetId) ||
      !this.canAfford(blueprint.buildCost, planetId)
    ) {
      return false;
    }

    this.spendItems(blueprint.buildCost, planetId);
    this.state.spaceStations = [
      ...this.state.spaceStations,
      {
        planetId,
        blueprintId: blueprint.id,
      },
    ];
    this.emit();
    return true;
  }

  saveShipRoute(config: {
    shipId: string;
    originPlanetId: string;
    destinationPlanetId: string;
    itemId: ItemId;
    keepMinimum: number;
  }): boolean {
    const ship = this.getOwnedShip(config.shipId);
    const destination = this.getPlanet(config.destinationPlanetId);
    const origin = this.getPlanet(config.originPlanetId);
    const definition = ship ? this.getShipDefinition(ship.definitionId) : undefined;

    if (
      !ship ||
      !origin ||
      !destination ||
      !definition ||
      origin.id === destination.id ||
      !this.isPlanetDiscovered(origin.id) ||
      !this.isPlanetDiscovered(destination.id) ||
      definition.tier < destination.requiredShipTier
    ) {
      return false;
    }

    const keepMinimum = Math.max(0, Math.floor(config.keepMinimum));
    const existingRoute = this.getShipRoute(config.shipId);
    const route: ShipRoute = {
      id: existingRoute?.id ?? this.createShipRouteId(),
      shipId: config.shipId,
      originPlanetId: origin.id,
      destinationPlanetId: destination.id,
      itemId: config.itemId,
      keepMinimum,
      enabled: true,
    };

    this.state.shipRoutes = [
      ...this.state.shipRoutes.filter(item => item.shipId !== config.shipId),
      route,
    ];
    ship.routeId = route.id;
    this.processFleet(Date.now());
    this.emit();
    return true;
  }

  clearShipRoute(shipId: string): boolean {
    const ship = this.getOwnedShip(shipId);
    const hadRoute = this.state.shipRoutes.some(route => route.shipId === shipId);
    if (!ship || !hadRoute) {
      return false;
    }

    this.state.shipRoutes = this.state.shipRoutes.filter(route => route.shipId !== shipId);
    ship.routeId = null;
    this.emit();
    return true;
  }

  travelToPlanet(planetId: string): boolean {
    const planet = this.getPlanet(planetId);
    if (!planet || planet.id === this.state.currentPlanetId || !this.canTravelToPlanet(planet.id)) {
      return false;
    }

    if (!this.isPlanetDiscovered(planet.id)) {
      this.spendItems(planet.travelCost, this.state.currentPlanetId);
      this.state.discoveredPlanetIds = [...this.state.discoveredPlanetIds, planet.id];
    }

    this.state.currentPlanetId = planet.id;
    this.emit();
    return true;
  }

  resetGame(): void {
    localStorage.removeItem(CURRENT_SAVE_KEY);
    this.state = buildDefaultGameState();
    this.emit();
  }

  hasSavedGame(): boolean {
    return !!localStorage.getItem(CURRENT_SAVE_KEY);
  }

  exportSave(): string {
    this.state.lastTickAt = Date.now();
    this.save();
    return this.encodeSavePayload(this.state);
  }

  exportSaveFileContents(): string {
    this.state.lastTickAt = Date.now();
    this.save();
    return JSON.stringify(this.state, null, 2);
  }

  importSave(raw: string): { ok: true } | { ok: false; error: string } {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { ok: false, error: 'Paste a save string before importing.' };
    }

    try {
      const parsed = this.decodeSavePayload(trimmed);
      this.state = mergeSavedStateWithDefaults(parsed);
      this.state.lastTickAt = Date.now();
      this.save();
      this.emit();
      return { ok: true };
    } catch {
      return { ok: false, error: 'That save string is invalid or from an unsupported format.' };
    }
  }

  getState(): GameState {
    return this.state$.value;
  }

  getCurrentPlanet(): Planet {
    return this.getPlanet(this.state.currentPlanetId) ?? PLANETS[0];
  }

  getPlanet(planetId: string): Planet | undefined {
    return this.planets.find(planet => planet.id === planetId);
  }

  getActiveResource(): ResourceDef {
    return this.getResource(this.state.activeResourceId);
  }

  getResource(resourceId: ResourceId): ResourceDef {
    return this.resources.find(resource => resource.id === resourceId) ?? this.resources[0];
  }

  getInventoryAmount(itemId: ItemId, planetId: string = this.state.currentPlanetId): number {
    return this.getPlanetInventory(planetId)[itemId] ?? 0;
  }

  getNetworkInventoryAmount(itemId: ItemId): number {
    return this.planets.reduce((total, planet) => total + this.getInventoryAmount(itemId, planet.id), 0);
  }

  getPlanetMultiplier(planetId: string, resourceId: ResourceId): number {
    const planet = this.getPlanet(planetId);
    return planet?.resourceMultipliers[resourceId] ?? 1;
  }

  getManualYield(resourceId: ResourceId, planetId: string): number {
    const resource = this.getResource(resourceId);
    const modifiers = this.getProductionModifiers(planetId, resourceId);
    const base = resource.basePerClick + modifiers.flatClick;
    return Math.max(1, Math.floor(base * modifiers.yieldMultiplier * this.getPlanetMultiplier(planetId, resourceId)));
  }

  getAutoRateForPlanetResource(planetId: string, resourceId: ResourceId): number {
    const modifiers = this.getProductionModifiers(planetId, resourceId);

    return this.autoMiners
      .filter(miner => miner.resourceId === resourceId)
      .reduce((total, miner) => {
        const count = this.getAutoMinerCount(planetId, miner.id);
        if (count === 0) {
          return total;
        }

        return (
          total +
          miner.perSecond * count * modifiers.yieldMultiplier * this.getPlanetMultiplier(planetId, resourceId)
        );
      }, 0);
  }

  getTotalAutoRate(resourceId?: ResourceId): number {
    return this.state.discoveredPlanetIds.reduce((total, planetId) => {
      return (
        total +
        RESOURCE_IDS.reduce((planetTotal, currentResourceId) => {
          if (resourceId && currentResourceId !== resourceId) {
            return planetTotal;
          }

          return planetTotal + this.getAutoRateForPlanetResource(planetId, currentResourceId);
        }, 0)
      );
    }, 0);
  }

  getProgressScore(): number {
    return RESOURCE_IDS.reduce((total, resourceId) => total + this.state.totalMined[resourceId], 0);
  }

  getUpgradeLevel(planetId: string, upgradeId: string): number {
    return this.state.upgradeLevels[this.getPlanetScopedKey(planetId, upgradeId)] ?? 0;
  }

  getUpgradeCost(upgrade: ResourceUpgrade, planetId: string = this.state.currentPlanetId): ItemCost[] {
    return this.getScaledCost(
      upgrade.baseCost,
      this.getUpgradeLevel(planetId, upgrade.id),
      upgrade.costScaling,
    );
  }

  getAutoMinerCount(planetId: string, minerId: string): number {
    return this.state.autoMinerCounts[this.getPlanetScopedKey(planetId, minerId)] ?? 0;
  }

  getAutoMinerCost(miner: AutoMiner, planetId: string = this.state.currentPlanetId): ItemCost[] {
    return this.getScaledCost(
      miner.baseCost,
      this.getAutoMinerCount(planetId, miner.id),
      miner.costScaling,
    );
  }

  isUpgradeVisible(upgrade: ResourceUpgrade): boolean {
    return this.state.totalMined[upgrade.resourceId] >= upgrade.unlockAtTotal;
  }

  isAutoMinerVisible(miner: AutoMiner): boolean {
    const meetsTotal = this.state.totalMined[miner.resourceId] >= miner.unlockAtTotal;
    const meetsCraftRequirement =
      !miner.unlockCraftedId ||
      this.getInventoryAmount(miner.unlockCraftedId, this.state.currentPlanetId) > 0;
    return meetsTotal && meetsCraftRequirement;
  }

  isRecipeVisible(recipe: Recipe): boolean {
    return this.getProgressScore() >= recipe.unlockAtTotal;
  }

  hasUnlockedCrafting(): boolean {
    return this.recipes.some(recipe => this.isRecipeVisible(recipe));
  }

  isShipPartBuilt(partId: string): boolean {
    return this.state.builtShipPartIds.includes(partId);
  }

  canLaunchShip(): boolean {
    return this.shipParts.every(part => this.isShipPartBuilt(part.id));
  }

  isPlanetDiscovered(planetId: string): boolean {
    return this.state.discoveredPlanetIds.includes(planetId);
  }

  getDiscoveredPlanets(): Planet[] {
    return this.planets.filter(planet => this.isPlanetDiscovered(planet.id));
  }

  getSpaceStation(planetId: string): OwnedSpaceStation | undefined {
    return this.state.spaceStations.find(station => station.planetId === planetId);
  }

  getSpaceStationBlueprint(blueprintId: string): SpaceStationBlueprint | undefined {
    return this.spaceStationBlueprints.find(blueprint => blueprint.id === blueprintId);
  }

  getSpaceStationBlueprintForPlanet(planetId: string): SpaceStationBlueprint {
    const tier = this.getPlanet(planetId)?.requiredShipTier ?? 0;
    return this.spaceStationBlueprints.find(blueprint => blueprint.tier === tier) ?? this.spaceStationBlueprints[0];
  }

  hasSpaceStation(planetId: string): boolean {
    return !!this.getSpaceStation(planetId);
  }

  getSpaceStationBuildCost(planetId: string = this.state.currentPlanetId): ItemCost[] {
    return this.getSpaceStationBlueprintForPlanet(planetId).buildCost;
  }

  canBuildSpaceStation(planetId: string = this.state.currentPlanetId): boolean {
    return this.state.shipLaunched
      && this.isPlanetDiscovered(planetId)
      && !this.hasSpaceStation(planetId)
      && this.canAfford(this.getSpaceStationBuildCost(planetId), planetId);
  }

  getPlanetRouteCount(
    planetId: string,
    direction: 'inbound' | 'outbound' | 'all' = 'all',
  ): number {
    return this.state.shipRoutes.filter(route => {
      if (!route.enabled) {
        return false;
      }

      if (direction === 'inbound') {
        return route.destinationPlanetId === planetId;
      }

      if (direction === 'outbound') {
        return route.originPlanetId === planetId;
      }

      return route.originPlanetId === planetId || route.destinationPlanetId === planetId;
    }).length;
  }

  getOwnedShip(shipId: string): OwnedShip | undefined {
    return this.state.ships.find(ship => ship.id === shipId);
  }

  getShipDefinition(definitionId: string): Ship | undefined {
    return this.shipDefinitions.find(ship => ship.id === definitionId);
  }

  getShipRoute(shipId: string): ShipRoute | undefined {
    return this.state.shipRoutes.find(route => route.shipId === shipId);
  }

  getHighestOwnedShipTier(): number {
    return this.state.ships.reduce((highestTier, ship) => {
      const definition = this.getShipDefinition(ship.definitionId);
      return Math.max(highestTier, definition?.tier ?? 0);
    }, 0);
  }

  canBuildShip(definitionId: string): boolean {
    const definition = this.getShipDefinition(definitionId);
    return !!definition && this.state.shipLaunched && this.canAfford(definition.buildCost, this.state.currentPlanetId);
  }

  getShipEtaSeconds(ship: OwnedShip): number | null {
    if (!ship.transit) {
      return null;
    }

    return Math.max(0, Math.ceil((ship.transit.arriveAt - Date.now()) / 1000));
  }

  canTravelToPlanet(planetId: string): boolean {
    const planet = this.getPlanet(planetId);
    if (!planet || planet.id === this.state.currentPlanetId || !this.state.shipLaunched) {
      return false;
    }

    if (this.isPlanetDiscovered(planet.id)) {
      return true;
    }

    return this.getHighestOwnedShipTier() >= planet.requiredShipTier
      && this.canAfford(planet.travelCost, this.state.currentPlanetId);
  }

  canAfford(costs: ItemCost[], planetId: string = this.state.currentPlanetId): boolean {
    return costs.every(cost => this.getInventoryAmount(cost.itemId, planetId) >= cost.amount);
  }

  getSpaceStationCargoBonusPercent(planetId: string): number {
    const blueprint = this.getSpaceStationBlueprintForPlanet(planetId);
    return Math.round((blueprint.cargoBonusMultiplier - 1) * 100);
  }

  getSpaceStationTravelReductionPercent(planetId: string): number {
    const blueprint = this.getSpaceStationBlueprintForPlanet(planetId);
    return Math.round((1 - blueprint.travelTimeMultiplier) * 100);
  }

  private applyOfflineProgress(): void {
    const now = Date.now();
    const elapsedSeconds = Math.min(
      MAX_OFFLINE_SECONDS,
      Math.max(0, (now - this.state.lastTickAt) / 1000),
    );

    if (elapsedSeconds > 1) {
      this.applyAutoProduction(elapsedSeconds);
      this.processFleet(now);
    }

    this.state.lastTickAt = now;
  }

  private getProductionModifiers(
    planetId: string,
    resourceId: ResourceId,
  ): { flatClick: number; yieldMultiplier: number } {
    return this.upgrades
      .filter(upgrade => upgrade.resourceId === resourceId)
      .reduce(
        (modifiers, upgrade) => {
          const level = this.getUpgradeLevel(planetId, upgrade.id);
          if (level === 0) {
            return modifiers;
          }

          if (upgrade.effectType === 'flatClick') {
            modifiers.flatClick += upgrade.effectValue * level;
          }

          if (upgrade.effectType === 'yieldMultiplier') {
            modifiers.yieldMultiplier += upgrade.effectValue * level;
          }

          return modifiers;
        },
        { flatClick: 0, yieldMultiplier: 1 },
      );
  }

  private applyAutoProduction(seconds: number): void {
    this.state.discoveredPlanetIds.forEach(planetId => {
      RESOURCE_IDS.forEach(resourceId => {
        const rate = this.getAutoRateForPlanetResource(planetId, resourceId);
        if (rate <= 0) {
          return;
        }

        const gained = rate * seconds;
        this.addItem(resourceId, gained, planetId);
        this.state.totalMined[resourceId] += gained;
      });
    });
  }

  private processFleet(now: number): void {
    let changed = true;
    let guard = 0;

    while (changed && guard < 100) {
      changed = false;
      guard += 1;

      this.state.ships.forEach(ship => {
        if (ship.transit && ship.transit.arriveAt <= now) {
          this.completeShipTransit(ship);
          changed = true;
        }
      });

      this.state.ships.forEach(ship => {
        if (ship.transit || !ship.routeId) {
          return;
        }

        const route = this.getShipRoute(ship.id);
        if (!route || !route.enabled) {
          return;
        }

        if (this.progressShipRoute(ship, route, now)) {
          changed = true;
        }
      });
    }
  }

  private completeShipTransit(ship: OwnedShip): void {
    const transit = ship.transit;
    if (!transit) {
      return;
    }

    ship.currentPlanetId = transit.toPlanetId;
    ship.transit = null;

    if (ship.status === 'outbound' && ship.cargo.itemId && ship.cargo.amount > 0) {
      this.addItem(ship.cargo.itemId, ship.cargo.amount, transit.toPlanetId);
      ship.cargo = { itemId: null, amount: 0 };
    }

    ship.status = 'idle';
  }

  private progressShipRoute(ship: OwnedShip, route: ShipRoute, now: number): boolean {
    const definition = this.getShipDefinition(ship.definitionId);
    const destination = this.getPlanet(route.destinationPlanetId);
    if (!definition || !destination || definition.tier < destination.requiredShipTier) {
      return false;
    }

    const currentPlanetId = ship.currentPlanetId;
    if (!currentPlanetId) {
      return false;
    }

    if (currentPlanetId === route.originPlanetId) {
      const available = this.getInventoryAmount(route.itemId, route.originPlanetId) - route.keepMinimum;
      const effectiveCapacity = Math.max(
        1,
        Math.floor(definition.cargoCapacity * this.getSpaceStationCargoMultiplier(route.originPlanetId)),
      );
      const loadAmount = Math.min(effectiveCapacity, Math.max(0, available));
      if (loadAmount <= 0) {
        return false;
      }

      this.removeItem(route.itemId, loadAmount, route.originPlanetId);
      ship.cargo = { itemId: route.itemId, amount: loadAmount };
      this.startShipTransit(ship, route.destinationPlanetId, now, 'outbound');
      return true;
    }

    this.startShipTransit(ship, route.originPlanetId, now, 'returning');
    return true;
  }

  private startTick(): void {
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.max(0, (now - this.state.lastTickAt) / 1000);
      this.state.lastTickAt = now;

      if (elapsedSeconds <= 0) {
        return;
      }

      this.applyAutoProduction(elapsedSeconds);
      this.processFleet(now);
      this.emit();
    }, TICK_INTERVAL_MS);
  }

  private startShipTransit(
    ship: OwnedShip,
    toPlanetId: string,
    now: number,
    status: ShipStatus,
  ): void {
    if (!ship.currentPlanetId || ship.currentPlanetId === toPlanetId) {
      return;
    }

    const fromPlanetId = ship.currentPlanetId;
    ship.currentPlanetId = null;
    ship.status = status;
    ship.transit = {
      fromPlanetId,
      toPlanetId,
      departAt: now,
      arriveAt: now + this.getTravelDurationMs(fromPlanetId, toPlanetId, ship.definitionId),
    };
  }

  private getTravelDurationMs(fromPlanetId: string, toPlanetId: string, definitionId: string): number {
    const fromPlanet = this.getPlanet(fromPlanetId);
    const toPlanet = this.getPlanet(toPlanetId);
    const definition = this.getShipDefinition(definitionId);
    if (!fromPlanet || !toPlanet || !definition) {
      return BASE_TRAVEL_TIME_MS;
    }

    const distance = Math.abs(fromPlanet.orbitIndex - toPlanet.orbitIndex) + 1;
    const stationMultiplier =
      this.getSpaceStationTravelMultiplier(fromPlanetId) * this.getSpaceStationTravelMultiplier(toPlanetId);
    return Math.round(((distance * BASE_TRAVEL_TIME_MS) / definition.travelSpeed) * stationMultiplier);
  }

  private getScaledCost(costs: ItemCost[], level: number, costScaling: number): ItemCost[] {
    return costs.map(cost => ({
      itemId: cost.itemId,
      amount: Math.max(1, Math.floor(cost.amount * Math.pow(costScaling, level))),
    }));
  }

  private spendItems(costs: ItemCost[], planetId: string): void {
    costs.forEach(cost => {
      this.removeItem(cost.itemId, cost.amount, planetId);
    });
  }

  private addItem(itemId: ItemId, amount: number, planetId: string): void {
    this.getPlanetInventory(planetId)[itemId] += amount;
  }

  private removeItem(itemId: ItemId, amount: number, planetId: string): void {
    this.getPlanetInventory(planetId)[itemId] -= amount;
  }

  private getPlanetScopedKey(planetId: string, entityId: string): string {
    return `${planetId}:${entityId}`;
  }

  private getPlanetInventory(planetId: string): Record<ItemId, number> {
    const inventory = this.state.planetInventories[planetId];
    if (inventory) {
      return inventory;
    }

    const created = buildNumberRecord(ALL_ITEM_IDS);
    this.state.planetInventories[planetId] = created;
    return created;
  }

  private createShipInstance(definitionId: string, planetId: string): OwnedShip {
    const shipId = `ship-${this.state.nextShipId}`;
    this.state.nextShipId += 1;

    return {
      id: shipId,
      definitionId,
      routeId: null,
      status: 'idle',
      currentPlanetId: planetId,
      cargo: { itemId: null, amount: 0 },
      transit: null,
    };
  }

  private createShipRouteId(): string {
    const routeId = `route-${this.state.nextShipRouteId}`;
    this.state.nextShipRouteId += 1;
    return routeId;
  }

  private getSpaceStationCargoMultiplier(planetId: string): number {
    const station = this.getSpaceStation(planetId);
    if (!station) {
      return 1;
    }

    return this.getSpaceStationBlueprint(station.blueprintId)?.cargoBonusMultiplier ?? 1;
  }

  private getSpaceStationTravelMultiplier(planetId: string): number {
    const station = this.getSpaceStation(planetId);
    if (!station) {
      return 1;
    }

    return this.getSpaceStationBlueprint(station.blueprintId)?.travelTimeMultiplier ?? 1;
  }

  private emit(): void {
    this.state$.next({
      ...this.state,
      planetInventories: Object.fromEntries(
        Object.entries(this.state.planetInventories).map(([planetId, inventory]) => [
          planetId,
          { ...inventory },
        ]),
      ),
      upgradeLevels: { ...this.state.upgradeLevels },
      autoMinerCounts: { ...this.state.autoMinerCounts },
      totalMined: { ...this.state.totalMined },
      builtShipPartIds: [...this.state.builtShipPartIds],
      discoveredPlanetIds: [...this.state.discoveredPlanetIds],
      ships: this.state.ships.map(ship => ({
        ...ship,
        cargo: { ...ship.cargo },
        transit: ship.transit ? { ...ship.transit } : null,
      })),
      shipRoutes: this.state.shipRoutes.map(route => ({ ...route })),
      spaceStations: this.state.spaceStations.map(station => ({ ...station })),
    });
  }

  private save(): void {
    localStorage.setItem(CURRENT_SAVE_KEY, JSON.stringify(this.state));
  }

  private encodeSavePayload(state: GameState): string {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return `${SAVE_TRANSFER_PREFIX}${btoa(binary)}`;
  }

  private decodeSavePayload(raw: string): Partial<GameState> {
    if (raw.startsWith(SAVE_TRANSFER_PREFIX)) {
      const encoded = raw.slice(SAVE_TRANSFER_PREFIX.length);
      const binary = atob(encoded);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)) as Partial<GameState>;
    }

    return JSON.parse(raw) as Partial<GameState>;
  }

  private loadOrDefault(): GameState {
    const raw = localStorage.getItem(CURRENT_SAVE_KEY);
    if (!raw) {
      return buildDefaultGameState();
    }

    try {
      const saved = JSON.parse(raw) as LegacySavedState;
      return mergeSavedStateWithDefaults(saved);
    } catch {
      return buildDefaultGameState();
    }
  }
}
