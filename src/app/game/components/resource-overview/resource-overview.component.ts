import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { CraftedDef, ItemId, Planet, ResourceDef } from '../../models';
import { GameMessagesService } from '../../i18n/game-messages';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-resource-overview',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './resource-overview.component.html',
})
export class ResourceOverviewComponent {
  readonly workspaceToggleRequested = output<void>();

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {}

  get rawResources(): ResourceDef[] {
    return this.game.resources;
  }

  get craftedItems(): CraftedDef[] {
    return this.game.craftedItems;
  }

  get trackedPlanets(): Planet[] {
    return this.game.getDiscoveredPlanets();
  }

  get trackedStations(): Planet[] {
    return this.trackedPlanets.filter(planet => this.game.hasSpaceStation(planet.id));
  }

  get totalTrackedPlanets(): number {
    return this.trackedPlanets.length;
  }

  get networkTotalItems(): number {
    return [...this.rawResources, ...this.craftedItems]
      .reduce((total, item) => total + this.game.getNetworkInventoryAmount(item.id), 0);
  }

  getTotalAmount(itemId: ItemId): number {
    return this.game.getNetworkInventoryAmount(itemId);
  }

  getPlanetAmount(itemId: ItemId, planetId: string): number {
    return this.game.getInventoryAmount(itemId, planetId);
  }

  getStationAmount(itemId: ItemId, planetId: string): number {
    return this.game.getStationInventoryAmount(itemId, planetId);
  }

  getFleetCargoAmount(itemId: ItemId): number {
    return this.game.getFleetCargoAmount(itemId);
  }

  getPlanetStorageLabel(planet: Planet): string {
    return this.copy.format(this.copy.messages.ui.resourceOverview.surfaceStorage, {
      planet: planet.name,
    });
  }

  getStationStorageLabel(planet: Planet): string {
    return this.copy.format(this.copy.messages.ui.resourceOverview.stationStorage, {
      planet: planet.name,
    });
  }
}
