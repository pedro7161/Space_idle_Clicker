import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { GameService } from './services/game.service';
import { GameMessagesService } from './i18n/game-messages';

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  let component: GameComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [GameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    gameService = TestBed.inject(GameService);
  });

  afterEach(() => {
    gameService.destroy();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be started initially', () => {
    expect(component.hasStarted).toBeFalse();
  });

  it('should default to the surface workspace', () => {
    expect(component.activeWorkspace).toBe('surface');
  });

  describe('startGame', () => {
    it('should set hasStarted to true', () => {
      component.startGame();
      expect(component.hasStarted).toBeTrue();
    });

    it('should initialize the game service', () => {
      spyOn(gameService, 'init');
      component.startGame();
      expect(gameService.init).toHaveBeenCalled();
    });
  });

  describe('startFresh', () => {
    it('should reset and then start', () => {
      spyOn(gameService, 'resetGame');
      spyOn(gameService, 'init');
      component.startFresh();
      expect(gameService.resetGame).toHaveBeenCalled();
      expect(gameService.init).toHaveBeenCalled();
      expect(component.hasStarted).toBeTrue();
    });
  });

  describe('onResetConfirmed', () => {
    it('should reset game and close dialog', () => {
      component.showResetDialog = true;
      spyOn(gameService, 'resetGame');
      component.onResetConfirmed();
      expect(gameService.resetGame).toHaveBeenCalled();
      expect(component.showResetDialog).toBeFalse();
    });
  });

  describe('openSettingsDialog', () => {
    it('should close mobile panel and open settings', () => {
      component.startGame();
      component.showMobilePanel = true;
      component.openSettingsDialog();
      expect(component.showMobilePanel).toBeFalse();
      expect(component.showSettingsDialog).toBeTrue();
      expect(component.exportSaveValue).toBeTruthy();
    });
  });

  describe('mobile panel', () => {
    it('should toggle showMobilePanel', () => {
      expect(component.showMobilePanel).toBeFalse();
      component.toggleMobilePanel();
      expect(component.showMobilePanel).toBeTrue();
      component.toggleMobilePanel();
      expect(component.showMobilePanel).toBeFalse();
    });

    it('should close mobile panel', () => {
      component.showMobilePanel = true;
      component.closeMobilePanel();
      expect(component.showMobilePanel).toBeFalse();
    });
  });

  describe('ships workspace', () => {
    it('should not unlock fleet access before launch', () => {
      component.startGame();
      expect(component.hasFleetAccess()).toBeFalse();
    });

    it('should toggle to ships workspace once a ship exists', () => {
      component.startGame();
      const state = gameService.getState();
      state.shipLaunched = true;
      state.ships = [
        {
          id: 'ship-1',
          definitionId: 'shuttle',
          routeId: null,
          status: 'idle',
          currentPlanetId: state.currentPlanetId,
          cargo: { itemId: null, amount: 0 },
          transit: null,
        },
      ];

      expect(component.hasFleetAccess()).toBeTrue();
      expect(component.activeWorkspace).toBe('surface');

      component.toggleShipsWorkspace();
      expect(component.activeWorkspace).toBe('ships');

      component.toggleShipsWorkspace();
      expect(component.activeWorkspace).toBe('surface');
    });

    it('should ignore ships workspace toggle when fleet access is locked', () => {
      component.startGame();
      component.toggleShipsWorkspace();
      expect(component.activeWorkspace).toBe('surface');
    });

    it('should render the ships workspace full width', () => {
      component.startGame();
      const state = gameService.getState();
      state.shipLaunched = true;
      state.ships = [
        {
          id: 'ship-1',
          definitionId: 'shuttle',
          routeId: null,
          status: 'idle',
          currentPlanetId: state.currentPlanetId,
          cargo: { itemId: null, amount: 0 },
          transit: null,
        },
      ];

      component.toggleShipsWorkspace();
      fixture.detectChanges();

      const fleetManager = fixture.nativeElement.querySelector('app-fleet-manager');
      expect(fleetManager).toBeTruthy();
      expect(fleetManager.className).toContain('min-[960px]:col-span-2');
    });
  });

  describe('overview workspace', () => {
    it('should toggle to the overview workspace', () => {
      component.startGame();
      expect(component.activeWorkspace).toBe('surface');

      component.toggleOverviewWorkspace();
      expect(component.activeWorkspace).toBe('overview');

      component.toggleOverviewWorkspace();
      expect(component.activeWorkspace).toBe('surface');
    });

    it('should close the mobile panel when opening overview workspace', () => {
      component.startGame();
      component.showMobilePanel = true;

      component.toggleOverviewWorkspace();

      expect(component.showMobilePanel).toBeFalse();
      expect(component.activeWorkspace).toBe('overview');
    });
  });

  describe('operations workspace', () => {
    it('should toggle to the operations workspace', () => {
      component.startGame();
      expect(component.activeWorkspace).toBe('surface');

      component.toggleOperationsWorkspace();
      expect(component.activeWorkspace).toBe('operations');

      component.toggleOperationsWorkspace();
      expect(component.activeWorkspace).toBe('surface');
    });

    it('should close the mobile panel when opening operations workspace', () => {
      component.startGame();
      component.showMobilePanel = true;

      component.toggleOperationsWorkspace();

      expect(component.showMobilePanel).toBeFalse();
      expect(component.activeWorkspace).toBe('operations');
    });
  });

  describe('requestResetFromSettings', () => {
    it('should close settings and open reset dialog', () => {
      component.showSettingsDialog = true;
      component.requestResetFromSettings();
      expect(component.showSettingsDialog).toBeFalse();
      expect(component.showResetDialog).toBeTrue();
    });
  });

  describe('openChangelogDialog', () => {
    it('should close settings and open the changelog dialog', () => {
      component.showSettingsDialog = true;
      component.openChangelogDialog();
      expect(component.showSettingsDialog).toBeFalse();
      expect(component.showChangelogDialog).toBeTrue();
    });
  });

  describe('header visibility', () => {
    it('should toggle the header collapsed state', () => {
      expect(component.headerCollapsed).toBeFalse();
      component.toggleHeaderVisibility();
      expect(component.headerCollapsed).toBeTrue();
      component.toggleHeaderVisibility();
      expect(component.headerCollapsed).toBeFalse();
    });

    it('should produce a header toggle label', () => {
      expect(component.headerToggleLabel).toBeTruthy();
      component.toggleHeaderVisibility();
      expect(component.headerToggleLabel).toBeTruthy();
    });
  });

  describe('handleImport', () => {
    it('should update export values on successful import', () => {
      component.startGame();
      gameService.mineActiveResource();
      const saveCode = gameService.exportSave();

      const fakeDialog = { updateFeedback: jasmine.createSpy('updateFeedback') } as any;
      component.handleImport(fakeDialog, saveCode);
      expect(fakeDialog.updateFeedback).toHaveBeenCalled();
      expect(component.exportSaveValue).toBeTruthy();
    });

    it('should show error on failed import', () => {
      component.startGame();
      const fakeDialog = { updateFeedback: jasmine.createSpy('updateFeedback') } as any;
      component.handleImport(fakeDialog, 'invalid-data');
      expect(fakeDialog.updateFeedback).toHaveBeenCalled();
      const tone = fakeDialog.updateFeedback.calls.mostRecent().args[1];
      expect(tone).toBe('error');
    });
  });

  describe('dev resources', () => {
    it('should enable dev mode in non-production builds', () => {
      expect(component.devModeEnabled).toBeTrue();
    });

    it('should grant dev resources and report success', () => {
      component.startGame();
      const fakeDialog = { updateFeedback: jasmine.createSpy('updateFeedback') } as any;

      component.grantDevResources(fakeDialog, {
        amount: 400,
        scope: 'currentPlanet',
      });

      expect(gameService.getInventoryAmount('carbon')).toBe(400);
      expect(fakeDialog.updateFeedback).toHaveBeenCalled();
      expect(fakeDialog.updateFeedback.calls.mostRecent().args[1]).toBe('success');
    });
  });

  describe('ngOnDestroy', () => {
    it('should destroy the game service', () => {
      spyOn(gameService, 'destroy');
      component.ngOnDestroy();
      expect(gameService.destroy).toHaveBeenCalled();
    });
  });
});
