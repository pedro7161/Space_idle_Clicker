import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameMessagesService } from '../../i18n/game-messages';
import { GameService } from '../../services/game.service';
import { ItemId, OwnedShip, Planet, Ship } from '../../models';

interface RouteDraft {
  originPlanetId: string;
  destinationPlanetId: string;
  itemId: ItemId;
  keepMinimum: number;
}

type FleetSection = 'routes' | 'shipyard' | 'stats';

interface FleetSectionDef {
  key: FleetSection;
  label: string;
}

@Component({
  selector: 'app-fleet-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatNumberPipe],
  templateUrl: './fleet-manager.component.html',
})
export class FleetManagerComponent implements OnInit {
  activeSection: FleetSection = 'routes';
  readonly sections: FleetSectionDef[];
  readonly routeDrafts: Record<string, RouteDraft> = {};
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {
    const messages = this.copy.messages.ui.fleetManager;
    this.sections = [
      { key: 'routes', label: messages.routes },
      { key: 'shipyard', label: messages.shipyard },
      { key: 'stats', label: messages.shipStats },
    ];
  }

  ngOnInit(): void {
    this.syncRouteDrafts();
    this.game.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncRouteDrafts());
  }

  get shipDefinitions(): Ship[] {
    return this.game.shipDefinitions;
  }

  get discoveredPlanets(): Planet[] {
    return this.game.getDiscoveredPlanets();
  }

  get ships(): OwnedShip[] {
    return this.game.getState().ships;
  }

  get assignedShipsCount(): number {
    return this.ships.filter(ship => !!this.game.getShipRoute(ship.id)).length;
  }

  get idleShipsCount(): number {
    return this.ships.filter(ship => ship.status === 'idle').length;
  }

  get highestTier(): number {
    return this.game.getHighestOwnedShipTier();
  }

  get transportItems(): Array<{ id: ItemId; name: string; color: string }> {
    return [
      ...this.game.resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        color: resource.color,
      })),
      ...this.game.craftedItems.map(item => ({
        id: item.id,
        name: item.name,
        color: item.color,
      })),
    ];
  }

  canConfigureRoutes(): boolean {
    return this.discoveredPlanets.length >= 2;
  }

  getShipDefinition(ship: OwnedShip): Ship {
    return this.game.getShipDefinition(ship.definitionId) ?? this.shipDefinitions[0];
  }

  getRouteDraft(ship: OwnedShip): RouteDraft {
    return this.routeDrafts[ship.id];
  }

  getShipStatusLabel(ship: OwnedShip): string {
    const messages = this.copy.messages.ui.fleetManager;
    switch (ship.status) {
      case 'outbound':
        return messages.outbound;
      case 'returning':
        return messages.returning;
      default:
        return messages.idle;
    }
  }

  getShipLocationLabel(ship: OwnedShip): string {
    const messages = this.copy.messages.ui.fleetManager;
    if (ship.transit) {
      const destination = this.game.getPlanet(ship.transit.toPlanetId);
      return this.copy.format(messages.enRouteTo, {
        planet: destination?.name ?? ship.transit.toPlanetId,
      });
    }

    const planet = ship.currentPlanetId ? this.game.getPlanet(ship.currentPlanetId) : null;
    return this.copy.format(messages.dockedAt, {
      planet: planet?.name ?? this.game.getCurrentPlanet().name,
    });
  }

  getShipCargoLabel(ship: OwnedShip): string {
    const messages = this.copy.messages.ui.fleetManager;
    if (!ship.cargo.itemId || ship.cargo.amount <= 0) {
      return messages.emptyHold;
    }

    return this.copy.format(messages.cargoLoad, {
      amount: new FormatNumberPipe().transform(ship.cargo.amount),
      item: this.getItemLabel(ship.cargo.itemId),
    });
  }

  getShipEtaLabel(ship: OwnedShip): string | null {
    const etaSeconds = this.game.getShipEtaSeconds(ship);
    if (etaSeconds === null) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.fleetManager.eta, {
      seconds: etaSeconds,
    });
  }

  getTierLabel(tier: number): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.tier, { tier });
  }

  getActiveRoutesLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.activeRoutes, {
      routes: this.assignedShipsCount,
    });
  }

  getIdleShipsLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.idleShips, {
      ships: this.idleShipsCount,
    });
  }

  getHighestTierLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.highestTier, {
      tier: this.highestTier,
    });
  }

  getCargoCapacityLabel(ship: Ship): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.cargoCapacity, {
      capacity: ship.cargoCapacity,
    });
  }

  getTravelSpeedLabel(ship: Ship): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.travelSpeed, {
      speed: Number(ship.travelSpeed.toFixed(2)),
    });
  }

  getItemLabel(itemId: ItemId): string {
    const resource = this.game.resources.find(item => item.id === itemId);
    if (resource) {
      return resource.name;
    }

    return this.game.craftedItems.find(item => item.id === itemId)?.name ?? itemId;
  }

  getItemColor(itemId: ItemId): string {
    const resource = this.game.resources.find(item => item.id === itemId);
    if (resource) {
      return resource.color;
    }

    return this.game.craftedItems.find(item => item.id === itemId)?.color ?? '#cbd5e1';
  }

  getDestinationOptions(ship: OwnedShip): Planet[] {
    const draft = this.getRouteDraft(ship);
    return this.discoveredPlanets.filter(planet => planet.id !== draft.originPlanetId);
  }

  getRequiredTierLabel(ship: OwnedShip): string | null {
    const draft = this.getRouteDraft(ship);
    const destination = this.game.getPlanet(draft.destinationPlanetId);
    const definition = this.getShipDefinition(ship);
    if (!destination || definition.tier >= destination.requiredShipTier) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.fleetManager.requiresTier, {
      tier: destination.requiredShipTier,
    });
  }

  canSaveRoute(ship: OwnedShip): boolean {
    if (!this.canConfigureRoutes()) {
      return false;
    }

    const draft = this.getRouteDraft(ship);
    const origin = this.game.getPlanet(draft.originPlanetId);
    const destination = this.game.getPlanet(draft.destinationPlanetId);
    const definition = this.getShipDefinition(ship);
    return !!origin
      && !!destination
      && origin.id !== destination.id
      && definition.tier >= destination.requiredShipTier;
  }

  buildShip(definition: Ship): void {
    this.game.buildShip(definition.id);
  }

  saveRoute(ship: OwnedShip): void {
    const draft = this.getRouteDraft(ship);
    this.game.saveShipRoute({
      shipId: ship.id,
      originPlanetId: draft.originPlanetId,
      destinationPlanetId: draft.destinationPlanetId,
      itemId: draft.itemId,
      keepMinimum: draft.keepMinimum,
    });
  }

  clearRoute(ship: OwnedShip): void {
    this.game.clearShipRoute(ship.id);
  }

  getOwnedCountLabel(definition: Ship): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.ownedCount, {
      count: this.ships.filter(ship => ship.definitionId === definition.id).length,
    });
  }

  getRouteSummary(ship: OwnedShip): string {
    const route = this.game.getShipRoute(ship.id);
    if (!route) {
      return this.copy.messages.ui.fleetManager.unassigned;
    }

    const origin = this.game.getPlanet(route.originPlanetId);
    const destination = this.game.getPlanet(route.destinationPlanetId);
    return this.copy.format(this.copy.messages.ui.fleetManager.routeSummary, {
      origin: origin?.name ?? route.originPlanetId,
      destination: destination?.name ?? route.destinationPlanetId,
      item: this.getItemLabel(route.itemId),
    });
  }

  updateRouteDraft<K extends keyof RouteDraft>(shipId: string, key: K, value: RouteDraft[K]): void {
    const nextValue = key === 'keepMinimum'
      ? Math.max(0, Number(value) || 0)
      : value;

    this.routeDrafts[shipId] = {
      ...this.routeDrafts[shipId],
      [key]: nextValue,
    };
  }

  private syncRouteDrafts(): void {
    const planets = this.discoveredPlanets;
    const defaultOrigin = planets[0]?.id ?? this.game.getCurrentPlanet().id;
    const defaultDestination = planets.find(planet => planet.id !== defaultOrigin)?.id ?? defaultOrigin;

    this.ships.forEach(ship => {
      const route = this.game.getShipRoute(ship.id);
      const currentPlanetId =
        ship.currentPlanetId
        ?? ship.transit?.toPlanetId
        ?? defaultOrigin;

      this.routeDrafts[ship.id] = {
        originPlanetId: route?.originPlanetId ?? currentPlanetId,
        destinationPlanetId: route?.destinationPlanetId ?? defaultDestination,
        itemId: route?.itemId ?? 'carbon',
        keepMinimum: route?.keepMinimum ?? 0,
      };
    });

    Object.keys(this.routeDrafts).forEach(shipId => {
      if (!this.ships.some(ship => ship.id === shipId)) {
        delete this.routeDrafts[shipId];
      }
    });
  }
}
