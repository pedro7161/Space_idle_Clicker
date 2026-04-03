import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { StatsHeaderComponent } from './components/stats-header/stats-header.component';
import { PlanetViewComponent } from './components/planet-view/planet-view.component';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';
import { ResetDialogComponent } from './components/reset-dialog/reset-dialog.component';
import { SaveTransferDialogComponent } from './components/save-transfer-dialog/save-transfer-dialog.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    StatsHeaderComponent,
    PlanetViewComponent,
    UpgradePanelComponent,
    ResetDialogComponent,
    SaveTransferDialogComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, OnDestroy {
  showResetDialog = false;
  showSaveTransferDialog = false;
  exportSaveValue = '';

  constructor(private game: GameService) {}

  ngOnInit(): void {
    this.game.init();
  }

  ngOnDestroy(): void {
    this.game.destroy();
  }

  onResetConfirmed(): void {
    this.game.resetGame();
    this.showResetDialog = false;
  }

  openSaveTransferDialog(): void {
    this.exportSaveValue = this.game.exportSave();
    this.showSaveTransferDialog = true;
  }

  handleImport(dialog: SaveTransferDialogComponent, raw: string): void {
    const result = this.game.importSave(raw);
    if (result.ok) {
      this.exportSaveValue = this.game.exportSave();
      dialog.updateFeedback('Save imported successfully.', 'success');
      return;
    }

    dialog.updateFeedback(result.error, 'error');
  }
}
