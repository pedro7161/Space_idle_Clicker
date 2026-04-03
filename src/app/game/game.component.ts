import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { StatsHeaderComponent } from './components/stats-header/stats-header.component';
import { PlanetViewComponent } from './components/planet-view/planet-view.component';
import { UpgradePanelComponent } from './components/upgrade-panel/upgrade-panel.component';
import { ResetDialogComponent } from './components/reset-dialog/reset-dialog.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    StatsHeaderComponent,
    PlanetViewComponent,
    UpgradePanelComponent,
    ResetDialogComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, OnDestroy {
  showResetDialog = false;

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
}
