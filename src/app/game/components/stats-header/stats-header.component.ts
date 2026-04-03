import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { ResourceDef } from '../../models';

@Component({
  selector: 'app-stats-header',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './stats-header.component.html',
  styleUrl: './stats-header.component.css',
})
export class StatsHeaderComponent {
  @Output() resetRequested = new EventEmitter<void>();

  constructor(public game: GameService) {}

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
      return 'Ship launched';
    }

    const built = state.builtShipPartIds.length;
    const total = this.game.shipParts.length;
    return `Ship parts ${built}/${total}`;
  }

  getAmount(resourceId: ResourceDef['id']): number {
    return this.game.getInventoryAmount(resourceId);
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
