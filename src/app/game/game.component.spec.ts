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

  describe('mobile resources', () => {
    it('should toggle showMobileResources', () => {
      expect(component.showMobileResources).toBeFalse();
      component.toggleMobileResources();
      expect(component.showMobileResources).toBeTrue();
      component.toggleMobileResources();
      expect(component.showMobileResources).toBeFalse();
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

  describe('ngOnDestroy', () => {
    it('should destroy the game service', () => {
      spyOn(gameService, 'destroy');
      component.ngOnDestroy();
      expect(gameService.destroy).toHaveBeenCalled();
    });
  });
});
