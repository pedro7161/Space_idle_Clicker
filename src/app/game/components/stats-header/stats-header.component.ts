import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { ResourceDef } from '../../models';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-stats-header',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './stats-header.component.html',
})
export class StatsHeaderComponent {
  readonly mobileResourcesExpanded = input(false);
  readonly mobileMenuOpen = input(false);
  readonly shipsUnlocked = input(false);
  readonly shipsViewActive = input(false);
  readonly settingsRequested = output<void>();
  readonly shipsWorkspaceToggleRequested = output<void>();
  readonly mobileResourcesToggleRequested = output<void>();
  readonly mobileMenuToggleRequested = output<void>();

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {}

  get resources(): ResourceDef[] {
    return this.game.resources;
  }

  get currentPlanet() {
    return this.game.getCurrentPlanet();
  }

  get activeResource(): ResourceDef {
    return this.game.getActiveResource();
  }

  get activeAmount(): number {
    return this.game.getInventoryAmount(this.activeResource.id);
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

  get mobileResourcesLabel(): string {
    return this.mobileResourcesExpanded()
      ? this.copy.messages.ui.statsHeader.hideResources
      : this.copy.messages.ui.statsHeader.showResources;
  }

  get mobileMenuLabel(): string {
    return this.mobileMenuOpen()
      ? this.copy.messages.ui.statsHeader.closeMenu
      : this.copy.messages.ui.statsHeader.openMenu;
  }

  get shipsButtonLabel(): string {
    return this.shipsViewActive()
      ? this.copy.messages.ui.statsHeader.surface
      : this.copy.messages.ui.statsHeader.ships;
  }

  getAmount(resourceId: ResourceDef['id']): number {
    return this.game.getInventoryAmount(resourceId);
  }
}
