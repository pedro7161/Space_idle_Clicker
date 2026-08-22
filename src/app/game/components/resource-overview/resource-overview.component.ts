import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { GameMessagesService } from '../../i18n/game-messages';
import { ItemId, Planet } from '../../models';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';

interface OverviewItem {
  id: ItemId;
  name: string;
  icon: string;
  color: string;
  section: 'raw' | 'crafted';
}

@Component({
  selector: 'app-resource-overview',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './resource-overview.component.html',
})
export class ResourceOverviewComponent {
  readonly workspaceToggleRequested = output<void>();
  readonly rawItems: OverviewItem[];
  readonly craftedItems: OverviewItem[];
  private readonly allItems: OverviewItem[];

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {
    this.rawItems = this.game.resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      icon: resource.icon,
      color: resource.color,
      section: 'raw',
    }));
    this.craftedItems = this.game.craftedItems.map(craftedItem => ({
      id: craftedItem.id,
      name: craftedItem.name,
      icon: craftedItem.icon,
      color: craftedItem.color,
      section: 'crafted',
    }));
    this.allItems = [...this.rawItems, ...this.craftedItems];
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
    return this.allItems.reduce(
      (total, item) => total + this.game.getNetworkInventoryAmount(item.id),
      0,
    );
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
