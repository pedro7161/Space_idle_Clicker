import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { GameMessagesService } from '../../i18n/game-messages';
import {
  AutoMiner,
  ItemId,
  Planet,
  Recipe,
  ResourceDef,
  ResourceUpgrade,
  ShipPart,
} from '../../models';

type Tab = 'inventory' | 'upgrades' | 'crafting' | 'automation' | 'launch';
type PanelLayout = 'sidebar' | 'workspace';

interface TabDef {
  key: Tab;
  label: string;
}

@Component({
  selector: 'app-upgrade-panel',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
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
  ) {
    const tabMessages = this.copy.messages.ui.upgradePanel.tabs;
    this.sidebarTabs = [
      { key: 'upgrades', label: tabMessages.upgrades },
      { key: 'crafting', label: tabMessages.crafting },
      { key: 'automation', label: tabMessages.automation },
      { key: 'launch', label: tabMessages.launch },
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

  get visibleRecipes(): Recipe[] {
    return this.game.recipes.filter(recipe => this.game.isRecipeVisible(recipe));
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
    return this.isWorkspaceLayout ? this.workspaceTabs : this.sidebarTabs;
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
