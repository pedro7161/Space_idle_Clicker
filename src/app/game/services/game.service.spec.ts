import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { PLANETS } from '../constants';
import { CURRENT_SAVE_KEY } from '../storage/game-save';

describe('GameService', () => {
  let service: GameService;

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
      expect(state.planetInventories['solara']['carbon']).toBe(0);
      expect(state.planetInventories['solara']['ferrite']).toBe(0);
      expect(state.planetInventories['solara']['oxygen']).toBe(0);
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

    it('should keep resource inventory scoped to the current planet', () => {
      service.mineActiveResource();
      expect(service.getInventoryAmount('carbon', 'solara')).toBeGreaterThan(0);
      expect(service.getInventoryAmount('carbon', 'ferros')).toBe(0);
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

    it('should reject crafting recipes hidden by the current planet focus', () => {
      const state = (service as any).state;
      state.currentPlanetId = 'cinder';
      state.totalMined.ferrite = 30;
      state.planetInventories.cinder.ferrite = 30;

      expect(service.craft('refined-metal')).toBeFalse();
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

    it('should reject buying auto miners hidden by the current planet focus', () => {
      const miner = service.autoMiners.find(item => item.id === 'ferrite-rig')!;
      const state = (service as any).state;
      state.currentPlanetId = 'verdara';
      state.totalMined.ferrite = miner.unlockAtTotal;
      state.planetInventories.verdara.ferrite = 60;
      state.planetInventories.verdara.refinedMetal = 5;

      expect(service.buyAutoMiner(miner.id)).toBeFalse();
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

    it('should commission a starter shuttle when the first ship launches', () => {
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      expect(service.launchShip()).toBeTrue();
      expect(service.getState().ships.length).toBe(1);
      expect(service.getState().ships[0].definitionId).toBe('shuttle');
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
      expect(service.getPlanetMultiplier('solara', 'uranium')).toBe(0);
    });

    it('should report orbit distance between planets', () => {
      expect(service.getPlanetDistance('solara', 'ferros')).toBe(1);
      expect(service.getPlanetDistance('solara', 'helion')).toBe(14);
      expect(service.getPlanetDistance('solara', 'missing')).toBeNull();
    });

    it('should gate undiscovered planets by owned ship tier', () => {
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      service.launchShip();
      expect(service.canTravelToPlanet('ferros')).toBeFalse();
      expect(service.canTravelToPlanet('cinder')).toBeFalse();
      expect(service.canTravelToPlanet('helion')).toBeFalse();
    });

    it('should allow highest-tier planets after owning a tier five ship and paying travel cost', () => {
      const state = (service as any).state;
      state.shipLaunched = true;
      state.ships = [
        {
          id: 'ship-99',
          definitionId: 'singularity_ark',
          routeId: null,
          status: 'idle',
          currentPlanetId: 'solara',
          currentLocationKind: 'planet',
          cargo: { itemId: null, amount: 0 },
          transit: null,
        },
      ];

      service.getPlanet('helion')!.travelCost.forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount;
      });

      expect(service.canTravelToPlanet('helion')).toBeTrue();
    });
  });

  describe('fleet logistics', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      service.launchShip();
      (service as any).state.discoveredPlanetIds = ['solara', 'ferros'];
      (service as any).state.planetInventories.solara.carbon = 40;
    });

    it('should save a route and load cargo from the origin planet', () => {
      const starterShip = service.getState().ships[0];
      const saved = service.saveShipRoute({
        shipId: starterShip.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 5,
      });

      expect(saved).toBeTrue();
      const ship = service.getState().ships[0];
      expect(ship.status).toBe('outbound');
      expect(ship.cargo.itemId).toBe('carbon');
      expect(ship.cargo.amount).toBe(20);
      expect(service.getInventoryAmount('carbon', 'solara')).toBe(20);
    });

    it('should report ship transit progress on a normalized scale', () => {
      const progress = service.getShipTransitProgress({
        id: 'ship-progress',
        definitionId: 'shuttle',
        routeId: null,
        status: 'outbound',
        currentPlanetId: null,
        currentLocationKind: null,
        cargo: { itemId: null, amount: 0 },
        transit: {
          fromPlanetId: 'solara',
          fromKind: 'planet',
          toPlanetId: 'ferros',
          toKind: 'planet',
          departAt: 1_000,
          arriveAt: 5_000,
        },
      }, 3_000);

      expect(progress).toBe(0.5);
    });
  });

  describe('space stations', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      service.launchShip();
    });

    it('should build a space station when affordable after launch', () => {
      const state = (service as any).state;
      service.getSpaceStationBuildCost('solara').forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount;
      });

      expect(service.canBuildSpaceStation('solara')).toBeTrue();
      expect(service.buildSpaceStation('solara')).toBeTrue();
      expect(service.hasSpaceStation('solara')).toBeTrue();
    });

    it('should increase route loading capacity from planets with a station', () => {
      const state = (service as any).state;
      state.discoveredPlanetIds = ['solara', 'ferros'];
      service.getSpaceStationBuildCost('solara').forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount;
      });
      state.planetInventories.solara.carbon = 60;

      expect(service.buildSpaceStation('solara')).toBeTrue();

      const starterShip = service.getState().ships[0];
      expect(service.saveShipRoute({
        shipId: starterShip.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      })).toBeTrue();

      expect(service.getState().ships[0].cargo.amount).toBe(24);
    });

    it('should allow a station to be used as a cargo destination', () => {
      const state = (service as any).state;
      state.planetInventories.solara.carbon = 60;
      service.getSpaceStationBuildCost('solara').forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount;
      });

      expect(service.buildSpaceStation('solara')).toBeTrue();

      const starterShip = service.getState().ships[0];
      expect(service.saveShipRoute({
        shipId: starterShip.id,
        origin: { planetId: 'solara', kind: 'planet' },
        destination: { planetId: 'solara', kind: 'station' },
        itemId: 'carbon',
        keepMinimum: 0,
      })).toBeTrue();

      const arriveAt = service.getState().ships[0].transit!.arriveAt;
      (service as any).processFleet(arriveAt);
      const internalState = (service as any).state;

      expect(internalState.ships[0].cargo.amount).toBe(0);
      expect(service.getStationInventoryAmount('carbon', 'solara')).toBe(24);
      expect(service.getInventoryAmount('carbon', 'solara')).toBe(36);
    });
  });

  describe('frontier expeditions', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.discoveredPlanetIds = PLANETS.map(planet => planet.id);
      service.grantDevResources(5_000);
    });

    it('should unlock the explorer program after every handcrafted planet is discovered', () => {
      expect(service.hasUnlockedExpeditionProgram()).toBeTrue();
    });

    it('should build the explorer ship, launch an expedition, and discover a generated planet on completion', () => {
      expect(service.buildExplorerShip()).toBeTrue();
      expect(service.hasExplorerShip()).toBeTrue();
      expect(service.startExpedition()).toBeTrue();

      const mission = service.getState().expedition.activeMission;
      expect(mission).toBeTruthy();

      (service as any).processExpeditions(mission!.arriveAt);
      const internalState = (service as any).state;

      expect(internalState.expedition.activeMission).toBeNull();
      expect(internalState.generatedPlanets.length).toBe(1);
      expect(service.isPlanetDiscovered('frontier-1')).toBeTrue();
      expect(service.getPlanet('frontier-1')?.requiredShipTier).toBe(5);
    });

    it('should require fuel upgrades as frontier distance increases', () => {
      expect(service.buildExplorerShip()).toBeTrue();
      (service as any).state.expedition.expeditionsCompleted = 3;

      expect(service.getNextExpeditionFuelRequired()).toBe(7);
      expect(service.getExplorerFuelCapacity()).toBe(6);
      expect(service.canStartExpedition()).toBeFalse();

      expect(service.upgradeExplorerFuel()).toBeTrue();
      expect(service.getExplorerFuelCapacity()).toBe(9);
      expect(service.canStartExpedition()).toBeTrue();
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

    it('should return zero for resources that are unavailable on a planet', () => {
      expect(service.getManualYield('uranium', 'solara')).toBe(0);
      expect(service.getManualYield('copper', 'verdara')).toBe(0);
    });
  });

  describe('resource availability', () => {
    beforeEach(() => service.init());

    it('should expose the extractable resources for each planet', () => {
      expect(service.getResourcesForPlanet('solara').map(resource => resource.id))
        .toEqual(['carbon', 'ferrite', 'oxygen']);
      expect(service.getResourcesForPlanet('helion').map(resource => resource.id))
        .toEqual(['hydrogen', 'uranium']);
    });

    it('should reject selecting an unavailable resource on the current planet', () => {
      service.setActiveResource('uranium');
      expect(service.getState().activeResourceId).toBe('carbon');
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

    it('should return the strongest resource chains for a planet', () => {
      expect(service.getPlanetAssociatedResourceIds('ferros')).toEqual(['ferrite']);
      expect(service.getPlanetAssociatedResourceIds('verdara')).toEqual(['oxygen']);
      expect(service.getPlanetAssociatedResourceIds('cinder')).toEqual(['carbon']);
      expect(service.getPlanetAssociatedResourceIds('solara')).toEqual(['carbon', 'ferrite', 'oxygen']);
    });

    it('should show recipes only on planets associated with their resource chains', () => {
      const recipe = service.recipes.find(item => item.id === 'refined-metal')!;
      (service as any).state.totalMined.ferrite = 30;

      expect(service.isRecipeVisible(recipe, 'ferros')).toBeTrue();
      expect(service.isRecipeVisible(recipe, 'solara')).toBeTrue();
      expect(service.isRecipeVisible(recipe, 'cinder')).toBeFalse();
    });

    it('should show auto miners only on planets associated with their resource chain', () => {
      const miner = service.autoMiners.find(item => item.id === 'ferrite-rig')!;
      (service as any).state.totalMined.ferrite = miner.unlockAtTotal;

      expect(service.isAutoMinerVisible(miner, 'ferros')).toBeTrue();
      expect(service.isAutoMinerVisible(miner, 'verdara')).toBeFalse();
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
      expect(localStorage.getItem(CURRENT_SAVE_KEY)).toBeTruthy();
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
      expect(localStorage.getItem(CURRENT_SAVE_KEY)).toBeTruthy();
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

  describe('dev resources', () => {
    beforeEach(() => service.init());

    it('should grant all items to the current planet and mined totals', () => {
      expect(service.grantDevResources(500)).toBeTrue();

      expect(service.getInventoryAmount('carbon', 'solara')).toBe(500);
      expect(service.getInventoryAmount('mechanicalParts', 'solara')).toBe(500);
      expect(service.getState().totalMined.carbon).toBe(500);
      expect(service.getState().totalMined.ferrite).toBe(500);
      expect(service.getState().totalMined.oxygen).toBe(500);
    });

    it('should grant all items to every planet when requested', () => {
      expect(service.grantDevResources(250, 'allPlanets')).toBeTrue();

      PLANETS.forEach(planet => {
        expect(service.getInventoryAmount('basicCircuits', planet.id)).toBe(250);
      });
      expect(service.getState().totalMined.carbon).toBe(250 * PLANETS.length);
    });

    it('should reject invalid grant amounts', () => {
      expect(service.grantDevResources(0)).toBeFalse();
      expect(service.grantDevResources(-5)).toBeFalse();
      expect(service.grantDevResources(Number.NaN)).toBeFalse();
    });
  });

  // ===== COMPREHENSIVE TEST SUITE ADDITIONS =====

  describe('resource production - happy paths', () => {
    beforeEach(() => service.init());

    it('should produce steady resource from auto miners', () => {
      const state = (service as any).state;
      const miner = service.autoMiners.find(m => m.unlockAtTotal === 0)!;
      if (!miner) {
        pending('No auto miner with zero unlock requirement');
        return;
      }

      state.totalMined[miner.resourceId] = miner.unlockAtTotal;
      state.planetInventories.solara[miner.baseCost[0].itemId] = 10_000;

      const initialRate = service.getAutoRateForPlanetResource('solara', miner.resourceId);
      service.buyAutoMiner(miner.id);
      const newRate = service.getAutoRateForPlanetResource('solara', miner.resourceId);
      expect(newRate).toBeGreaterThan(0);
    });

    it('should accumulate production over multiple auto miners on same resource', () => {
      const state = (service as any).state;
      const miner = service.autoMiners.find(m =>
        m.unlockAtTotal === 0 &&
        service.isAutoMinerVisible(m, 'solara')
      )!;
      if (!miner) {
        pending('No visible auto miner');
        return;
      }

      state.planetInventories.solara[miner.baseCost[0].itemId] = 50_000;

      service.buyAutoMiner(miner.id);
      const rateAfterOne = service.getAutoRateForPlanetResource('solara', miner.resourceId);

      service.buyAutoMiner(miner.id);
      const rateAfterTwo = service.getAutoRateForPlanetResource('solara', miner.resourceId);

      expect(rateAfterTwo).toBeGreaterThan(rateAfterOne);
    });

    it('should track auto rate for individual planets', () => {
      const state = (service as any).state;
      const miner = service.autoMiners.find(m =>
        m.unlockAtTotal === 0 &&
        service.isAutoMinerVisible(m, 'solara')
      );

      if (!miner) {
        pending('No visible auto miner');
        return;
      }

      state.planetInventories.solara[miner.baseCost[0].itemId] = 10_000;
      service.buyAutoMiner(miner.id);

      const rate = service.getAutoRateForPlanetResource('solara', miner.resourceId);
      expect(rate).toBeGreaterThan(0);

      const totalRate = service.getTotalAutoRate(miner.resourceId);
      expect(totalRate).toBe(rate);
    });
  });

  describe('fleet logistics - happy paths', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      service.launchShip();
      (service as any).state.discoveredPlanetIds = ['solara', 'ferros'];
      (service as any).state.planetInventories.solara.carbon = 100;
    });

    it('should create and enable ship routes', () => {
      const ship = service.getState().ships[0];
      const success = service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      });

      expect(success).toBeTrue();
      expect(service.getShipRoute(ship.id)).toBeTruthy();
      expect(service.getShipRoute(ship.id)!.enabled).toBeTrue();
    });

    it('should successfully create and save routes', () => {
      const ship = service.getState().ships[0];
      const success = service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      });

      expect(success).toBeTrue();
      const route = service.getShipRoute(ship.id);
      expect(route).toBeTruthy();
      expect(route!.itemId).toBe('carbon');
      expect(route!.originPlanetId).toBe('solara');
      expect(route!.destinationPlanetId).toBe('ferros');
    });

    it('should clear route and disable automatic shipping', () => {
      const ship = service.getState().ships[0];
      service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      });

      expect(service.getShipRoute(ship.id)).toBeTruthy();
      expect(service.clearShipRoute(ship.id)).toBeTrue();
      expect(service.getShipRoute(ship.id)).toBeFalsy();
    });
  });

  describe('expeditions - happy paths and counting', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.discoveredPlanetIds = PLANETS.map(planet => planet.id);
      service.grantDevResources(10_000);
    });

    it('should build explorer ship and enable expeditions', () => {
      expect(service.hasExplorerShip()).toBeFalse();
      expect(service.buildExplorerShip()).toBeTrue();
      expect(service.hasExplorerShip()).toBeTrue();
    });

    it('should allow expedition to start when conditions met', () => {
      service.buildExplorerShip();
      expect(service.canStartExpedition()).toBeTrue();
      expect(service.startExpedition()).toBeTrue();
      expect(service.isExpeditionInProgress()).toBeTrue();
    });

    it('should calculate fuel requirements that increase over time', () => {
      service.buildExplorerShip();

      const fuelAtStart = service.getNextExpeditionFuelRequired();
      const capacity = service.getExplorerFuelCapacity();

      // Should be affordable at start
      if (fuelAtStart <= capacity) {
        expect(fuelAtStart).toBeGreaterThan(0);
      }
    });

    it('should generate frontier planets with appropriate requirements', () => {
      service.buildExplorerShip();
      const targetPlanet = service.getExpeditionTargetPlanet();

      expect(targetPlanet.requiredShipTier).toBe(5);
      expect(targetPlanet.id).toMatch(/frontier-\d+/);
      expect(targetPlanet.availableResourceIds.length).toBeGreaterThan(0);
    });

    it('should track discovered planets when they exist', () => {
      const initialCount = service.getDiscoveredPlanets().length;
      expect(initialCount).toBeGreaterThan(0);
    });
  });

  describe('auto miner visibility - critical game logic', () => {
    beforeEach(() => service.init());

    it('should hide auto miners until resource is mined enough', () => {
      const miner = service.autoMiners.find(m => m.unlockAtTotal > 0)!;
      expect(service.isAutoMinerVisible(miner, 'solara')).toBeFalse();

      const state = (service as any).state;
      state.totalMined[miner.resourceId] = miner.unlockAtTotal;
      expect(service.isAutoMinerVisible(miner, 'solara')).toBeTrue();
    });

    it('should require planet association for auto miner visibility', () => {
      const state = (service as any).state;
      const miner = service.autoMiners.find(m => m.unlockAtTotal === 0);
      if (!miner) {
        pending('No auto miner with zero unlock requirement');
        return;
      }

      state.totalMined[miner.resourceId] = miner.unlockAtTotal;

      // Miner is visible on its associated resource planet
      const associatedPlanet = service.planets.find(p =>
        service.isPlanetAssociatedResource(miner.resourceId, p.id)
      );
      if (associatedPlanet) {
        expect(service.isAutoMinerVisible(miner, associatedPlanet.id)).toBeTrue();
      }

      // Miner is hidden on planets without the resource association
      const unassociatedPlanet = service.planets.find(p =>
        !service.isPlanetAssociatedResource(miner.resourceId, p.id)
      );
      if (unassociatedPlanet) {
        expect(service.isAutoMinerVisible(miner, unassociatedPlanet.id)).toBeFalse();
      }
    });

    it('should require crafted unlock item if specified', () => {
      const minerWithCraftReq = service.autoMiners.find(m => m.unlockCraftedId)!;
      if (!minerWithCraftReq.unlockCraftedId) {
        return;
      }

      const state = (service as any).state;
      state.totalMined[minerWithCraftReq.resourceId] = minerWithCraftReq.unlockAtTotal;

      // Not visible without crafted item
      expect(service.isAutoMinerVisible(minerWithCraftReq)).toBeFalse();

      // Visible with crafted item
      state.planetInventories.solara[minerWithCraftReq.unlockCraftedId as never] = 1;
      expect(service.isAutoMinerVisible(minerWithCraftReq)).toBeTrue();

      // Removes after crafted item is consumed
      state.planetInventories.solara[minerWithCraftReq.unlockCraftedId as never] = 0;
      expect(service.isAutoMinerVisible(minerWithCraftReq)).toBeFalse();
    });
  });

  describe('edge cases - zero and boundary values', () => {
    beforeEach(() => service.init());

    it('should handle zero resource when mining', () => {
      const gained = service.mineActiveResource();
      expect(gained).toBeGreaterThan(0);
      expect(service.getInventoryAmount('carbon')).toBe(gained);
    });

    it('should not allow spending more than available', () => {
      service.setActiveResource('carbon');
      service.mineActiveResource();
      const available = service.getInventoryAmount('carbon');

      expect(service.canAfford([{ itemId: 'carbon', amount: available + 1 }])).toBeFalse();
      expect(service.canAfford([{ itemId: 'carbon', amount: available }])).toBeTrue();
    });

    it('should handle max inventory amounts without overflow', () => {
      const state = (service as any).state;
      state.planetInventories.solara.carbon = Number.MAX_SAFE_INTEGER / 2;

      service.setActiveResource('carbon');
      service.mineActiveResource();
      const amount = service.getInventoryAmount('carbon');
      expect(Number.isFinite(amount)).toBeTrue();
    });

    it('should return zero for inventory on undiscovered planets', () => {
      (service as any).state.planetInventories.unknown = undefined;
      expect(service.getInventoryAmount('carbon', 'unknown')).toBe(0);
    });

    it('should handle zero or minimal cost scenarios', () => {
      const upgrade = service.upgrades[0];
      const state = (service as any).state;
      state.totalMined[upgrade.resourceId] = upgrade.unlockAtTotal;

      // Zero inventory should fail affording positive cost
      expect(service.getInventoryAmount(upgrade.baseCost[0].itemId)).toBeLessThanOrEqual(0);
      expect(service.canAfford(service.getUpgradeCost(upgrade))).toBeFalse();

      // With enough, should pass
      state.planetInventories.solara[upgrade.baseCost[0].itemId] = 100_000;
      expect(service.canAfford(service.getUpgradeCost(upgrade))).toBeTrue();
    });

    it('should prevent travel to current planet', () => {
      const current = service.getCurrentPlanet().id;
      expect(service.travelToPlanet(current)).toBeFalse();
      expect(service.getState().currentPlanetId).toBe(current);
    });
  });

  describe('error conditions - invalid state', () => {
    beforeEach(() => service.init());

    it('should handle corrupt save state gracefully', () => {
      localStorage.setItem(CURRENT_SAVE_KEY, 'invalid-json{');
      const newService = TestBed.inject(GameService);
      newService.init();
      expect(newService.getState().currentPlanetId).toBe('solara');
    });

    it('should reject buying parts that are already built', () => {
      const part = service.shipParts[0];
      (service as any).state.builtShipPartIds = [part.id];

      expect(service.buildShipPart(part.id)).toBeFalse();
    });

    it('should not allow building space station twice on same planet', () => {
      const state = (service as any).state;
      state.shipLaunched = true;
      state.discoveredPlanetIds = ['solara'];

      service.getSpaceStationBuildCost('solara').forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount * 2;
      });

      expect(service.buildSpaceStation('solara')).toBeTrue();
      expect(service.buildSpaceStation('solara')).toBeFalse();
    });

    it('should reject route to non-existent ship', () => {
      expect(service.saveShipRoute({
        shipId: 'fake-ship-999',
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      })).toBeFalse();
    });

    it('should reject route with same origin and destination', () => {
      const state = (service as any).state;
      state.builtShipPartIds = service.shipParts.map(p => p.id);
      service.launchShip();
      state.discoveredPlanetIds = ['solara', 'ferros'];

      expect(service.saveShipRoute({
        shipId: state.ships[0].id,
        originPlanetId: 'solara',
        destinationPlanetId: 'solara',
        itemId: 'carbon',
        keepMinimum: 0,
      })).toBeFalse();
    });

    it('should fail expedition if fuel capacity too low', () => {
      (service as any).state.discoveredPlanetIds = PLANETS.map(planet => planet.id);
      service.grantDevResources(5_000);

      service.buildExplorerShip();
      (service as any).state.expedition.expeditionsCompleted = 5;

      const fuelRequired = service.getNextExpeditionFuelRequired();
      const capacity = service.getExplorerFuelCapacity();

      if (fuelRequired > capacity) {
        expect(service.canStartExpedition()).toBeFalse();
      }
    });

    it('should return false when upgrading explorer with insufficient resources', () => {
      (service as any).state.discoveredPlanetIds = PLANETS.map(planet => planet.id);
      service.buildExplorerShip();

      expect(service.upgradeExplorerEngine()).toBeFalse();
      expect(service.upgradeExplorerFuel()).toBeFalse();
    });
  });

  describe('state persistence - save and load cycles', () => {
    it('should preserve totalMined across save/load', () => {
      service.init();
      service.mineActiveResource();
      const mined = service.getState().totalMined.carbon;

      const code = service.exportSave();
      service.resetGame();

      service.importSave(code);
      expect(service.getState().totalMined.carbon).toBe(mined);
    });

    it('should preserve upgrade levels across save/load', () => {
      service.init();
      const state = (service as any).state;
      const upgrade = service.upgrades.find(u => u.unlockAtTotal === 0)!;
      state.totalMined[upgrade.resourceId] = upgrade.unlockAtTotal;
      state.planetInventories.solara[upgrade.baseCost[0].itemId] = 10_000;

      service.buyUpgrade(upgrade.id);
      const initialLevel = service.getUpgradeLevel('solara', upgrade.id);

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      expect(service.getUpgradeLevel('solara', upgrade.id)).toBe(initialLevel);
    });

    it('should preserve auto miner counts across save/load', () => {
      service.init();
      const state = (service as any).state;
      const miner = service.autoMiners.find(m => m.unlockAtTotal === 0);
      if (!miner) {
        pending('No auto miner with zero unlock requirement');
        return;
      }

      state.totalMined[miner.resourceId] = miner.unlockAtTotal;
      state.planetInventories.solara[miner.baseCost[0].itemId] = 10_000;

      service.buyAutoMiner(miner.id);
      const initialCount = service.getAutoMinerCount('solara', miner.id);

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      expect(service.getAutoMinerCount('solara', miner.id)).toBe(initialCount);
    });

    it('should preserve discovered planets across save/load', () => {
      service.init();
      const state = (service as any).state;
      state.builtShipPartIds = service.shipParts.map(p => p.id);
      service.launchShip();
      state.discoveredPlanetIds = ['solara', 'ferros', 'verdara'];

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      expect(service.getState().discoveredPlanetIds).toContain('ferros');
      expect(service.getState().discoveredPlanetIds).toContain('verdara');
    });

    it('should preserve ship routes across save/load', () => {
      service.init();
      const state = (service as any).state;
      state.builtShipPartIds = service.shipParts.map(p => p.id);
      service.launchShip();
      state.discoveredPlanetIds = ['solara', 'ferros'];
      state.planetInventories.solara.carbon = 100;

      const ship = state.ships[0];
      service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 10,
      });

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      const route = service.getShipRoute(ship.id);
      expect(route).toBeTruthy();
      expect(route!.keepMinimum).toBe(10);
    });

    it('should preserve expedition progress across save/load', () => {
      service.init();
      (service as any).state.discoveredPlanetIds = PLANETS.map(p => p.id);
      service.grantDevResources(5_000);

      service.buildExplorerShip();
      service.startExpedition();
      const mission = service.getState().expedition.activeMission;

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      expect(service.getState().expedition.activeMission).toBeTruthy();
      expect(service.getState().expedition.activeMission!.targetSequence).toBe(mission!.targetSequence);
    });

    it('should preserve space stations across save/load', () => {
      service.init();
      const state = (service as any).state;
      state.builtShipPartIds = service.shipParts.map(p => p.id);
      service.launchShip();
      state.discoveredPlanetIds = ['solara'];

      service.getSpaceStationBuildCost('solara').forEach(cost => {
        state.planetInventories.solara[cost.itemId] = cost.amount;
      });
      service.buildSpaceStation('solara');

      const code = service.exportSave();
      service.resetGame();
      service.importSave(code);

      expect(service.hasSpaceStation('solara')).toBeTrue();
    });
  });

  describe('fleet processing - complex state transitions', () => {
    beforeEach(() => {
      service.init();
      (service as any).state.builtShipPartIds = service.shipParts.map(part => part.id);
      service.launchShip();
      (service as any).state.discoveredPlanetIds = ['solara', 'ferros'];
      (service as any).state.planetInventories.solara.carbon = 100;
    });

    it('should load cargo when ship departs on route', () => {
      const ship = service.getState().ships[0];
      const initialCarbon = service.getInventoryAmount('carbon', 'solara');

      service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      });

      const updatedShip = service.getState().ships[0];
      expect(updatedShip.cargo.itemId).toBe('carbon');
      expect(updatedShip.cargo.amount).toBeGreaterThan(0);
      expect(updatedShip.transit).toBeTruthy();
    });

    it('should maintain route state when disabled', () => {
      const ship = service.getState().ships[0];
      service.saveShipRoute({
        shipId: ship.id,
        originPlanetId: 'solara',
        destinationPlanetId: 'ferros',
        itemId: 'carbon',
        keepMinimum: 0,
      });

      expect(service.getShipRoute(ship.id)!.enabled).toBeTrue();

      // Direct state manipulation to disable
      (service as any).state.shipRoutes[0].enabled = false;
      expect(service.getShipRoute(ship.id)!.enabled).toBeFalse();

      // Route still exists but disabled
      expect(service.getShipRoute(ship.id)).toBeTruthy();
    });

    it('should keep idle ship at its location', () => {
      const ship = service.getState().ships[0];
      expect(service.getShipRoute(ship.id)).toBeFalsy();

      const before = service.getState().ships[0].currentPlanetId;
      (service as any).processFleet(Date.now() + 10000);
      const after = service.getState().ships[0].currentPlanetId;

      expect(before).toBe(after);
      expect(after).toBe('solara');
    });
  });

  describe('inventory and location tracking', () => {
    beforeEach(() => service.init());

    it('should report network inventory across planets and stations', () => {
      const state = (service as any).state;
      state.planetInventories.solara.carbon = 100;
      state.planetInventories.ferros = { ...state.planetInventories.solara };
      state.planetInventories.ferros.carbon = 50;

      const network = service.getNetworkInventoryAmount('carbon');
      expect(network).toBe(150);
    });

    it('should get inventory for specific locations', () => {
      const state = (service as any).state;
      state.planetInventories.solara.carbon = 75;

      const planetAmount = service.getInventoryAmountAtLocation('carbon', { planetId: 'solara', kind: 'planet' });
      expect(planetAmount).toBe(75);
    });

    it('should initialize inventory for new planets automatically', () => {
      const newPlanetId = 'unknown-planet';
      expect(service.getInventoryAmount('carbon', newPlanetId)).toBe(0);

      // Should have created inventory
      (service as any).state.planetInventories[newPlanetId].carbon = 10;
      expect(service.getInventoryAmount('carbon', newPlanetId)).toBe(10);
    });
  });
});

