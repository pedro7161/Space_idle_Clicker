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
import { GAME_MESSAGES, formatMessage } from '../i18n/game-messages';
import {
  AutoMiner,
  ExpeditionState,
  GameState,
  GeneratedPlanetSeed,
  ItemCost,
  ItemId,
  LogisticsLocation,
  LogisticsLocationKind,
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
  createPlanetLocation,
  createStationLocation,
  isSameLogisticsLocation,
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
const EXPEDITION_BASE_DURATION_MS = 45_000;
const EXPEDITION_DURATION_STEP_MS = 18_000;
const EXPEDITION_BASE_FUEL_REQUIRED = 4;
const EXPEDITION_BASE_FUEL_CAPACITY = 6;
const EXPEDITION_FUEL_CAPACITY_STEP = 3;
const EXPEDITION_ENGINE_SPEED_STEP = 0.35;
const FRONTIER_REQUIRED_TIER = 5;
const FRONTIER_ORBIT_GAPS = [2, 3, 4];
const FRONTIER_NAME_PREFIXES = [
  'Astra',
  'Nova',
  'Vesper',
  'Orion',
  'Kepler',
  'Cinder',
  'Halo',
  'Echo',
];
const FRONTIER_NAME_SUFFIXES = [
  'Reach',
  'Drift',
  'Spindle',
  'Crown',
  'Wake',
  'Crossing',
  'Field',
  'Bastion',
];
const FRONTIER_BG_GRADIENTS = [
  'radial-gradient(circle at 50% 120%, #1d4ed8 0%, #0f172a 55%, #020617 100%)',
  'radial-gradient(circle at 50% 120%, #0f766e 0%, #082f49 52%, #020617 100%)',
  'radial-gradient(circle at 50% 120%, #7c3aed 0%, #1f2937 55%, #020617 100%)',
  'radial-gradient(circle at 50% 120%, #be123c 0%, #312e81 55%, #020617 100%)',
];
const FRONTIER_PRIMARY_RESOURCES: ResourceId[] = [
  'copper',
  'silica',
  'hydrogen',
  'titanium',
  'rareCrystal',
  'uranium',
];
const FRONTIER_SUPPORT_RESOURCES: ResourceId[] = [
  'carbon',
  'ferrite',
  'oxygen',
];

function buildNumberRecord<T extends string>(ids: readonly T[]): Record<T, number> {
  return ids.reduce(
    (record, id) => {
      record[id] = 0;
      return record;
    },
    {} as Record<T, number>,
  );
}

function getResourceDefinition(resourceId: ResourceId): ResourceDef {
  return RESOURCE_DEFS.find(resource => resource.id === resourceId) ?? RESOURCE_DEFS[0];
}

function getUniqueResourceIds(resourceIds: ResourceId[]): ResourceId[] {
  return Array.from(new Set(resourceIds));
}

function buildGeneratedPlanetName(sequence: number): string {
  const prefix = FRONTIER_NAME_PREFIXES[(sequence - 1) % FRONTIER_NAME_PREFIXES.length];
  const suffixIndex = Math.floor((sequence - 1) / FRONTIER_NAME_PREFIXES.length) + sequence - 1;
  const suffix = FRONTIER_NAME_SUFFIXES[suffixIndex % FRONTIER_NAME_SUFFIXES.length];
  return `${prefix} ${suffix} ${sequence}`;
}

function buildGeneratedPlanet(seed: GeneratedPlanetSeed): Planet {
  const primaryResource = getResourceDefinition(seed.primaryResourceId);
  const availableResourceIds = getUniqueResourceIds([
    seed.primaryResourceId,
    ...seed.supportResourceIds,
  ]);
  const resourceMultipliers = buildNumberRecord(RESOURCE_IDS);
  resourceMultipliers[seed.primaryResourceId] = 2.9 + ((seed.sequence - 1) % 5) * 0.28;

  availableResourceIds.slice(1).forEach((resourceId, index) => {
    resourceMultipliers[resourceId] = 1.15 + (((seed.sequence + index) % 4) * 0.18) - (index * 0.08);
  });

  const supportLabel = availableResourceIds
    .slice(1)
    .map(resourceId => getResourceDefinition(resourceId).name)
    .join(' / ') || primaryResource.name;

  return {
    id: seed.id,
    name: buildGeneratedPlanetName(seed.sequence),
    description: formatMessage(GAME_MESSAGES.world.frontier.description, {
      primary: primaryResource.name,
      support: supportLabel,
      depth: seed.sequence,
    }),
    availableResourceIds,
    resourceMultipliers,
    travelCost: [],
    requiredShipTier: FRONTIER_REQUIRED_TIER,
    orbitIndex: seed.orbitIndex,
    orbitPosition: seed.orbitPosition,
    unlockedByDefault: false,
    color: primaryResource.color,
    mineralColor: primaryResource.mineralColor,
    bgGradient: FRONTIER_BG_GRADIENTS[(seed.sequence - 1) % FRONTIER_BG_GRADIENTS.length],
  };
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private state!: GameState;
  private initialized = false;

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error('GameService: method called before init()');
    }
  }
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;

  readonly resources = RESOURCE_DEFS;
  readonly craftedItems = CRAFTED_DEFS;
  readonly upgrades = RESOURCE_UPGRADES;
  readonly autoMiners = AUTO_MINERS;
  readonly recipes = RECIPES;
  readonly basePlanets = PLANETS;
  readonly shipParts = SHIP_PARTS;
  readonly shipDefinitions = SHIPS;
  readonly spaceStationBlueprints = SPACE_STATION_BLUEPRINTS;

  readonly state$ = new BehaviorSubject<GameState>(buildDefaultGameState());

  get planets(): Planet[] {
    return [
      ...this.basePlanets,
      ...(this.state?.generatedPlanets ?? []).map(planet => buildGeneratedPlanet(planet)),
    ];
  }

  init(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.state = this.loadOrDefault();
    this.ensureActiveResourceAvailable();
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
    if (gained <= 0) {
      return 0;
    }

    this.addItem(resourceId, gained, planetId);
    this.state.totalClicks += 1;
    this.state.totalMined[resourceId] += gained;
    this.emit();

    return gained;
  }

  setActiveResource(resourceId: ResourceId): void {
    if (
      this.state.activeResourceId === resourceId
      || !this.isResourceAvailableOnPlanet(this.state.currentPlanetId, resourceId)
    ) {
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

    if (!this.isResourceAvailableOnPlanet(this.state.currentPlanetId, upgrade.resourceId)) {
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

    if (!this.isResourceAvailableOnPlanet(this.state.currentPlanetId, miner.resourceId)) {
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
    origin?: LogisticsLocation;
    originPlanetId?: string;
    originKind?: LogisticsLocationKind;
    destination?: LogisticsLocation;
    destinationPlanetId?: string;
    destinationKind?: LogisticsLocationKind;
    itemId: ItemId;
    keepMinimum: number;
  }): boolean {
    const ship = this.getOwnedShip(config.shipId);
    const originLocation = this.resolveConfiguredLocation(config.origin, config.originPlanetId, config.originKind);
    const destinationLocation = this.resolveConfiguredLocation(
      config.destination,
      config.destinationPlanetId,
      config.destinationKind,
    );
    const destination = destinationLocation ? this.getPlanet(destinationLocation.planetId) : undefined;
    const origin = originLocation ? this.getPlanet(originLocation.planetId) : undefined;
    const definition = ship ? this.getShipDefinition(ship.definitionId) : undefined;

    if (
      !ship ||
      !originLocation ||
      !destinationLocation ||
      !origin ||
      !destination ||
      !definition ||
      isSameLogisticsLocation(originLocation, destinationLocation) ||
      !this.isLogisticsLocationAvailable(originLocation) ||
      !this.isLogisticsLocationAvailable(destinationLocation) ||
      definition.tier < destination.requiredShipTier
    ) {
      return false;
    }

    const keepMinimum = Math.max(0, Math.floor(config.keepMinimum));
    const existingRoute = this.getShipRoute(config.shipId);
    const route: ShipRoute = {
      id: existingRoute?.id ?? this.createShipRouteId(),
      shipId: config.shipId,
      originPlanetId: originLocation.planetId,
      originKind: originLocation.kind,
      destinationPlanetId: destinationLocation.planetId,
      destinationKind: destinationLocation.kind,
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
    this.ensureActiveResourceAvailable();
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

    let parsed: Partial<GameState>;
    try {
      parsed = this.decodeSavePayload(trimmed);
    } catch {
      return { ok: false, error: 'That save string is invalid or from an unsupported format.' };
    }

    this.state = mergeSavedStateWithDefaults(parsed);
    this.ensureActiveResourceAvailable();
    this.state.lastTickAt = Date.now();
    this.save();
    this.emit();
    return { ok: true };
  }

  getState(): GameState {
    return this.state$.value;
  }

  getCurrentPlanet(): Planet {
    return this.getPlanet(this.state.currentPlanetId) ?? this.basePlanets[0];
  }

  getPlanet(planetId: string): Planet | undefined {
    return this.planets.find(planet => planet.id === planetId);
  }

  isResourceAvailableOnPlanet(planetId: string, resourceId: ResourceId): boolean {
    const planet = this.getPlanet(planetId);
    return !!planet && planet.availableResourceIds.includes(resourceId);
  }

  getResourcesForPlanet(planetId: string = this.state.currentPlanetId): ResourceDef[] {
    return this.resources.filter(resource => this.isResourceAvailableOnPlanet(planetId, resource.id));
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

  getStationInventoryAmount(itemId: ItemId, planetId: string): number {
    return this.getStationInventory(planetId)[itemId] ?? 0;
  }

  getFleetCargoAmount(itemId: ItemId): number {
    return this.state.ships.reduce((total, ship) => {
      return total + (ship.cargo.itemId === itemId ? ship.cargo.amount : 0);
    }, 0);
  }

  getInventoryAmountAtLocation(itemId: ItemId, location: LogisticsLocation): number {
    return location.kind === 'planet'
      ? this.getInventoryAmount(itemId, location.planetId)
      : this.getStationInventoryAmount(itemId, location.planetId);
  }

  getNetworkInventoryAmount(itemId: ItemId): number {
    const combined = this.planets.reduce((total, planet) => {
      const inv = this.getInventoryAmount(itemId, planet.id);
      const station = this.hasSpaceStation(planet.id) ? this.getStationInventoryAmount(itemId, planet.id) : 0;
      return total + inv + station;
    }, 0);
    return combined + this.getFleetCargoAmount(itemId);
  }

  getPlanetMultiplier(planetId: string, resourceId: ResourceId): number {
    const planet = this.getPlanet(planetId);
    if (!planet || !this.isResourceAvailableOnPlanet(planetId, resourceId)) {
      return 0;
    }

    return planet.resourceMultipliers[resourceId] ?? 0;
  }

  getPlanetAssociatedResourceIds(planetId: string = this.state.currentPlanetId): ResourceId[] {
    const planet = this.getPlanet(planetId);
    if (!planet) {
      return [...RESOURCE_IDS];
    }

    const strongestMultiplier = RESOURCE_IDS.reduce((highest, resourceId) => {
      return Math.max(highest, planet.resourceMultipliers[resourceId] ?? 0);
    }, 0);

    return RESOURCE_IDS.filter(resourceId => {
      return (planet.resourceMultipliers[resourceId] ?? 0) === strongestMultiplier;
    });
  }

  isPlanetAssociatedResource(
    resourceId: ResourceId,
    planetId: string = this.state.currentPlanetId,
  ): boolean {
    return this.getPlanetAssociatedResourceIds(planetId).includes(resourceId);
  }

  getManualYield(resourceId: ResourceId, planetId: string): number {
    if (!this.isResourceAvailableOnPlanet(planetId, resourceId)) {
      return 0;
    }

    const resource = this.getResource(resourceId);
    const modifiers = this.getProductionModifiers(planetId, resourceId);
    const base = resource.basePerClick + modifiers.flatClick;
    return Math.max(1, Math.floor(base * modifiers.yieldMultiplier * this.getPlanetMultiplier(planetId, resourceId)));
  }

  getAutoRateForPlanetResource(planetId: string, resourceId: ResourceId): number {
    if (!this.isResourceAvailableOnPlanet(planetId, resourceId)) {
      return 0;
    }

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

  isAutoMinerVisible(miner: AutoMiner, planetId: string = this.state.currentPlanetId): boolean {
    if (!this.getPlanet(planetId)) {
      return false;
    }
    const meetsTotal = this.state.totalMined[miner.resourceId] >= miner.unlockAtTotal;
    const meetsPlanetAssociation = this.isPlanetAssociatedResource(miner.resourceId, planetId);
    const meetsCraftRequirement =
      !miner.unlockCraftedId ||
      this.getInventoryAmount(miner.unlockCraftedId, planetId) > 0;
    return meetsTotal && meetsPlanetAssociation && meetsCraftRequirement;
  }

  isRecipeVisible(recipe: Recipe, planetId: string = this.state.currentPlanetId): boolean {
    return this.getProgressScore() >= recipe.unlockAtTotal
      && recipe.resourceIds.some(resourceId => this.isPlanetAssociatedResource(resourceId, planetId));
  }

  hasUnlockedCrafting(planetId: string = this.state.currentPlanetId): boolean {
    return this.recipes.some(recipe => this.isRecipeVisible(recipe, planetId));
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

  hasUnlockedExpeditionProgram(): boolean {
    return this.basePlanets.every(planet => this.isPlanetDiscovered(planet.id));
  }

  hasExplorerShip(): boolean {
    return this.state.expedition.shipBuilt;
  }

  getExplorerShipBuildCost(): ItemCost[] {
    return [
      { itemId: 'titaniumAlloy', amount: 6 },
      { itemId: 'reactorCores', amount: 2 },
      { itemId: 'rareCrystal', amount: 18 },
      { itemId: 'hydrogen', amount: 60 },
      { itemId: 'basicCircuits', amount: 24 },
    ];
  }

  canBuildExplorerShip(): boolean {
    return this.hasUnlockedExpeditionProgram()
      && !this.state.expedition.shipBuilt
      && this.canAfford(this.getExplorerShipBuildCost(), this.state.currentPlanetId);
  }

  buildExplorerShip(): boolean {
    if (!this.canBuildExplorerShip()) {
      return false;
    }

    this.spendItems(this.getExplorerShipBuildCost(), this.state.currentPlanetId);
    this.state.expedition.shipBuilt = true;
    this.emit();
    return true;
  }

  getExplorerEngineUpgradeCost(): ItemCost[] {
    const level = this.state.expedition.engineLevel;
    return [
      { itemId: 'hydrogen', amount: 30 + (level * 16) },
      { itemId: 'basicCircuits', amount: 12 + (level * 6) },
      { itemId: 'titaniumAlloy', amount: 2 + level },
      { itemId: 'reactorCores', amount: 1 + Math.floor(level / 2) },
    ];
  }

  canUpgradeExplorerEngine(): boolean {
    return this.state.expedition.shipBuilt
      && !this.state.expedition.activeMission
      && this.canAfford(this.getExplorerEngineUpgradeCost(), this.state.currentPlanetId);
  }

  upgradeExplorerEngine(): boolean {
    if (!this.canUpgradeExplorerEngine()) {
      return false;
    }

    this.spendItems(this.getExplorerEngineUpgradeCost(), this.state.currentPlanetId);
    this.state.expedition.engineLevel += 1;
    this.emit();
    return true;
  }

  getExplorerFuelUpgradeCost(): ItemCost[] {
    const level = this.state.expedition.fuelLevel;
    return [
      { itemId: 'oxygenCells', amount: 18 + (level * 14) },
      { itemId: 'refinedMetal', amount: 28 + (level * 18) },
      { itemId: 'rareCrystal', amount: 8 + (level * 6) },
      { itemId: 'titaniumAlloy', amount: 2 + level },
    ];
  }

  canUpgradeExplorerFuel(): boolean {
    return this.state.expedition.shipBuilt
      && !this.state.expedition.activeMission
      && this.canAfford(this.getExplorerFuelUpgradeCost(), this.state.currentPlanetId);
  }

  upgradeExplorerFuel(): boolean {
    if (!this.canUpgradeExplorerFuel()) {
      return false;
    }

    this.spendItems(this.getExplorerFuelUpgradeCost(), this.state.currentPlanetId);
    this.state.expedition.fuelLevel += 1;
    this.emit();
    return true;
  }

  getExplorerTravelSpeed(): number {
    return 1 + (this.state.expedition.engineLevel * EXPEDITION_ENGINE_SPEED_STEP);
  }

  getExplorerFuelCapacity(): number {
    return EXPEDITION_BASE_FUEL_CAPACITY + (this.state.expedition.fuelLevel * EXPEDITION_FUEL_CAPACITY_STEP);
  }

  getNextExpeditionFuelRequired(): number {
    return EXPEDITION_BASE_FUEL_REQUIRED + this.state.expedition.expeditionsCompleted;
  }

  getNextExpeditionDurationMs(): number {
    const baseDuration = EXPEDITION_BASE_DURATION_MS + (this.state.expedition.expeditionsCompleted * EXPEDITION_DURATION_STEP_MS);
    return Math.max(8_000, Math.round(baseDuration / this.getExplorerTravelSpeed()));
  }

  getNextExpeditionLaunchCost(): ItemCost[] {
    const completed = this.state.expedition.expeditionsCompleted;
    const fuelRequired = this.getNextExpeditionFuelRequired();
    const costs: ItemCost[] = [
      { itemId: 'hydrogen', amount: fuelRequired * 10 },
      { itemId: 'oxygenCells', amount: fuelRequired * 3 },
    ];

    if (completed >= 2) {
      costs.push({ itemId: 'basicCircuits', amount: 4 + Math.floor(completed / 2) });
    }

    if (completed >= 4) {
      costs.push({ itemId: 'rareCrystal', amount: 6 + Math.floor(completed / 3) });
    }

    if (completed >= 7) {
      costs.push({ itemId: 'reactorCores', amount: 1 + Math.floor((completed - 4) / 4) });
    }

    return costs;
  }

  getExpeditionTargetPlanet(): Planet {
    const targetSequence = this.state.expedition.activeMission?.targetSequence ?? (this.state.expedition.expeditionsCompleted + 1);
    return buildGeneratedPlanet(this.buildGeneratedPlanetSeed(targetSequence));
  }

  isExpeditionInProgress(): boolean {
    return !!this.state.expedition.activeMission;
  }

  getExpeditionEtaSeconds(now: number = Date.now()): number | null {
    const mission = this.state.expedition.activeMission;
    if (!mission) {
      return null;
    }

    return Math.max(0, Math.ceil((mission.arriveAt - now) / 1000));
  }

  canStartExpedition(): boolean {
    const launchCost = this.getNextExpeditionLaunchCost();
    return this.hasUnlockedExpeditionProgram()
      && this.state.expedition.shipBuilt
      && !this.state.expedition.activeMission
      && this.getNextExpeditionFuelRequired() <= this.getExplorerFuelCapacity()
      && this.canAfford(launchCost, this.state.currentPlanetId);
  }

  startExpedition(): boolean {
    if (!this.canStartExpedition()) {
      return false;
    }

    const now = Date.now();
    const launchCost = this.getNextExpeditionLaunchCost();
    this.spendItems(launchCost, this.state.currentPlanetId);
    this.state.expedition.activeMission = {
      targetSequence: this.state.expedition.expeditionsCompleted + 1,
      departAt: now,
      arriveAt: now + this.getNextExpeditionDurationMs(),
      fuelRequired: this.getNextExpeditionFuelRequired(),
      launchCost,
    };
    this.emit();
    return true;
  }

  getAvailableLogisticsLocations(): LogisticsLocation[] {
    return this.getDiscoveredPlanets().flatMap(planet => {
      const locations: LogisticsLocation[] = [createPlanetLocation(planet.id)];
      if (this.hasSpaceStation(planet.id)) {
        locations.push(createStationLocation(planet.id));
      }

      return locations;
    });
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

  getLocationRouteCount(
    location: LogisticsLocation,
    direction: 'inbound' | 'outbound' | 'all' = 'all',
  ): number {
    return this.state.shipRoutes.filter(route => {
      if (!route.enabled) {
        return false;
      }

      const routeOrigin = this.getRouteOriginLocation(route);
      const routeDestination = this.getRouteDestinationLocation(route);

      if (direction === 'inbound') {
        return isSameLogisticsLocation(routeDestination, location);
      }

      if (direction === 'outbound') {
        return isSameLogisticsLocation(routeOrigin, location);
      }

      return isSameLogisticsLocation(routeOrigin, location) || isSameLogisticsLocation(routeDestination, location);
    }).length;
  }

  getOwnedShip(shipId: string): OwnedShip | undefined {
    return this.state.ships.find(ship => ship.id === shipId);
  }

  getShipDockLocation(ship: OwnedShip): LogisticsLocation | null {
    if (!ship.currentPlanetId || !ship.currentLocationKind) {
      return null;
    }

    return this.createLocation(ship.currentPlanetId, ship.currentLocationKind);
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

  getShipEtaSeconds(ship: OwnedShip, now: number = Date.now()): number | null {
    if (!ship.transit) {
      return null;
    }

    return Math.max(0, Math.ceil((ship.transit.arriveAt - now) / 1000));
  }

  getPlanetDistance(fromPlanetId: string, toPlanetId: string): number | null {
    const fromPlanet = this.getPlanet(fromPlanetId);
    const toPlanet = this.getPlanet(toPlanetId);
    if (!fromPlanet || !toPlanet) {
      return null;
    }

    return Math.abs(fromPlanet.orbitPosition - toPlanet.orbitPosition);
  }

  getShipTransitProgress(ship: OwnedShip, now: number = Date.now()): number | null {
    if (!ship.transit) {
      return null;
    }

    const totalDuration = Math.max(1, ship.transit.arriveAt - ship.transit.departAt);
    const elapsed = now - ship.transit.departAt;
    return Math.min(1, Math.max(0, elapsed / totalDuration));
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

  grantDevResources(
    amount: number,
    scope: 'currentPlanet' | 'allPlanets' = 'currentPlanet',
  ): boolean {
    const normalizedAmount = Math.floor(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return false;
    }

    const targetPlanetIds = scope === 'allPlanets'
      ? this.planets.map(planet => planet.id)
      : [this.state.currentPlanetId];

    targetPlanetIds.forEach(planetId => {
      ALL_ITEM_IDS.forEach(itemId => {
        this.addItem(itemId, normalizedAmount, planetId);
      });
    });

    RESOURCE_IDS.forEach(resourceId => {
      this.state.totalMined[resourceId] += normalizedAmount * targetPlanetIds.length;
    });

    this.emit();
    return true;
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
      this.processExpeditions(now);
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
      const rateCache = new Map<string, number>();
      RESOURCE_IDS.forEach(resourceId => {
        rateCache.set(resourceId, this.getAutoRateForPlanetResource(planetId, resourceId));
      });

      RESOURCE_IDS.forEach(resourceId => {
        const rate = rateCache.get(resourceId) ?? 0;
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

    const routeByShipId = new Map<string, ShipRoute>(
      this.state.shipRoutes.map(route => [route.shipId, route])
    );

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

        const route = routeByShipId.get(ship.id);
        if (!route || !route.enabled) {
          return;
        }

        if (this.progressShipRoute(ship, route, now)) {
          changed = true;
        }
      });
    }

    if (guard >= 100) {
      console.warn(`[GameService] processFleet guard limit reached (${guard} iterations). Possible infinite loop in ship routing.`);
    }
  }

  private completeShipTransit(ship: OwnedShip): void {
    const transit = ship.transit;
    if (!transit) {
      return;
    }

    ship.currentPlanetId = transit.toPlanetId;
    ship.currentLocationKind = transit.toKind;
    ship.transit = null;

    if (ship.status === 'outbound' && ship.cargo.itemId && ship.cargo.amount > 0) {
      this.addItemToLocation(ship.cargo.itemId, ship.cargo.amount, {
        planetId: transit.toPlanetId,
        kind: transit.toKind,
      });
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

    const currentLocation = this.getShipDockLocation(ship);
    if (!currentLocation) {
      return false;
    }

    const originLocation = this.getRouteOriginLocation(route);
    if (isSameLogisticsLocation(currentLocation, originLocation)) {
      const available = this.getInventoryAmountAtLocation(route.itemId, originLocation) - route.keepMinimum;
      const effectiveCapacity = Math.max(
        1,
        Math.floor(definition.cargoCapacity * this.getSpaceStationCargoMultiplier(route.originPlanetId)),
      );
      const loadAmount = Math.min(effectiveCapacity, Math.max(0, available));
      if (loadAmount <= 0) {
        return false;
      }

      this.removeItemFromLocation(route.itemId, loadAmount, originLocation);
      ship.cargo = { itemId: route.itemId, amount: loadAmount };
      this.startShipTransit(ship, route.destinationPlanetId, route.destinationKind, now, 'outbound');
      return true;
    }

    this.startShipTransit(ship, route.originPlanetId, route.originKind, now, 'returning');
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
      this.processExpeditions(now);
      this.emit();
    }, TICK_INTERVAL_MS);
  }

  private processExpeditions(now: number): void {
    const mission = this.state.expedition.activeMission;
    if (!mission || mission.arriveAt > now) {
      return;
    }

    const seed = this.buildGeneratedPlanetSeed(mission.targetSequence);
    if (!this.state.generatedPlanets.some(planet => planet.id === seed.id)) {
      this.state.generatedPlanets = [...this.state.generatedPlanets, seed];
      this.getPlanetInventory(seed.id);
      this.getStationInventory(seed.id);
    }

    if (!this.state.discoveredPlanetIds.includes(seed.id)) {
      this.state.discoveredPlanetIds = [...this.state.discoveredPlanetIds, seed.id];
    }

    this.state.expedition.expeditionsCompleted += 1;
    this.state.expedition.activeMission = null;
  }

  private startShipTransit(
    ship: OwnedShip,
    toPlanetId: string,
    toKind: LogisticsLocationKind,
    now: number,
    status: ShipStatus,
  ): void {
    if (
      !ship.currentPlanetId
      || !ship.currentLocationKind
      || (ship.currentPlanetId === toPlanetId && ship.currentLocationKind === toKind)
    ) {
      return;
    }

    const fromPlanetId = ship.currentPlanetId;
    const fromKind = ship.currentLocationKind;
    ship.currentPlanetId = null;
    ship.currentLocationKind = null;
    ship.status = status;
    ship.transit = {
      fromPlanetId,
      fromKind,
      toPlanetId,
      toKind,
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

    const distance = this.getTravelDistanceFactor(fromPlanetId, toPlanetId);
    const stationMultiplier =
      this.getSpaceStationTravelMultiplier(fromPlanetId) * this.getSpaceStationTravelMultiplier(toPlanetId);
    return Math.round(((distance * BASE_TRAVEL_TIME_MS) / definition.travelSpeed) * stationMultiplier);
  }

  private getTravelDistanceFactor(fromPlanetId: string, toPlanetId: string): number {
    const distance = this.getPlanetDistance(fromPlanetId, toPlanetId);
    if (distance === null) {
      return 1;
    }

    return distance + 1;
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

  private getStationInventory(planetId: string): Record<ItemId, number> {
    const inventory = this.state.stationInventories[planetId];
    if (inventory) {
      return inventory;
    }

    const created = buildNumberRecord(ALL_ITEM_IDS);
    this.state.stationInventories[planetId] = created;
    return created;
  }

  private ensureActiveResourceAvailable(): void {
    if (this.isResourceAvailableOnPlanet(this.state.currentPlanetId, this.state.activeResourceId)) {
      return;
    }

    const fallback = this.getResourcesForPlanet(this.state.currentPlanetId)[0] ?? this.resources[0];
    this.state.activeResourceId = fallback.id;
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
      currentLocationKind: 'planet',
      cargo: { itemId: null, amount: 0 },
      transit: null,
    };
  }

  private createShipRouteId(): string {
    const routeId = `route-${this.state.nextShipRouteId}`;
    this.state.nextShipRouteId += 1;
    return routeId;
  }

  private buildGeneratedPlanetSeed(sequence: number): GeneratedPlanetSeed {
    const existingPlanet = this.state.generatedPlanets.find(planet => planet.sequence === sequence);
    if (existingPlanet) {
      return existingPlanet;
    }

    const highestOrbitIndex = this.planets.reduce((highest, planet) => Math.max(highest, planet.orbitIndex), 0);
    const highestOrbitPosition = this.planets.reduce((highest, planet) => Math.max(highest, planet.orbitPosition), 0);
    const primaryResourceId = FRONTIER_PRIMARY_RESOURCES[(sequence - 1) % FRONTIER_PRIMARY_RESOURCES.length];
    const supportResourceIds = getUniqueResourceIds([
      FRONTIER_SUPPORT_RESOURCES[(sequence + 1) % FRONTIER_SUPPORT_RESOURCES.length],
      FRONTIER_PRIMARY_RESOURCES[(sequence + 2) % FRONTIER_PRIMARY_RESOURCES.length],
    ]).filter(resourceId => resourceId !== primaryResourceId).slice(0, 2);

    return {
      id: `frontier-${sequence}`,
      sequence,
      primaryResourceId,
      supportResourceIds,
      orbitIndex: highestOrbitIndex + 1,
      orbitPosition: highestOrbitPosition + FRONTIER_ORBIT_GAPS[(sequence - 1) % FRONTIER_ORBIT_GAPS.length],
    };
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

  private isLogisticsLocationAvailable(location: LogisticsLocation): boolean {
    return location.kind === 'planet'
      ? this.isPlanetDiscovered(location.planetId)
      : this.isPlanetDiscovered(location.planetId) && this.hasSpaceStation(location.planetId);
  }

  private resolveConfiguredLocation(
    location: LogisticsLocation | undefined,
    planetId: string | undefined,
    kind: LogisticsLocationKind | undefined,
  ): LogisticsLocation | null {
    if (location) {
      return this.createLocation(location.planetId, location.kind);
    }

    if (!planetId) {
      return null;
    }

    return this.createLocation(planetId, kind ?? 'planet');
  }

  private createLocation(planetId: string, kind: LogisticsLocationKind): LogisticsLocation {
    return kind === 'station' ? createStationLocation(planetId) : createPlanetLocation(planetId);
  }

  private getRouteOriginLocation(route: ShipRoute): LogisticsLocation {
    return this.createLocation(route.originPlanetId, route.originKind);
  }

  private getRouteDestinationLocation(route: ShipRoute): LogisticsLocation {
    return this.createLocation(route.destinationPlanetId, route.destinationKind);
  }

  private addItemToLocation(itemId: ItemId, amount: number, location: LogisticsLocation): void {
    if (location.kind === 'planet') {
      this.addItem(itemId, amount, location.planetId);
      return;
    }

    this.getStationInventory(location.planetId)[itemId] += amount;
  }

  private removeItemFromLocation(itemId: ItemId, amount: number, location: LogisticsLocation): void {
    if (location.kind === 'planet') {
      this.removeItem(itemId, amount, location.planetId);
      return;
    }

    this.getStationInventory(location.planetId)[itemId] -= amount;
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
      stationInventories: Object.fromEntries(
        Object.entries(this.state.stationInventories).map(([planetId, inventory]) => [
          planetId,
          { ...inventory },
        ]),
      ),
      generatedPlanets: this.state.generatedPlanets.map(planet => ({
        ...planet,
        supportResourceIds: [...planet.supportResourceIds],
      })),
      expedition: {
        ...this.state.expedition,
        activeMission: this.state.expedition.activeMission
          ? {
            ...this.state.expedition.activeMission,
            launchCost: this.state.expedition.activeMission.launchCost.map(cost => ({ ...cost })),
          }
          : null,
      },
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
    try {
      localStorage.setItem(CURRENT_SAVE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota exceeded or storage unavailable — game state is preserved in memory
    }
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
