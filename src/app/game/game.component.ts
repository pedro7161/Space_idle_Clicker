import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { StatsHeaderComponent } from './components/stats-header/stats-header.component';
import { PlanetViewComponent } from './components/planet-view/planet-view.component';
import { FleetManagerComponent } from './components/fleet-manager/fleet-manager.component';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';
import { ResetDialogComponent } from './components/reset-dialog/reset-dialog.component';
import { GameMessagesService } from './i18n/game-messages';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { ChangelogDialogComponent } from './components/changelog-dialog/changelog-dialog.component';
import { SupportedLocale } from './i18n/game-messages';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    StatsHeaderComponent,
    PlanetViewComponent,
    FleetManagerComponent,
    UpgradePanelComponent,
    ResetDialogComponent,
    SettingsDialogComponent,
    ChangelogDialogComponent,
  ],
  templateUrl: './game.component.html',
})
export class GameComponent implements OnDestroy {
  readonly devModeEnabled = !environment.production;
  activeWorkspace: 'surface' | 'ships' = 'surface';
  hasStarted = false;
  hasSavedGame = false;
  showResetDialog = false;
  exportSaveValue = '';
  exportSaveFileContents = '';
  showSettingsDialog = false;
  showChangelogDialog = false;
  showMobilePanel = false;
  showMobileResources = false;
  startScreenMessage = '';
  startScreenTone: 'neutral' | 'success' | 'error' = 'neutral';

  constructor(
    private game: GameService,
    public copy: GameMessagesService,
  ) {
    this.hasSavedGame = this.game.hasSavedGame();
  }

  ngOnDestroy(): void {
    this.game.destroy();
  }

  startGame(): void {
    this.game.init();
    this.activeWorkspace = 'surface';
    this.hasStarted = true;
    this.hasSavedGame = this.game.hasSavedGame();
  }

  startFresh(): void {
    this.game.resetGame();
    this.activeWorkspace = 'surface';
    this.startGame();
  }

  onResetConfirmed(): void {
    this.game.resetGame();
    this.activeWorkspace = 'surface';
    this.showResetDialog = false;
  }

  async importSaveFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const result = this.game.importSave(raw);

      if (result.ok) {
        this.startScreenTone = 'success';
        this.startScreenMessage = this.copy.messages.ui.startScreen.importSuccess;
        this.hasSavedGame = true;
        this.startGame();
      } else {
        this.startScreenTone = 'error';
        this.startScreenMessage = this.copy.messages.ui.startScreen.importError;
      }
    } catch {
      this.startScreenTone = 'error';
      this.startScreenMessage = this.copy.messages.ui.startScreen.importReadError;
    } finally {
      input.value = '';
    }
  }

  openSettingsDialog(): void {
    this.showMobilePanel = false;
    this.exportSaveValue = this.game.exportSave();
    this.exportSaveFileContents = this.game.exportSaveFileContents();
    this.showSettingsDialog = true;
  }

  toggleMobilePanel(): void {
    this.showMobilePanel = !this.showMobilePanel;
  }

  toggleShipsWorkspace(): void {
    if (!this.hasFleetAccess()) {
      return;
    }

    this.showMobilePanel = false;
    this.activeWorkspace = this.activeWorkspace === 'ships' ? 'surface' : 'ships';
  }

  closeMobilePanel(): void {
    this.showMobilePanel = false;
  }

  toggleMobileResources(): void {
    this.showMobileResources = !this.showMobileResources;
  }

  requestResetFromSettings(): void {
    this.showSettingsDialog = false;
    this.showResetDialog = true;
  }

  openChangelogDialog(): void {
    this.showSettingsDialog = false;
    this.showChangelogDialog = true;
  }

  hasFleetAccess(): boolean {
    return this.game.getState().ships.length > 0;
  }

  handleImport(dialog: SettingsDialogComponent, raw: string): void {
    const result = this.game.importSave(raw);
    if (result.ok) {
      this.exportSaveValue = this.game.exportSave();
      this.exportSaveFileContents = this.game.exportSaveFileContents();
      dialog.updateFeedback(this.copy.messages.ui.saveTransferDialog.importSuccess, 'success');
      return;
    }

    dialog.updateFeedback(result.error, 'error');
  }

  changeLanguage(dialog: SettingsDialogComponent, locale: SupportedLocale): void {
    if (locale === this.copy.currentLocale) {
      return;
    }

    this.copy.setLocale(locale);
    dialog.updateFeedback(this.copy.messages.ui.settingsDialog.languageUpdated, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 250);
  }

  grantDevResources(
    dialog: SettingsDialogComponent,
    request: { amount: number; scope: 'currentPlanet' | 'allPlanets' },
  ): void {
    const granted = this.game.grantDevResources(request.amount, request.scope);
    if (!granted) {
      dialog.updateFeedback(this.copy.messages.ui.settingsDialog.devGrantError, 'error');
      return;
    }

    this.exportSaveValue = this.game.exportSave();
    this.exportSaveFileContents = this.game.exportSaveFileContents();
    const target = request.scope === 'allPlanets'
      ? this.copy.messages.ui.settingsDialog.devAllPlanets
      : this.copy.messages.ui.settingsDialog.devCurrentPlanet;
    dialog.updateFeedback(
      this.copy.format(this.copy.messages.ui.settingsDialog.devGrantSuccess, {
        amount: request.amount,
        target,
      }),
      'success',
    );
  }
}
