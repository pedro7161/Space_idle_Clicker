import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-stats-header',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './stats-header.component.html',
})
export class StatsHeaderComponent {
  readonly menuAvailable = input(true);
  readonly mobileMenuOpen = input(false);
  readonly overviewViewActive = input(false);
  readonly operationsViewActive = input(false);
  readonly shipsUnlocked = input(false);
  readonly shipsViewActive = input(false);
  readonly overviewWorkspaceToggleRequested = output<void>();
  readonly operationsWorkspaceToggleRequested = output<void>();
  readonly settingsRequested = output<void>();
  readonly shipsWorkspaceToggleRequested = output<void>();
  readonly mobileMenuToggleRequested = output<void>();

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {}

  get currentPlanet() {
    return this.game.getCurrentPlanet();
  }

  get activeResource() {
    return this.game.getActiveResource();
  }

  get perClick(): number {
    return this.game.getManualYield(this.activeResource.id, this.currentPlanet.id);
  }

  get totalAutoRate(): number {
    return this.game.getTotalAutoRate();
  }

  get totalClicks(): number {
    return this.game.getState().totalClicks;
  }

  get shipStatus(): string {
    const state = this.game.getState();
    if (state.shipLaunched) {
      return this.copy.format(this.copy.messages.ui.statsHeader.fleetStatus, {
        ships: state.ships.length,
        tier: this.game.getHighestOwnedShipTier(),
      });
    }

    const built = state.builtShipPartIds.length;
    const total = this.game.shipParts.length;
    return this.copy.format(this.copy.messages.ui.statsHeader.shipParts, { built, total });
  }

  get miningLabel(): string {
    return this.copy.format(this.copy.messages.ui.statsHeader.mining, {
      resource: this.activeResource.name,
    });
  }

  get clickRateLabel(): string {
    return this.copy.format(this.copy.messages.ui.statsHeader.clickRate, {
      value: new FormatNumberPipe().transform(this.perClick),
    });
  }

  get autoRateLabel(): string {
    return this.copy.format(this.copy.messages.ui.statsHeader.totalAutoRate, {
      value: new FormatNumberPipe().transform(this.totalAutoRate),
    });
  }

  get totalClicksLabel(): string {
    return this.copy.format(this.copy.messages.ui.statsHeader.clicks, {
      value: new FormatNumberPipe().transform(this.totalClicks),
    });
  }

  get mobileMenuLabel(): string {
    return this.mobileMenuOpen()
      ? this.copy.messages.ui.statsHeader.closeMenu
      : this.copy.messages.ui.statsHeader.openMenu;
  }

  get overviewButtonLabel(): string {
    return this.overviewViewActive()
      ? this.copy.messages.ui.statsHeader.surface
      : this.copy.messages.ui.statsHeader.overview;
  }

  get shipsButtonLabel(): string {
    return this.shipsViewActive()
      ? this.copy.messages.ui.statsHeader.surface
      : this.copy.messages.ui.statsHeader.ships;
  }

  get operationsButtonLabel(): string {
    return this.operationsViewActive()
      ? this.copy.messages.ui.statsHeader.surface
      : this.copy.messages.ui.statsHeader.operations;
  }
}
