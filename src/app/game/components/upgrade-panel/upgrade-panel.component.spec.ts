import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpgradePanelComponent } from './upgrade-panel.component';
import { GameService } from '../../services/game.service';

describe('UpgradePanelComponent', () => {
  let fixture: ComponentFixture<UpgradePanelComponent>;
  let component: UpgradePanelComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [UpgradePanelComponent],
    }).compileComponents();

    gameService = TestBed.inject(GameService);
    gameService.init();

    fixture = TestBed.createComponent(UpgradePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    gameService.destroy();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have four tabs', () => {
    expect(component.tabs.length).toBe(4);
    expect(component.tabs.map(t => t.key)).toEqual(['upgrades', 'crafting', 'automation', 'launch']);
  });

  it('should add a resources tab in workspace mode', () => {
    fixture.componentRef.setInput('layout', 'workspace');
    fixture.detectChanges();

    expect(component.tabs.map(t => t.key)).toEqual(['inventory', 'upgrades', 'crafting', 'automation', 'launch']);
  });

  it('should default to upgrades tab', () => {
    expect(component.activeTab).toBe('upgrades');
  });

  it('should return resources from service', () => {
    expect(component.resources.length).toBe(gameService.resources.length);
  });

  it('should return crafted items from service', () => {
    expect(component.craftedItems.length).toBe(gameService.craftedItems.length);
  });

  it('should return current planet', () => {
    expect(component.currentPlanet.id).toBe('solara');
  });

  it('should return visible recipes (none initially)', () => {
    expect(component.visibleRecipes.length).toBe(0);
  });

  it('should return visible auto miners (none initially)', () => {
    expect(component.visibleAutoMiners.length).toBe(0);
  });

  it('should return ship parts', () => {
    expect(component.shipParts.length).toBe(3);
  });

  it('should get item amount from inventory', () => {
    expect(component.getItemAmount('carbon')).toBe(0);
  });

  it('should get item label for resources', () => {
    expect(component.getItemLabel('carbon')).toBeTruthy();
    expect(typeof component.getItemLabel('carbon')).toBe('string');
  });

  it('should get item label for crafted items', () => {
    expect(component.getItemLabel('condensedCarbon' as any)).toBeTruthy();
  });

  it('should get item color for resources', () => {
    expect(component.getItemColor('carbon')).toBe('#f59e0b');
  });

  it('should get item color for crafted items', () => {
    expect(component.getItemColor('condensedCarbon' as any)).toBe('#f97316');
  });

  it('should fallback item color for unknown ids', () => {
    expect(component.getItemColor('unknown' as any)).toBe('#cbd5e1');
  });

  it('should get resource upgrades (cutters visible at 0)', () => {
    const upgrades = component.getResourceUpgrades('carbon');
    expect(upgrades.length).toBeGreaterThan(0);
    expect(upgrades[0].id).toContain('carbon');
  });

  it('should only surface the next two active upgrades for a resource', () => {
    (gameService as any).state.totalMined.carbon = 5_000;

    const unlocked = component.getResourceUpgrades('carbon');
    const active = component.getActiveResourceUpgrades('carbon');

    expect(unlocked.length).toBeGreaterThan(2);
    expect(active.length).toBe(2);
  });

  it('should move maxed upgrades into the completed faded list', () => {
    (gameService as any).state.totalMined.carbon = 5_000;
    const firstUpgrade = component.getResourceUpgrades('carbon')[0];
    (gameService as any).state.upgradeLevels[`solara:${firstUpgrade.id}`] = firstUpgrade.maxLevel;

    const activeIds = component.getActiveResourceUpgrades('carbon').map(upgrade => upgrade.id);
    const completedIds = component.getCompletedResourceUpgrades('carbon').map(upgrade => upgrade.id);

    expect(activeIds).not.toContain(firstUpgrade.id);
    expect(completedIds).toContain(firstUpgrade.id);
  });

  it('should get upgrade level (zero initially)', () => {
    const upgrade = gameService.upgrades.find(u => u.unlockAtTotal === 0)!;
    expect(component.getUpgradeLevel(upgrade)).toBe(0);
  });

  it('should delegate buyUpgrade to service', () => {
    spyOn(gameService, 'buyUpgrade');
    const upgrade = gameService.upgrades[0];
    component.buyUpgrade(upgrade);
    expect(gameService.buyUpgrade).toHaveBeenCalledWith(upgrade.id);
  });

  it('should delegate craft to service', () => {
    spyOn(gameService, 'craft');
    const recipe = gameService.recipes[0];
    component.craft(recipe);
    expect(gameService.craft).toHaveBeenCalledWith(recipe.id);
  });

  it('should delegate buyAutoMiner to service', () => {
    spyOn(gameService, 'buyAutoMiner');
    const miner = gameService.autoMiners[0];
    component.buyAutoMiner(miner);
    expect(gameService.buyAutoMiner).toHaveBeenCalledWith(miner.id);
  });

  it('should delegate buildShipPart to service', () => {
    spyOn(gameService, 'buildShipPart');
    const part = gameService.shipParts[0];
    component.buildShipPart(part);
    expect(gameService.buildShipPart).toHaveBeenCalledWith(part.id);
  });

  it('should delegate launchShip to service', () => {
    spyOn(gameService, 'launchShip');
    component.launchShip();
    expect(gameService.launchShip).toHaveBeenCalled();
  });

  it('should delegate travelToPlanet to service', () => {
    spyOn(gameService, 'travelToPlanet');
    const planet = gameService.planets[1];
    component.travelToPlanet(planet);
    expect(gameService.travelToPlanet).toHaveBeenCalledWith(planet.id);
  });

  it('should report canBuildShipPart as false initially', () => {
    expect(component.canBuildShipPart(gameService.shipParts[0])).toBeFalse();
  });

  it('should return ship assembly progress label', () => {
    expect(component.getShipAssemblyProgressLabel()).toBeTruthy();
  });

  it('should return launch button label', () => {
    expect(component.getLaunchButtonLabel()).toBeTruthy();
  });

  it('should return planet status label', () => {
    const solara = gameService.planets[0];
    expect(component.getPlanetStatusLabel(solara)).toBeTruthy();
  });

  it('should return planet action label', () => {
    const solara = gameService.planets[0];
    expect(component.getPlanetActionLabel(solara)).toBeTruthy();
  });

  it('should return active tab label', () => {
    expect(component.activeTabLabel).toBeTruthy();
  });

  it('should return a workspace toggle label', () => {
    expect(component.workspaceToggleLabel).toBeTruthy();
  });

  it('should leave the resources tab when returning to sidebar mode', () => {
    fixture.componentRef.setInput('layout', 'workspace');
    fixture.detectChanges();

    component.activeTab = 'inventory';
    fixture.componentRef.setInput('layout', 'sidebar');
    fixture.detectChanges();

    expect(component.activeTab).toBe('upgrades');
  });

  it('should return null panelGridRows when no custom height is set', () => {
    expect(component.panelGridRows).toBeNull();
  });

  it('should reset inventory panel height', () => {
    component.inventoryPanelHeight = 300;
    component.resetInventoryPanelHeight();
    expect(component.inventoryPanelHeight).toBeNull();
  });

  it('should get inventory group title', () => {
    expect(component.getInventoryGroupTitle('raw')).toBeTruthy();
    expect(component.getInventoryGroupTitle('crafted')).toBeTruthy();
  });

  it('should get resource upgrade title', () => {
    const resource = gameService.resources[0];
    expect(component.getResourceUpgradeTitle(resource)).toBeTruthy();
  });

  it('should get planet yield label', () => {
    const resource = gameService.resources[0];
    expect(component.getPlanetYieldLabel(resource)).toBeTruthy();
  });

  it('should get mine more to unlock label', () => {
    const resource = gameService.resources[0];
    expect(component.getMineMoreToUnlockLabel(resource)).toBeTruthy();
  });

  it('should get upgrade level label', () => {
    const upgrade = gameService.upgrades[0];
    expect(component.getUpgradeLevelLabel(upgrade)).toBeTruthy();
  });

  it('should get craft output label', () => {
    const recipe = gameService.recipes[0];
    expect(component.getCraftOutputLabel(recipe)).toBeTruthy();
  });

  it('should get automation output here label', () => {
    const resource = gameService.resources[0];
    expect(component.getAutomationOutputHereLabel(resource)).toBeTruthy();
  });

  it('should get automation unlock title', () => {
    const resource = gameService.resources[0];
    expect(component.getAutomationUnlockTitle(resource)).toBeTruthy();
  });

  it('should get automation unlock requirements', () => {
    const resource = gameService.resources[0];
    const requirements = component.getAutomationUnlockRequirements(resource);
    expect(requirements.length).toBeGreaterThan(0);
  });
});
