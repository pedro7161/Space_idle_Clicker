import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameMessagesService } from '../../i18n/game-messages';
import { GameService } from '../../services/game.service';
import { ItemId, OwnedShip, Planet, Ship, ShipRoute } from '../../models';

interface RouteDraft {
  originPlanetId: string;
  destinationPlanetId: string;
  itemId: ItemId;
  keepMinimum: number;
}

interface MapSegment {
  from: Planet;
  to: Planet;
  distance: number;
  midpointPercent: number;
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
  currentTime = Date.now();
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
    this.currentTime = Date.now();
    this.syncRouteDrafts();
    this.game.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime = Date.now();
        this.syncRouteDrafts();
      });
  }

  get shipDefinitions(): Ship[] {
    return this.game.shipDefinitions;
  }

  get discoveredPlanets(): Planet[] {
    return this.game.getDiscoveredPlanets();
  }

  get mapPlanets(): Planet[] {
    return [...this.discoveredPlanets].sort((left, right) => left.orbitIndex - right.orbitIndex);
  }

  get mapSegments(): MapSegment[] {
    return this.mapPlanets.slice(0, -1).map((from, index) => {
      const to = this.mapPlanets[index + 1];
      return {
        from,
        to,
        distance: this.game.getPlanetDistance(from.id, to.id) ?? 0,
        midpointPercent: (this.getPlanetPositionPercent(from) + this.getPlanetPositionPercent(to)) / 2,
      };
    });
  }

  get ships(): OwnedShip[] {
    return this.game.getState().ships;
  }

  get mappedRoutes(): ShipRoute[] {
    return this.game.getState().shipRoutes.filter(route => route.enabled);
  }

  get transitShips(): OwnedShip[] {
    return this.ships.filter(ship => !!ship.transit);
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
    const etaSeconds = this.game.getShipEtaSeconds(ship, this.currentTime);
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

  getPlottedPlanetsLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.mapPlottedPlanets, {
      planets: this.mapPlanets.length,
    });
  }

  getTransitTrafficLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.mapTransitTraffic, {
      ships: this.transitShips.length,
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
    return this.getReachableDestinationOptions(ship, draft.originPlanetId);
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

  getRouteDistanceLabel(ship: OwnedShip): string | null {
    const route = this.game.getShipRoute(ship.id);
    if (!route) {
      return null;
    }

    return this.getDistanceLabel(route.originPlanetId, route.destinationPlanetId);
  }

  getSegmentDistanceLabel(segment: MapSegment): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.routeDistance, {
      distance: segment.distance,
    });
  }

  getDockedShipCount(planetId: string): number {
    return this.ships.filter(ship => !ship.transit && ship.currentPlanetId === planetId).length;
  }

  getDockedShipLabel(planetId: string): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.mapDockedShips, {
      ships: this.getDockedShipCount(planetId),
    });
  }

  getPlanetPositionPercent(planet: Planet | string): number {
    const orbitIndex = typeof planet === 'string'
      ? this.game.getPlanet(planet)?.orbitIndex ?? 0
      : planet.orbitIndex;

    if (this.maxOrbitIndex <= 0) {
      return 50;
    }

    return 8 + (orbitIndex / this.maxOrbitIndex) * 84;
  }

  getPlanetMarkerTopPercent(index: number): number {
    return this.isPlanetAboveAxis(index) ? 27 : 73;
  }

  isPlanetAboveAxis(index: number): boolean {
    return index % 2 === 0;
  }

  getRouteStartPercent(route: ShipRoute): number {
    const originPosition = this.getPlanetPositionPercent(route.originPlanetId);
    const destinationPosition = this.getPlanetPositionPercent(route.destinationPlanetId);
    return Math.min(originPosition, destinationPosition);
  }

  getRouteWidthPercent(route: ShipRoute): number {
    const originPosition = this.getPlanetPositionPercent(route.originPlanetId);
    const destinationPosition = this.getPlanetPositionPercent(route.destinationPlanetId);
    return Math.abs(destinationPosition - originPosition);
  }

  getShipMarkerLeftPercent(ship: OwnedShip): number | null {
    if (!ship.transit) {
      return null;
    }

    const progress = this.game.getShipTransitProgress(ship, this.currentTime);
    if (progress === null) {
      return null;
    }

    const fromPosition = this.getPlanetPositionPercent(ship.transit.fromPlanetId);
    const toPosition = this.getPlanetPositionPercent(ship.transit.toPlanetId);
    return fromPosition + (toPosition - fromPosition) * progress;
  }

  getShipMarkerTopPercent(index: number): number {
    return index % 2 === 0 ? 43 : 47;
  }

  getShipMapLabel(ship: OwnedShip): string {
    const parts = [this.getShipDefinition(ship).name, this.getRouteSummary(ship)];
    const eta = this.getShipEtaLabel(ship);
    if (eta) {
      parts.push(eta);
    }

    return parts.join(' · ');
  }

  getRouteMapLabel(route: ShipRoute): string {
    const origin = this.game.getPlanet(route.originPlanetId);
    const destination = this.game.getPlanet(route.destinationPlanetId);
    const summary = this.copy.format(this.copy.messages.ui.fleetManager.routeSummary, {
      origin: origin?.name ?? route.originPlanetId,
      destination: destination?.name ?? route.destinationPlanetId,
      item: this.getItemLabel(route.itemId),
    });
    const distance = this.getDistanceLabel(route.originPlanetId, route.destinationPlanetId);
    return distance ? `${summary} · ${distance}` : summary;
  }

  updateRouteDraft<K extends keyof RouteDraft>(shipId: string, key: K, value: RouteDraft[K]): void {
    const nextValue = key === 'keepMinimum'
      ? Math.max(0, Number(value) || 0)
      : value;

    const ship = this.ships.find(currentShip => currentShip.id === shipId);
    const currentDraft = this.routeDrafts[shipId];
    if (!ship || !currentDraft) {
      return;
    }

    this.routeDrafts[shipId] = this.normalizeRouteDraft(ship, {
      ...currentDraft,
      [key]: nextValue,
    });
  }

  private syncRouteDrafts(): void {
    this.ships.forEach(ship => {
      this.routeDrafts[ship.id] = this.routeDrafts[ship.id]
        ? this.normalizeRouteDraft(ship, this.routeDrafts[ship.id])
        : this.buildRouteDraft(ship);
    });

    Object.keys(this.routeDrafts).forEach(shipId => {
      if (!this.ships.some(ship => ship.id === shipId)) {
        delete this.routeDrafts[shipId];
      }
    });
  }

  private getDistanceLabel(fromPlanetId: string, toPlanetId: string): string | null {
    const distance = this.game.getPlanetDistance(fromPlanetId, toPlanetId);
    if (distance === null) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.fleetManager.routeDistance, {
      distance,
    });
  }

  private buildRouteDraft(ship: OwnedShip): RouteDraft {
    const route = this.game.getShipRoute(ship.id);
    const originPlanetId = route?.originPlanetId ?? this.getCurrentShipPlanetId(ship);
    const destinationPlanetId = route?.destinationPlanetId
      ?? this.getReachableDestinationOptions(ship, originPlanetId)[0]?.id
      ?? originPlanetId;

    return this.normalizeRouteDraft(ship, {
      originPlanetId,
      destinationPlanetId,
      itemId: route?.itemId ?? 'carbon',
      keepMinimum: route?.keepMinimum ?? 0,
    });
  }

  private normalizeRouteDraft(ship: OwnedShip, draft: RouteDraft): RouteDraft {
    const originPlanetId = this.isDiscoveredPlanet(draft.originPlanetId)
      ? draft.originPlanetId
      : this.getCurrentShipPlanetId(ship);
    const destinationOptions = this.getReachableDestinationOptions(ship, originPlanetId);
    const destinationPlanetId = destinationOptions.some(planet => planet.id === draft.destinationPlanetId)
      ? draft.destinationPlanetId
      : destinationOptions[0]?.id ?? originPlanetId;

    return {
      originPlanetId,
      destinationPlanetId,
      itemId: draft.itemId,
      keepMinimum: Math.max(0, Number(draft.keepMinimum) || 0),
    };
  }

  private getReachableDestinationOptions(ship: OwnedShip, originPlanetId: string): Planet[] {
    const shipTier = this.getShipDefinition(ship).tier;
    return this.discoveredPlanets.filter(planet =>
      planet.id !== originPlanetId
      && shipTier >= planet.requiredShipTier);
  }

  private getCurrentShipPlanetId(ship: OwnedShip): string {
    return ship.currentPlanetId
      ?? ship.transit?.toPlanetId
      ?? this.discoveredPlanets[0]?.id
      ?? this.game.getCurrentPlanet().id;
  }

  private isDiscoveredPlanet(planetId: string): boolean {
    return this.discoveredPlanets.some(planet => planet.id === planetId);
  }

  private get maxOrbitIndex(): number {
    return this.game.planets.reduce((highest, planet) => Math.max(highest, planet.orbitIndex), 0);
  }
}
