import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { PLANETS } from '../constants';

describe('GameService', () => {
  let service: GameService;
  const SAVE_KEY = 'space-idle-save-v2';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  afterEach(() => {
    service.destroy();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should build a default state with solara as starting planet', () => {
      service.init();
      const state = service.getState();
      expect(state.currentPlanetId).toBe('solara');
      expect(state.discoveredPlanetIds).toContain('solara');
    });

    it('should start with carbon as the active resource', () => {
      service.init();
      expect(service.getState().activeResourceId).toBe('carbon');
    });

    it('should start with zero inventory for all items', () => {
      service.init();
      const state = service.getState();
      expect(state.inventory['carbon']).toBe(0);
      expect(state.inventory['ferrite']).toBe(0);
      expect(state.inventory['oxygen']).toBe(0);
    });

    it('should not re-initialize when called twice', () => {
      service.init();
      service.mineActiveResource();
      const clicksAfterFirst = service.getState().totalClicks;
      service.init();
      expect(service.getState().totalClicks).toBe(clicksAfterFirst);
    });
  });

  describe('mining', () => {
    beforeEach(() => service.init());

    it('should increase inventory when mining the active resource', () => {
      const gained = service.mineActiveResource();
      expect(gained).toBeGreaterThan(0);
      expect(service.getInventoryAmount('carbon')).toBe(gained);
    });

    it('should increment totalClicks', () => {
      service.mineActiveResource();
      service.mineActiveResource();
      expect(service.getState().totalClicks).toBe(2);
    });

    it('should track totalMined per resource', () => {
      const gained = service.mineActiveResource();
      expect(service.getState().totalMined['carbon']).toBe(gained);
    });

    it('should mine whichever resource is active', () => {
      service.setActiveResource('ferrite');
      service.mineActiveResource();
      expect(service.getInventoryAmount('ferrite')).toBeGreaterThan(0);
      expect(service.getInventoryAmount('carbon')).toBe(0);
    });
  });

  describe('setActiveResource', () => {
    beforeEach(() => service.init());

    it('should change the active resource', () => {
      service.setActiveResource('oxygen');
      expect(service.getState().activeResourceId).toBe('oxygen');
    });

    it('should not emit if setting the same resource', () => {
      let emitCount = 0;
      service.state$.subscribe(() => emitCount++);
      const before = emitCount;
      service.setActiveResource('carbon');
      expect(emitCount).toBe(before);
    });
  });

  describe('upgrades', () => {
    beforeEach(() => service.init());

    it('should reject buying an upgrade that does not exist', () => {
      expect(service.buyUpgrade('nonexistent')).toBeFalse();
    });

    it('should reject buying when the player cannot afford it', () => {
      const upgrade = service.upgrades[0];
      expect(service.buyUpgrade(upgrade.id)).toBeFalse();
    });

    it('should buy an upgrade when affordable and visible', () => {
      const upgrade = service.upgrades.find(u => u.unlockAtTotal === 0)!;
      const cost = service.getUpgradeCost(upgrade);
      cost.forEach(c => {
        for (let i = 0; i < c.amount + 10; i++) {
          service.mineActiveResource();
        }
      });

      // Give enough of the right resource
      service.setActiveResource(upgrade.resourceId);
      while (service.getInventoryAmount(upgrade.baseCost[0].itemId) < upgrade.baseCost[0].amount) {
        service.mineActiveResource();
      }

      expect(service.buyUpgrade(upgrade.id)).toBeTrue();
      expect(service.getUpgradeLevel(service.getState().currentPlanetId, upgrade.id)).toBe(1);
    });

    it('should not exceed max level', () => {
      const upgrade = service.upgrades.find(u => u.unlockAtTotal === 0 && u.resourceId === 'carbon')!;
      // Manually set upgrade level to max by giving lots of resources and buying repeatedly
      service.setActiveResource('carbon');

      // Give a lot of carbon via repeated mining
      for (let i = 0; i < 5000; i++) {
        service.mineActiveResource();
      }

      let bought = 0;
      while (service.buyUpgrade(upgrade.id)) {
        bought++;
        // Safety valve
        if (bought > upgrade.maxLevel + 5) break;
      }

      expect(service.getUpgradeLevel(service.getState().currentPlanetId, upgrade.id))
        .toBeLessThanOrEqual(upgrade.maxLevel);
    });
  });

  describe('crafting', () => {
    beforeEach(() => service.init());

    it('should reject crafting a nonexistent recipe', () => {
      expect(service.craft('nonexistent')).toBeFalse();
    });

    it('should craft when player has enough ingredients and recipe is visible', () => {
      // Mine enough carbon to unlock and afford condensed-carbon recipe (25 carbon, unlock at 20 total)
      service.setActiveResource('carbon');
      for (let i = 0; i < 30; i++) {
        service.mineActiveResource();
      }

      const result = service.craft('condensed-carbon');
      expect(result).toBeTrue();
      expect(service.getInventoryAmount('condensedCarbon' as never)).toBe(1);
    });

    it('should spend ingredients when crafting', () => {
      service.setActiveResource('carbon');
      for (let i = 0; i < 30; i++) {
        service.mineActiveResource();
      }
      const beforeCarbon = service.getInventoryAmount('carbon');
      service.craft('condensed-carbon');
      expect(service.getInventoryAmount('carbon')).toBe(beforeCarbon - 25);
    });
  });

  describe('auto miners', () => {
    beforeEach(() => service.init());

    it('should reject buying a nonexistent auto miner', () => {
      expect(service.buyAutoMiner('nonexistent')).toBeFalse();
    });

    it('should report zero auto rate when no miners are owned', () => {
      expect(service.getTotalAutoRate('carbon')).toBe(0);
    });
  });

  describe('ship parts and launch', () => {
    beforeEach(() => service.init());

    it('should reject building a nonexistent ship part', () => {
      expect(service.buildShipPart('nonexistent')).toBeFalse();
    });

    it('should not be able to launch with no parts built', () => {
      expect(service.canLaunchShip()).toBeFalse();
      expect(service.launchShip()).toBeFalse();
    });

    it('should report ship parts as not built initially', () => {
      expect(service.isShipPartBuilt('hull')).toBeFalse();
    });
  });

  describe('planets and travel', () => {
    beforeEach(() => service.init());

    it('should start on solara', () => {
      expect(service.getCurrentPlanet().id).toBe('solara');
    });

    it('should have solara discovered by default', () => {
      expect(service.isPlanetDiscovered('solara')).toBeTrue();
    });

    it('should not allow travel without a launched ship', () => {
      expect(service.canTravelToPlanet('ferros')).toBeFalse();
    });

    it('should not allow travel to the current planet', () => {
      expect(service.travelToPlanet('solara')).toBeFalse();
    });

    it('should return correct planet multiplier', () => {
      expect(service.getPlanetMultiplier('solara', 'carbon')).toBe(1);
      expect(service.getPlanetMultiplier('ferros', 'ferrite')).toBe(2.8);
    });
  });

  describe('manual yield', () => {
    beforeEach(() => service.init());

    it('should return at least 1 per click for base resources', () => {
      expect(service.getManualYield('carbon', 'solara')).toBeGreaterThanOrEqual(1);
      expect(service.getManualYield('ferrite', 'solara')).toBeGreaterThanOrEqual(1);
      expect(service.getManualYield('oxygen', 'solara')).toBeGreaterThanOrEqual(1);
    });

    it('should scale with planet multiplier', () => {
      const solaraYield = service.getManualYield('ferrite', 'solara');
      const ferrosYield = service.getManualYield('ferrite', 'ferros');
      expect(ferrosYield).toBeGreaterThan(solaraYield);
    });
  });

  describe('visibility checks', () => {
    beforeEach(() => service.init());

    it('should show upgrades with unlockAtTotal of 0', () => {
      const zeroUnlock = service.upgrades.find(u => u.unlockAtTotal === 0);
      expect(zeroUnlock).toBeTruthy();
      expect(service.isUpgradeVisible(zeroUnlock!)).toBeTrue();
    });

    it('should hide upgrades requiring more totalMined', () => {
      const highUnlock = service.upgrades.find(u => u.unlockAtTotal > 0);
      expect(highUnlock).toBeTruthy();
      expect(service.isUpgradeVisible(highUnlock!)).toBeFalse();
    });

    it('should report hasUnlockedCrafting as false when no recipes are visible', () => {
      expect(service.hasUnlockedCrafting()).toBeFalse();
    });

    it('should report hasUnlockedCrafting as true when recipes become visible', () => {
      // Recipes unlock at 20 total progress score
      service.setActiveResource('carbon');
      for (let i = 0; i < 25; i++) {
        service.mineActiveResource();
      }
      expect(service.hasUnlockedCrafting()).toBeTrue();
    });
  });

  describe('save/load', () => {
    it('should report no saved game initially', () => {
      expect(service.hasSavedGame()).toBeFalse();
    });

    it('should export and import a save code', () => {
      service.init();
      service.mineActiveResource();
      const code = service.exportSave();
      expect(code).toBeTruthy();
      expect(code.startsWith('frontier-miner-save:')).toBeTrue();

      service.resetGame();
      const result = service.importSave(code);
      expect(result.ok).toBeTrue();
      expect(service.getState().totalClicks).toBe(1);
    });

    it('should export save file contents as JSON', () => {
      service.init();
      const contents = service.exportSaveFileContents();
      const parsed = JSON.parse(contents);
      expect(parsed.currentPlanetId).toBe('solara');
    });

    it('should reject importing empty string', () => {
      service.init();
      const result = service.importSave('');
      expect(result.ok).toBeFalse();
    });

    it('should reject importing invalid data', () => {
      service.init();
      const result = service.importSave('not-valid-data');
      expect(result.ok).toBeFalse();
    });

    it('should persist to localStorage on save', () => {
      service.init();
      service.exportSave();
      expect(localStorage.getItem(SAVE_KEY)).toBeTruthy();
    });
  });

  describe('reset', () => {
    it('should clear saved game and reset state', () => {
      service.init();
      service.mineActiveResource();
      service.resetGame();
      expect(service.getState().totalClicks).toBe(0);
      expect(service.hasSavedGame()).toBeFalse();
    });
  });

  describe('destroy', () => {
    it('should save and clear intervals', () => {
      service.init();
      service.mineActiveResource();
      service.destroy();
      expect(localStorage.getItem(SAVE_KEY)).toBeTruthy();
    });
  });

  describe('canAfford', () => {
    beforeEach(() => service.init());

    it('should return true for empty costs', () => {
      expect(service.canAfford([])).toBeTrue();
    });

    it('should return false when inventory is insufficient', () => {
      expect(service.canAfford([{ itemId: 'carbon', amount: 9999 }])).toBeFalse();
    });

    it('should return true when inventory covers the cost', () => {
      service.setActiveResource('carbon');
      for (let i = 0; i < 10; i++) {
        service.mineActiveResource();
      }
      expect(service.canAfford([{ itemId: 'carbon', amount: 5 }])).toBeTrue();
    });
  });

  describe('progress score', () => {
    beforeEach(() => service.init());

    it('should start at zero', () => {
      expect(service.getProgressScore()).toBe(0);
    });

    it('should increase after mining', () => {
      service.mineActiveResource();
      expect(service.getProgressScore()).toBeGreaterThan(0);
    });
  });
});
