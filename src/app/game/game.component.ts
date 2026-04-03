import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { StatsHeaderComponent } from './components/stats-header/stats-header.component';
import { PlanetViewComponent } from './components/planet-view/planet-view.component';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';
import { ResetDialogComponent } from './components/reset-dialog/reset-dialog.component';
import { GameMessagesService } from './i18n/game-messages';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { SupportedLocale } from './i18n/game-messages';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    StatsHeaderComponent,
    PlanetViewComponent,
    UpgradePanelComponent,
    ResetDialogComponent,
    SettingsDialogComponent,
  ],
  templateUrl: './game.component.html',
})
export class GameComponent implements OnDestroy {
  hasStarted = false;
  hasSavedGame = false;
  showResetDialog = false;
  exportSaveValue = '';
  exportSaveFileContents = '';
  showSettingsDialog = false;
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
    this.hasStarted = true;
    this.hasSavedGame = this.game.hasSavedGame();
  }

  startFresh(): void {
    this.game.resetGame();
    this.startGame();
  }

  onResetConfirmed(): void {
    this.game.resetGame();
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
    this.exportSaveValue = this.game.exportSave();
    this.exportSaveFileContents = this.game.exportSaveFileContents();
    this.showSettingsDialog = true;
  }

  requestResetFromSettings(): void {
    this.showSettingsDialog = false;
    this.showResetDialog = true;
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
}
