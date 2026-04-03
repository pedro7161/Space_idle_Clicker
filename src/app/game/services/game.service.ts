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
  SHIP_PARTS,
} from '../constants';
import {
  AutoMiner,
  GameState,
  ItemCost,
  ItemId,
  Planet,
  Recipe,
  ResourceDef,
  ResourceId,
  ResourceUpgrade,
  ShipPart,
} from '../models';

const SAVE_KEY = 'space-idle-save-v2';
const SAVE_TRANSFER_PREFIX = 'frontier-miner-save:';
const SAVE_INTERVAL_MS = 10_000;
const TICK_INTERVAL_MS = 200;
const SAVE_VERSION = 2;
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;

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

  readonly state$ = new BehaviorSubject<GameState>(this.buildDefaultState());

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

    this.addItem(resourceId, gained);
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
    if (!this.canAfford(cost)) {
      return false;
    }

    this.spendItems(cost);
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
    if (!this.canAfford(cost)) {
      return false;
    }

    this.spendItems(cost);
    this.state.autoMinerCounts[this.getPlanetScopedKey(this.state.currentPlanetId, miner.id)] = count + 1;
    this.emit();

    return true;
  }

  craft(recipeId: string): boolean {
    const recipe = this.recipes.find(item => item.id === recipeId);
    if (!recipe || !this.isRecipeVisible(recipe) || !this.canAfford(recipe.ingredients)) {
      return false;
    }

    this.spendItems(recipe.ingredients);
    this.addItem(recipe.outputId, recipe.outputAmount);
    this.emit();

    return true;
  }

  buildShipPart(partId: string): boolean {
    const part = this.shipParts.find(item => item.id === partId);
    if (!part || this.isShipPartBuilt(part.id) || !this.canAfford(part.cost)) {
      return false;
    }

    this.spendItems(part.cost);
    this.state.builtShipPartIds = [...this.state.builtShipPartIds, part.id];
    this.emit();

    return true;
  }

  launchShip(): boolean {
    if (this.state.shipLaunched || !this.canLaunchShip()) {
      return false;
    }

    this.state.shipLaunched = true;
    this.emit();
    return true;
  }

  travelToPlanet(planetId: string): boolean {
    const planet = this.getPlanet(planetId);
    if (!planet || planet.id === this.state.currentPlanetId || !this.canTravelToPlanet(planet.id)) {
      return false;
    }

    if (!this.isPlanetDiscovered(planet.id)) {
      this.spendItems(planet.travelCost);
      this.state.discoveredPlanetIds = [...this.state.discoveredPlanetIds, planet.id];
    }

    this.state.currentPlanetId = planet.id;
    this.emit();
    return true;
  }

  resetGame(): void {
    localStorage.removeItem(SAVE_KEY);
    this.state = this.buildDefaultState();
    this.emit();
  }

  hasSavedGame(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
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
      this.state = this.mergeWithDefaults(parsed);
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

  getInventoryAmount(itemId: ItemId): number {
    return this.state.inventory[itemId] ?? 0;
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
    const meetsCraftRequirement = !miner.unlockCraftedId || this.getInventoryAmount(miner.unlockCraftedId) > 0;
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

  canTravelToPlanet(planetId: string): boolean {
    const planet = this.getPlanet(planetId);
    if (!planet || planet.id === this.state.currentPlanetId || !this.state.shipLaunched) {
      return false;
    }

    if (this.isPlanetDiscovered(planet.id)) {
      return true;
    }

    return this.canAfford(planet.travelCost);
  }

  canAfford(costs: ItemCost[]): boolean {
    return costs.every(cost => this.getInventoryAmount(cost.itemId) >= cost.amount);
  }

  private applyOfflineProgress(): void {
    const now = Date.now();
    const elapsedSeconds = Math.min(
      MAX_OFFLINE_SECONDS,
      Math.max(0, (now - this.state.lastTickAt) / 1000),
    );

    if (elapsedSeconds > 1) {
      this.applyAutoProduction(elapsedSeconds);
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
    RESOURCE_IDS.forEach(resourceId => {
      const totalRate = this.getTotalAutoRate(resourceId);
      if (totalRate <= 0) {
        return;
      }

      const gained = totalRate * seconds;
      this.addItem(resourceId, gained);
      this.state.totalMined[resourceId] += gained;
    });
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
      this.emit();
    }, TICK_INTERVAL_MS);
  }

  private getScaledCost(costs: ItemCost[], level: number, costScaling: number): ItemCost[] {
    return costs.map(cost => ({
      itemId: cost.itemId,
      amount: Math.max(1, Math.floor(cost.amount * Math.pow(costScaling, level))),
    }));
  }

  private spendItems(costs: ItemCost[]): void {
    costs.forEach(cost => {
      this.state.inventory[cost.itemId] -= cost.amount;
    });
  }

  private addItem(itemId: ItemId, amount: number): void {
    this.state.inventory[itemId] += amount;
  }

  private getPlanetScopedKey(planetId: string, entityId: string): string {
    return `${planetId}:${entityId}`;
  }

  private emit(): void {
    this.state$.next({
      ...this.state,
      inventory: { ...this.state.inventory },
      upgradeLevels: { ...this.state.upgradeLevels },
      autoMinerCounts: { ...this.state.autoMinerCounts },
      totalMined: { ...this.state.totalMined },
      builtShipPartIds: [...this.state.builtShipPartIds],
      discoveredPlanetIds: [...this.state.discoveredPlanetIds],
    });
  }

  private save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
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
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return this.buildDefaultState();
    }

    try {
      const saved = JSON.parse(raw) as Partial<GameState>;
      return this.mergeWithDefaults(saved);
    } catch {
      return this.buildDefaultState();
    }
  }

  private buildDefaultState(): GameState {
    const startingPlanet = this.planets.find(planet => planet.unlockedByDefault) ?? this.planets[0];

    return {
      version: SAVE_VERSION,
      inventory: buildNumberRecord(ALL_ITEM_IDS),
      activeResourceId: 'carbon',
      upgradeLevels: {},
      autoMinerCounts: {},
      builtShipPartIds: [],
      discoveredPlanetIds: [startingPlanet.id],
      totalClicks: 0,
      totalMined: buildNumberRecord(RESOURCE_IDS),
      currentPlanetId: startingPlanet.id,
      shipLaunched: false,
      lastTickAt: Date.now(),
    };
  }

  private mergeWithDefaults(saved: Partial<GameState>): GameState {
    const defaults = this.buildDefaultState();

    return {
      ...defaults,
      ...saved,
      version: SAVE_VERSION,
      inventory: {
        ...defaults.inventory,
        ...(saved.inventory ?? {}),
      },
      totalMined: {
        ...defaults.totalMined,
        ...(saved.totalMined ?? {}),
      },
      upgradeLevels: saved.upgradeLevels ?? defaults.upgradeLevels,
      autoMinerCounts: saved.autoMinerCounts ?? defaults.autoMinerCounts,
      builtShipPartIds: saved.builtShipPartIds ?? defaults.builtShipPartIds,
      discoveredPlanetIds:
        saved.discoveredPlanetIds && saved.discoveredPlanetIds.length > 0
          ? saved.discoveredPlanetIds
          : defaults.discoveredPlanetIds,
      currentPlanetId:
        saved.currentPlanetId && this.getPlanet(saved.currentPlanetId)
          ? saved.currentPlanetId
          : defaults.currentPlanetId,
      lastTickAt: saved.lastTickAt ?? defaults.lastTickAt,
    };
  }
}
