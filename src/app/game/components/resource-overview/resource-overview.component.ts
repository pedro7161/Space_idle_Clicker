import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { ItemId, Planet } from '../../models';
import { GameMessagesService } from '../../i18n/game-messages';
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

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {}

  get rawItems(): OverviewItem[] {
    return this.game.resources.map(r => ({ id: r.id as ItemId, name: r.name, icon: r.icon, color: r.color, section: 'raw' as const }));
  }

  get craftedItems(): OverviewItem[] {
    return this.game.craftedItems.map(c => ({ id: c.id as ItemId, name: c.name, icon: c.icon, color: c.color, section: 'crafted' as const }));
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
    return [...this.rawItems, ...this.craftedItems]
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
