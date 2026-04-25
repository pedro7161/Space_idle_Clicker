import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { MapComponent } from '../map/map.component';
import { GameService } from '../../services/game.service';
import { TutorialService } from '../../services/tutorial.service';
import { GameMessagesService } from '../../i18n/game-messages';
import { MILITARY_RECIPES, MILITARY_BUILDINGS } from '../../constants';
import {
  AttackResult,
  AutoMiner,
  FactionAngerEvent,
  ItemCost,
  ItemId,
  MilitaryBuilding,
  MilitaryBuildingId,
  MilitaryUnitDef,
  MilitaryUnitId,
  MilitaryUnitTransit,
  Planet,
  RaidEvent,
  Recipe,
  ResourceDef,
  ResourceUpgrade,
  ShipPart,
} from '../../models';

type Tab = 'inventory' | 'upgrades' | 'crafting' | 'automation' | 'launch' | 'military';
type PanelLayout = 'sidebar' | 'workspace';

interface TabDef {
  key: Tab;
  label: string;
}

@Component({
  selector: 'app-upgrade-panel',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe, MapComponent],
  templateUrl: './upgrade-panel.component.html',
})
export class UpgradePanelComponent implements OnDestroy {
  readonly layout = input<PanelLayout>('sidebar');
  readonly mobileOpen = input(false);
  readonly closeRequested = output<void>();
  readonly workspaceToggleRequested = output<void>();
  activeTab: Tab = 'upgrades';
  inventoryPanelHeight: number | null = null;
  isResizingInventory = false;
  attackSystemModal: string | null = null;
  attackUnits: Record<string, number> = {};
  invasionAttackModal: string | null = null;
  invasionAttackUnits: Record<string, number> = {};
  mapOpen = false;
  now = Date.now();
  private readonly nowTimer: ReturnType<typeof setInterval>;

  private readonly sidebarTabs: TabDef[];
  private readonly workspaceTabs: TabDef[];
  readonly panelShell = viewChild<ElementRef<HTMLElement>>('panelShell');
  readonly inventorySection = viewChild<ElementRef<HTMLElement>>('inventorySection');
  readonly tabBar = viewChild<ElementRef<HTMLElement>>('tabBar');

  private resizeStartY = 0;
  private resizeStartHeight = 0;
  private readonly inventoryMinHeight = 180;
  private readonly contentMinHeight = 220;
  private readonly handleHeight = 16;
  private readonly onInventoryResizeMove = (event: PointerEvent): void => {
    if (!this.isResizingInventory) {
      return;
    }

    const delta = event.clientY - this.resizeStartY;
    this.inventoryPanelHeight = this.clampInventoryHeight(this.resizeStartHeight + delta);
  };

  private readonly stopInventoryResize = (): void => {
    if (!this.isResizingInventory) {
      return;
    }

    this.isResizingInventory = false;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', this.onInventoryResizeMove);
    window.removeEventListener('pointerup', this.stopInventoryResize);
    window.removeEventListener('pointercancel', this.stopInventoryResize);
  };

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
    public tutorial: TutorialService,
  ) {
    this.nowTimer = setInterval(() => { this.now = Date.now(); }, 1000);
    const tabMessages = this.copy.messages.ui.upgradePanel.tabs;
    this.sidebarTabs = [
      { key: 'upgrades', label: tabMessages.upgrades },
      { key: 'crafting', label: tabMessages.crafting },
      { key: 'automation', label: tabMessages.automation },
      { key: 'launch', label: tabMessages.launch },
      { key: 'military', label: 'Military' }, // TODO: add to i18n
    ];
    this.workspaceTabs = [
      { key: 'inventory', label: tabMessages.inventory },
      ...this.sidebarTabs,
    ];

    effect(() => {
      if (!this.isWorkspaceLayout && this.activeTab === 'inventory') {
        this.activeTab = 'upgrades';
      }
    });
  }

  ngOnDestroy(): void {
    this.stopInventoryResize();
    clearInterval(this.nowTimer);
  }

  get resources(): ResourceDef[] {
    return this.game.resources;
  }

  get currentPlanetResources(): ResourceDef[] {
    return this.game.getResourcesForPlanet(this.currentPlanet.id);
  }

  get craftedItems() {
    return this.game.craftedItems;
  }

  get currentPlanet(): Planet {
    return this.game.getCurrentPlanet();
  }

  get focusResources(): ResourceDef[] {
    const focusIds = this.game.getPlanetAssociatedResourceIds(this.currentPlanet.id);
    return this.resources.filter(resource => focusIds.includes(resource.id));
  }

  get visibleRecipes(): Recipe[] {
    return this.game.recipes.filter(recipe => this.game.isRecipeVisible(recipe));
  }

  isRecipeGloballyUnlocked(recipe: Recipe): boolean {
    return this.game.isRecipeGloballyUnlocked(recipe.id);
  }

  unlockRecipeGlobally(recipe: Recipe): void {
    this.game.unlockRecipeGlobally(recipe.id);
  }

  get visibleAutoMiners(): AutoMiner[] {
    return this.game.autoMiners.filter(miner => this.game.isAutoMinerVisible(miner));
  }

  get planets(): Planet[] {
    return this.game.planets;
  }

  get shipParts(): ShipPart[] {
    return this.game.shipParts;
  }

  get state() {
    return this.game.getState();
  }

  get panelGridRows(): string | null {
    if (this.inventoryPanelHeight === null) {
      return null;
    }

    return `${this.inventoryPanelHeight}px ${this.handleHeight}px auto minmax(0, 1fr)`;
  }

  get tabs(): TabDef[] {
    const allTabs = this.isWorkspaceLayout ? this.workspaceTabs : this.sidebarTabs;
    return allTabs.filter(tab => tab.key !== 'military' || this.game.isCombatUnlocked());
  }

  get activeTabLabel(): string {
    return this.tabs.find(tab => tab.key === this.activeTab)?.label ?? this.tabs[0].label;
  }

  get isWorkspaceLayout(): boolean {
    return this.layout() === 'workspace';
  }

  get workspaceToggleLabel(): string {
    return this.isWorkspaceLayout
      ? this.copy.messages.ui.upgradePanel.collapseWorkspace
      : this.copy.messages.ui.upgradePanel.expandWorkspace;
  }

  getResourceUpgrades(resourceId: ResourceDef['id']): ResourceUpgrade[] {
    return this.game.upgrades
      .filter(upgrade => upgrade.resourceId === resourceId && this.game.isUpgradeVisible(upgrade))
      .sort((left, right) => {
        if (left.unlockAtTotal !== right.unlockAtTotal) {
          return left.unlockAtTotal - right.unlockAtTotal;
        }

        return left.id.localeCompare(right.id);
      });
  }

  getActiveResourceUpgrades(resourceId: ResourceDef['id']): ResourceUpgrade[] {
    return this.getResourceUpgrades(resourceId)
      .filter(upgrade => this.getUpgradeLevel(upgrade) < upgrade.maxLevel)
      .slice(0, 2);
  }

  getCompletedResourceUpgrades(resourceId: ResourceDef['id']): ResourceUpgrade[] {
    return this.getResourceUpgrades(resourceId)
      .filter(upgrade => this.getUpgradeLevel(upgrade) >= upgrade.maxLevel);
  }

  getQueuedUpgradeCount(resourceId: ResourceDef['id']): number {
    const unlockedInProgress = this.getResourceUpgrades(resourceId)
      .filter(upgrade => this.getUpgradeLevel(upgrade) < upgrade.maxLevel);
    return Math.max(0, unlockedInProgress.length - this.getActiveResourceUpgrades(resourceId).length);
  }

  getQueuedUpgradeLabel(resource: ResourceDef): string | null {
    const count = this.getQueuedUpgradeCount(resource.id);
    if (count <= 0) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.upgradePanel.queuedUpgrades, {
      count,
    });
  }

  getMinersForResource(resourceId: ResourceDef['id']): AutoMiner[] {
    return this.visibleAutoMiners.filter(miner => miner.resourceId === resourceId);
  }

  getLockedMinersForResource(resourceId: ResourceDef['id']): AutoMiner[] {
    return this.game.autoMiners.filter(
      miner => miner.resourceId === resourceId && !this.game.isAutoMinerVisible(miner),
    );
  }

  getItemAmount(itemId: ItemId): number {
    return this.game.getInventoryAmount(itemId);
  }

  getItemLabel(itemId: ItemId): string {
    const resource = this.game.resources.find(item => item.id === itemId);
    if (resource) {
      return resource.name;
    }

    return this.game.craftedItems.find(item => item.id === itemId)?.name ?? itemId;
  }

  getItemColor(itemId: ItemId): string {
    const resource = this.game.resources.find(item => item.id === itemId);
    if (resource) {
      return resource.color;
    }

    return this.game.craftedItems.find(item => item.id === itemId)?.color ?? '#cbd5e1';
  }

  getUpgradeLevel(upgrade: ResourceUpgrade): number {
    return this.game.getUpgradeLevel(this.currentPlanet.id, upgrade.id);
  }

  canAffordUpgrade(upgrade: ResourceUpgrade): boolean {
    return this.getUpgradeLevel(upgrade) < upgrade.maxLevel
      && this.game.canAfford(this.game.getUpgradeCost(upgrade));
  }

  hasAffordableUpgrades(): boolean {
    return this.game.upgrades
      .filter(u => this.game.isUpgradeVisible(u))
      .some(u => this.canAffordUpgrade(u));
  }

  shouldHighlightTab(tabKey: Tab): boolean {
    const step = this.tutorial.activeStep$.value;
    if (!step) return false;
    if (tabKey === 'upgrades') {
      return step.id === 'tut_open_upgrades' || step.id === 'tut_buy_first_upgrade';
    }
    return false;
  }

  getAutoMinerCount(miner: AutoMiner): number {
    return this.game.getAutoMinerCount(this.currentPlanet.id, miner.id);
  }

  getAutoMinerOutput(miner: AutoMiner): number {
    const count = this.getAutoMinerCount(miner);
    if (count === 0) {
      return 0;
    }

    const totalResourceRate = this.game.getAutoRateForPlanetResource(this.currentPlanet.id, miner.resourceId);
    const resourceMiners = this.getMinersForResource(miner.resourceId);
    const totalBase = resourceMiners.reduce((sum, item) => {
      return sum + item.perSecond * this.getAutoMinerCount(item);
    }, 0);

    if (totalBase <= 0) {
      return 0;
    }

    return totalResourceRate * ((miner.perSecond * count) / totalBase);
  }

  canBuildShipPart(part: ShipPart): boolean {
    return !this.game.isShipPartBuilt(part.id) && this.game.canAfford(part.cost);
  }

  canCraftMilitary(recipeId: string): boolean {
    const recipe = MILITARY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) {
      return false;
    }
    return this.game.canAfford(recipe.ingredients);
  }

  getMilitaryRecipeIngredients(recipeId: string): Recipe['ingredients'] | null {
    const recipe = MILITARY_RECIPES.find(r => r.id === recipeId);
    return recipe?.ingredients ?? null;
  }

  getMilitaryUnitDef(unitId: MilitaryUnitId): MilitaryUnitDef | undefined {
    return this.game.militaryUnits.find(u => u.id === unitId);
  }

  getGarrisonsForPlanet(planetId: string) {
    return this.state.deployedGarrisons.filter(g => g.planetId === planetId);
  }

  getUnitTotalAvailable(unitId: string): number {
    const inv = this.game.getInventoryAmount(unitId as ItemId);
    const garrison = this.state.deployedGarrisons.find(
      g => g.planetId === this.currentPlanet.id && g.unitId === unitId as MilitaryUnitId,
    );
    return inv + (garrison?.count ?? 0);
  }

  hasAvailableUnits(): boolean {
    return this.game.militaryUnits.some(unit => this.getUnitTotalAvailable(unit.id) > 0);
  }

  get visibleMilitaryBuildings(): MilitaryBuilding[] {
    return MILITARY_BUILDINGS.filter(b => this.game.isMilitaryBuildingVisible(b));
  }

  getMilitaryBuildingLevel(id: MilitaryBuildingId): number {
    return this.game.getMilitaryBuildingLevel(this.currentPlanet.id, id);
  }

  getMilitaryBuildingCost(building: MilitaryBuilding): ItemCost[] {
    return this.game.getMilitaryBuildingCost(building);
  }

  getMilitaryBuildingEffectLabel(building: MilitaryBuilding): string {
    const level = this.getMilitaryBuildingLevel(building.id);
    return level === 0 ? 'Not built' : building.effectSummary(level);
  }

  isMilitaryBuildingMaxed(building: MilitaryBuilding): boolean {
    return this.getMilitaryBuildingLevel(building.id) >= building.maxLevel;
  }

  buyMilitaryBuilding(building: MilitaryBuilding): void {
    this.game.buyMilitaryBuilding(building.id);
  }

  canAffordMilitaryBuilding(building: MilitaryBuilding): boolean {
    return this.game.canAfford(this.getMilitaryBuildingCost(building), this.currentPlanet.id);
  }

  formatCountdown(arriveAt: number, arrivedLabel = 'Arriving...'): string {
    const diff = arriveAt - this.now;
    if (diff <= 0) return arrivedLabel;
    const seconds = Math.ceil(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  getUnitsInTransitTo(planetId: string) {
    return this.state.unitsInTransit.filter(t => t.toPlanetId === planetId);
  }

  getUnitsInTransitCount(unitId: string): number {
    return this.state.unitsInTransit
      .filter(t => t.unitId === unitId)
      .reduce((sum, t) => sum + t.count, 0);
  }

  getTransitProgress(transit: MilitaryUnitTransit): number {
    return this.progressBetween(transit.departAt, transit.arriveAt);
  }

  progressBetween(departAt: number, arriveAt: number): number {
    const total = arriveAt - departAt;
    if (total <= 0) return 100;
    return Math.min(100, Math.round(((this.now - departAt) / total) * 100));
  }

  getIncomingRaidsForPlanet(planetId: string) {
    return this.state.activeInvasionRaids.filter(r => r.targetPlanetId === planetId);
  }

  getNextRaidETA(planetId: string): string | null {
    const nextRaidAt = this.game.getNextRaidAt(planetId);
    if (!nextRaidAt) return null;
    return this.formatCountdown(nextRaidAt, 'Imminent');
  }

  getDefenseTarget(dangerLevel: number): number {
    return this.game.getDefenseNeutralizeTarget(dangerLevel);
  }

  getDefenseBarWidth(current: number, target: number): number {
    if (target <= 0) return 100;
    return Math.min(100, Math.round((current / target) * 100));
  }

  getUnitCountForAttack(unitId: string): number {
    return this.attackUnits[unitId] ?? 0;
  }

  addUnitToAttack(unitId: string): void {
    const available = this.game.getInventoryAmount(unitId as ItemId);
    const current = this.getUnitCountForAttack(unitId);
    if (current < available) {
      this.attackUnits[unitId] = current + 1;
    }
  }

  removeUnitFromAttack(unitId: string): void {
    const current = this.getUnitCountForAttack(unitId);
    if (current > 0) {
      this.attackUnits[unitId] = current - 1;
    }
  }

  getAttackTotalStrength(): number {
    return Object.entries(this.attackUnits).reduce((total, [unitId, count]) => {
      const unitDef = this.game.militaryUnits.find(u => u.id === unitId);
      return total + (unitDef?.defenseStrength ?? 0) * count;
    }, 0);
  }

  launchAttack(systemId: string): void {
    if (this.getAttackTotalStrength() === 0) {
      return;
    }
    if (this.game.launchAttack(systemId, this.attackUnits as Record<MilitaryUnitId, number>)) {
      this.attackSystemModal = null;
      this.attackUnits = {};
    }
  }

  getInvasionUnitCount(unitId: string): number {
    return this.invasionAttackUnits[unitId] ?? 0;
  }

  addInvasionUnit(unitId: string): void {
    const available = this.getUnitTotalAvailable(unitId);
    const current = this.getInvasionUnitCount(unitId);
    if (current < available) {
      this.invasionAttackUnits[unitId] = current + 1;
    }
  }

  removeInvasionUnit(unitId: string): void {
    const current = this.getInvasionUnitCount(unitId);
    if (current > 0) {
      this.invasionAttackUnits[unitId] = current - 1;
    }
  }

  getInvasionAttackStrength(): number {
    return Object.entries(this.invasionAttackUnits).reduce((total, [unitId, count]) => {
      const unitDef = this.game.militaryUnits.find(u => u.id === unitId);
      return total + (unitDef?.defenseStrength ?? 0) * count;
    }, 0);
  }

  strikeInvasionFleet(fleetId: string): void {
    if (this.getInvasionAttackStrength() === 0) return;
    this.game.attackInvasionFleet(fleetId, this.invasionAttackUnits as Record<MilitaryUnitId, number>);
    this.invasionAttackModal = null;
    this.invasionAttackUnits = {};
  }

  getInvasionHpPercent(hp: number, maxHp: number): number {
    if (maxHp <= 0) return 0;
    return Math.round((hp / maxHp) * 100);
  }

  getInventoryGroupTitle(kind: 'raw' | 'crafted'): string {
    return this.copy.messages.ui.upgradePanel[kind];
  }

  getResourceUpgradeTitle(resource: ResourceDef): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.resourceUpgradesTitle, {
      resource: resource.name,
    });
  }

  getResourceAutomationTitle(resource: ResourceDef): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.resourceAutomationTitle, {
      resource: resource.name,
    });
  }

  getPlanetYieldLabel(resource: ResourceDef): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.planetYield, {
      multiplier: this.game.getPlanetMultiplier(this.currentPlanet.id, resource.id),
      planet: this.currentPlanet.name,
    });
  }

  getMineMoreToUnlockLabel(resource: ResourceDef): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.mineMoreToUnlock, {
      resource: resource.name.toLowerCase(),
    });
  }

  getUpgradeLevelLabel(upgrade: ResourceUpgrade): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.level, {
      level: this.getUpgradeLevel(upgrade),
      max: upgrade.maxLevel,
    });
  }

  getCraftOutputLabel(recipe: Recipe): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.craftOutput, {
      amount: recipe.outputAmount,
      item: this.getItemLabel(recipe.outputId),
    });
  }

  getAutomationOutputHereLabel(resource: ResourceDef): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.automationOutputHere, {
      value: new FormatNumberPipe().transform(
        this.game.getAutoRateForPlanetResource(this.currentPlanet.id, resource.id),
      ),
    });
  }

  getAutomationOutputOnPlanetLabel(miner: AutoMiner): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.automationOutputOnPlanet, {
      value: new FormatNumberPipe().transform(this.getAutoMinerOutput(miner)),
      planet: this.currentPlanet.name,
    });
  }

  getNextAutomationUnlock(resource: ResourceDef): AutoMiner | undefined {
    return this.getLockedMinersForResource(resource.id)[0];
  }

  getAutomationUnlockTitle(resource: ResourceDef): string {
    const nextMiner = this.getNextAutomationUnlock(resource);
    if (!nextMiner) {
      return this.copy.messages.ui.upgradePanel.automationUnavailable;
    }

    return this.copy.format(this.copy.messages.ui.upgradePanel.automationNextUnlock, {
      name: nextMiner.name,
    });
  }

  getAutomationUnlockRequirements(resource: ResourceDef): string[] {
    const nextMiner = this.getNextAutomationUnlock(resource);
    if (!nextMiner) {
      return [this.copy.messages.ui.upgradePanel.automationUnavailable];
    }

    const requirements: string[] = [];
    const minedAmount = this.state.totalMined[resource.id];

    if (minedAmount < nextMiner.unlockAtTotal) {
      requirements.push(
        this.copy.format(this.copy.messages.ui.upgradePanel.automationMineRequirement, {
          current: new FormatNumberPipe().transform(minedAmount),
          required: new FormatNumberPipe().transform(nextMiner.unlockAtTotal),
          resource: resource.name.toLowerCase(),
        }),
      );
    }

    if (nextMiner.unlockCraftedId) {
      const ownedAmount = this.getItemAmount(nextMiner.unlockCraftedId);
      if (ownedAmount < 1) {
        requirements.push(
          this.copy.format(this.copy.messages.ui.upgradePanel.automationCraftRequirement, {
            required: 1,
            item: this.getItemLabel(nextMiner.unlockCraftedId),
          }),
        );
      }
    }

    return requirements;
  }

  getShipAssemblyProgressLabel(): string {
    return this.copy.format(this.copy.messages.ui.upgradePanel.shipAssemblyProgress, {
      built: this.state.builtShipPartIds.length,
      total: this.shipParts.length,
    });
  }

  getLaunchButtonLabel(): string {
    return this.state.shipLaunched
      ? this.copy.messages.ui.upgradePanel.shipLaunched
      : this.copy.messages.ui.upgradePanel.launchShip;
  }

  getPlanetStatusLabel(planet: Planet): string {
    if (planet.id === this.currentPlanet.id) {
      return this.copy.messages.ui.upgradePanel.current;
    }

    if (this.game.isPlanetDiscovered(planet.id)) {
      return this.copy.messages.ui.upgradePanel.discovered;
    }

    return '';
  }

  getPlanetActionLabel(planet: Planet): string {
    if (planet.id === this.currentPlanet.id) {
      return this.copy.messages.ui.upgradePanel.here;
    }

    return this.game.isPlanetDiscovered(planet.id)
      ? this.copy.messages.ui.upgradePanel.travel
      : this.copy.messages.ui.upgradePanel.discover;
  }

  getPlanetRequirementLabel(planet: Planet): string | null {
    if (planet.requiredShipTier <= 0) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.upgradePanel.planetRequirement, {
      tier: planet.requiredShipTier,
    });
  }

  startInventoryResize(event: PointerEvent): void {
    if (this.isWorkspaceLayout) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const inventorySection = this.inventorySection()?.nativeElement;
    if (!inventorySection) {
      return;
    }

    event.preventDefault();

    const currentHeight =
      this.inventoryPanelHeight ??
      Math.round(inventorySection.getBoundingClientRect().height);

    this.resizeStartY = event.clientY;
    this.resizeStartHeight = currentHeight;
    this.inventoryPanelHeight = this.clampInventoryHeight(currentHeight);
    this.isResizingInventory = true;

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', this.onInventoryResizeMove);
    window.addEventListener('pointerup', this.stopInventoryResize);
    window.addEventListener('pointercancel', this.stopInventoryResize);
  }

  resetInventoryPanelHeight(): void {
    this.inventoryPanelHeight = null;
  }

  buyUpgrade(upgrade: ResourceUpgrade): void {
    this.game.buyUpgrade(upgrade.id);
  }

  craft(recipe: Recipe): void {
    this.game.craft(recipe.id);
  }

  buyAutoMiner(miner: AutoMiner): void {
    this.game.buyAutoMiner(miner.id);
  }

  buildShipPart(part: ShipPart): void {
    this.game.buildShipPart(part.id);
  }

  launchShip(): void {
    this.game.launchShip();
  }

  travelToPlanet(planet: Planet): void {
    this.game.travelToPlanet(planet.id);
  }

  readonly objectKeys = Object.keys as (obj: object) => string[];

  private readonly collapsedSections = new Set<string>();

  isSectionCollapsed(key: string): boolean {
    return this.collapsedSections.has(key);
  }

  toggleSection(key: string): void {
    if (this.collapsedSections.has(key)) {
      this.collapsedSections.delete(key);
    } else {
      this.collapsedSections.add(key);
    }
  }

  get pendingAttackResult(): AttackResult | null {
    return this.state.pendingAttackResults[0] ?? null;
  }

  acknowledgePendingResult(): void {
    if (this.pendingAttackResult) {
      this.game.acknowledgeAttackResult(this.pendingAttackResult.id);
    }
  }

  getFactionAnger(): number {
    return this.state.factionAnger;
  }

  getFactionAngerTier(): 'calm' | 'alert' | 'enraged' {
    const a = this.getFactionAnger();
    if (a >= 60) return 'enraged';
    if (a >= 30) return 'alert';
    return 'calm';
  }

  getFactionAngerLabel(): string {
    const t = this.getFactionAngerTier();
    return t === 'enraged' ? 'Enraged' : t === 'alert' ? 'Alert' : 'Calm';
  }

  getPlanetThreatLevel(planetId: string): number {
    return this.state.planetThreats[planetId]?.dangerLevel
      ?? this.game.getPlanet(planetId)?.requiredShipTier
      ?? 0;
  }

  getEventTimestamp(event: RaidEvent | AttackResult | FactionAngerEvent): number {
    return event.kind === 'raid' ? event.resolvedAt : event.timestamp;
  }

  formatCombatEntry(event: RaidEvent | AttackResult | FactionAngerEvent): string {
    if (event.kind === 'raid') {
      const planet = this.game.getPlanet(event.planetId)?.name ?? event.planetId;
      const attrition = event.garrisonLost > 0 ? ` · ${event.garrisonLost} units lost` : '';
      return `${planet} raided${attrition}`;
    }
    if (event.kind === 'attack') {
      const icon = event.success ? '✓' : '✗';
      const ratio = event.strengthRatio != null ? event.strengthRatio.toFixed(1) : '?';
      return `${event.systemName} ${icon} (${ratio}×)`;
    }
    const icons: Record<string, string> = { calm: '●', alert: '▲', enraged: '★' };
    return `Syndicate: ${icons[event.previousTier]} → ${icons[event.newTier]}`;
  }

  formatSecondsAgo(ts: number): string {
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  }

  private clampInventoryHeight(height: number): number {
    const panelShell = this.panelShell()?.nativeElement;
    const tabBar = this.tabBar()?.nativeElement;
    if (!panelShell || !tabBar) {
      return Math.round(Math.max(height, this.inventoryMinHeight));
    }

    const panelHeight = panelShell.getBoundingClientRect().height;
    const tabBarHeight = tabBar.getBoundingClientRect().height;
    const maxHeight = Math.max(
      this.inventoryMinHeight,
      panelHeight - tabBarHeight - this.handleHeight - this.contentMinHeight,
    );

    return Math.round(Math.min(Math.max(height, this.inventoryMinHeight), maxHeight));
  }
}
