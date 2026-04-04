import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameMessagesService } from '../../i18n/game-messages';
import { GameService } from '../../services/game.service';
import {
  ItemId,
  LogisticsLocation,
  LogisticsLocationKind,
  OwnedShip,
  Planet,
  Ship,
  ShipRoute,
  encodeLogisticsLocation,
  parseLogisticsLocation,
} from '../../models';

interface RouteDraft {
  originLocationId: string;
  destinationLocationId: string;
  itemId: ItemId;
  keepMinimum: number;
}

interface RouteLocationOption {
  id: string;
  label: string;
  location: LogisticsLocation;
  planet: Planet;
}

interface MapSegment {
  from: Planet;
  to: Planet;
  distance: number;
  midpointPx: number;
}

type FleetSection = 'routes' | 'expeditions' | 'shipyard' | 'stats';
type FleetActivityFilter = 'all' | 'working' | 'idle' | 'docked' | 'transit';
type FleetPlanetTrafficFilter = 'any' | 'sending' | 'receiving';

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
export class FleetManagerComponent implements OnInit, OnDestroy {
  activeSection: FleetSection = 'routes';
  currentTime = Date.now();
  isSystemMapExpanded = false;
  isPanningSystemMap = false;
  routeActivityFilter: FleetActivityFilter = 'all';
  routePlanetFilterId = 'all';
  routePlanetTrafficFilter: FleetPlanetTrafficFilter = 'any';
  readonly sections: FleetSectionDef[];
  readonly routeDrafts: Record<string, RouteDraft> = {};
  readonly mapViewport = viewChild<ElementRef<HTMLElement>>('mapViewport');
  private readonly destroyRef = inject(DestroyRef);
  readonly orbitUnitWidthPx = 148;
  readonly mapPaddingPx = 112;
  readonly mapMinimumWidthPx = 736;
  private mapPanPointerId: number | null = null;
  private mapPanStartX = 0;
  private mapPanStartY = 0;
  private mapPanStartScrollLeft = 0;
  private mapPanStartScrollTop = 0;

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {
    const messages = this.copy.messages.ui.fleetManager;
    this.sections = [
      { key: 'routes', label: messages.routes },
      { key: 'expeditions', label: messages.expeditions },
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
        this.normalizeRouteFilters();
      });
  }

  ngOnDestroy(): void {
    this.stopSystemMapPan();
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
        midpointPx: (this.getPlanetPositionPx(from) + this.getPlanetPositionPx(to)) / 2,
      };
    });
  }

  get ships(): OwnedShip[] {
    return this.game.getState().ships;
  }

  get mappedRoutes(): ShipRoute[] {
    return this.game.getState().shipRoutes.filter(route => route.enabled);
  }

  get filteredMappedRoutes(): ShipRoute[] {
    const visibleShipIds = new Set(this.filteredShips.map(ship => ship.id));
    return this.mappedRoutes.filter(route => visibleShipIds.has(route.shipId));
  }

  get transitShips(): OwnedShip[] {
    return this.ships.filter(ship => !!ship.transit);
  }

  get filteredShips(): OwnedShip[] {
    return this.ships.filter(ship => this.matchesActivityFilter(ship) && this.matchesPlanetFilter(ship));
  }

  get filteredTransitShips(): OwnedShip[] {
    return this.filteredShips.filter(ship => !!ship.transit);
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

  get frontierWorldCount(): number {
    return this.game.getState().generatedPlanets.length;
  }

  get routeFilterPlanets(): Planet[] {
    return this.mapPlanets;
  }

  get hasActiveRouteFilters(): boolean {
    return this.routeActivityFilter !== 'all'
      || this.routePlanetFilterId !== 'all'
      || this.routePlanetTrafficFilter !== 'any';
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
    return this.availableLocationOptions.length >= 2;
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
      return this.copy.format(messages.enRouteTo, {
        planet: this.getLocationLabelFromFields(ship.transit.toPlanetId, ship.transit.toKind),
      });
    }

    return this.copy.format(messages.dockedAt, {
      planet: this.getShipLocationId(ship)
        ? this.getLocationLabelFromFields(
          ship.currentPlanetId ?? this.game.getCurrentPlanet().id,
          ship.currentLocationKind ?? 'planet',
        )
        : this.game.getCurrentPlanet().name,
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

  getFilteredTransitTrafficLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.mapTransitTraffic, {
      ships: this.filteredTransitShips.length,
    });
  }

  getVisibleShipsLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.filteredShips, {
      ships: this.filteredShips.length,
    });
  }

  getFrontierWorldsLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.frontierWorlds, {
      count: this.frontierWorldCount,
    });
  }

  getExplorerEngineLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.explorerEngineLevel, {
      level: this.game.getState().expedition.engineLevel,
    });
  }

  getExplorerFuelLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.explorerFuelLevel, {
      level: this.game.getState().expedition.fuelLevel,
    });
  }

  getExplorerSpeedLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.explorerSpeed, {
      speed: Number(this.game.getExplorerTravelSpeed().toFixed(2)),
    });
  }

  getExplorerFuelCapacityLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.explorerFuelCapacity, {
      fuel: this.game.getExplorerFuelCapacity(),
    });
  }

  getNextExpeditionFuelLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.explorerFuelRequired, {
      fuel: this.game.getNextExpeditionFuelRequired(),
    });
  }

  getNextExpeditionDurationLabel(): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.expeditionDuration, {
      seconds: Math.ceil(this.game.getNextExpeditionDurationMs() / 1000),
    });
  }

  getExpeditionStatusLabel(): string {
    return this.game.isExpeditionInProgress()
      ? this.copy.messages.ui.fleetManager.expeditionStatusActive
      : this.copy.messages.ui.fleetManager.expeditionStatusReady;
  }

  getExpeditionEtaLabel(): string | null {
    const etaSeconds = this.game.getExpeditionEtaSeconds(this.currentTime);
    if (etaSeconds === null) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.fleetManager.expeditionEta, {
      seconds: etaSeconds,
    });
  }

  getExpeditionTargetLabel(): string {
    const target = this.game.getExpeditionTargetPlanet();
    return this.copy.format(this.copy.messages.ui.fleetManager.expeditionTarget, {
      planet: target.name,
    });
  }

  getExpeditionFuelWarning(): string | null {
    const required = this.game.getNextExpeditionFuelRequired();
    const capacity = this.game.getExplorerFuelCapacity();
    if (required <= capacity) {
      return null;
    }

    return this.copy.format(this.copy.messages.ui.fleetManager.expeditionFuelBlocked, {
      required,
      capacity,
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

  getOriginOptions(ship: OwnedShip): RouteLocationOption[] {
    return this.getReachableLocationOptions(ship);
  }

  getDestinationOptions(ship: OwnedShip): RouteLocationOption[] {
    const draft = this.getRouteDraft(ship);
    return this.getReachableDestinationOptions(ship, draft.originLocationId);
  }

  getRequiredTierLabel(ship: OwnedShip): string | null {
    const draft = this.getRouteDraft(ship);
    const destination = this.findLocationOption(draft.destinationLocationId)?.planet;
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
    const origin = this.findLocationOption(draft.originLocationId);
    const destination = this.findLocationOption(draft.destinationLocationId);
    const definition = this.getShipDefinition(ship);
    return !!origin
      && !!destination
      && origin.id !== destination.id
      && definition.tier >= destination.planet.requiredShipTier;
  }

  buildShip(definition: Ship): void {
    this.game.buildShip(definition.id);
  }

  saveRoute(ship: OwnedShip): void {
    const draft = this.getRouteDraft(ship);
    const origin = this.parseLocationId(draft.originLocationId);
    const destination = this.parseLocationId(draft.destinationLocationId);
    if (!origin || !destination) {
      return;
    }

    this.game.saveShipRoute({
      shipId: ship.id,
      origin,
      destination,
      itemId: draft.itemId,
      keepMinimum: draft.keepMinimum,
    });
  }

  clearRoute(ship: OwnedShip): void {
    this.game.clearShipRoute(ship.id);
  }

  buildExplorerShip(): void {
    this.game.buildExplorerShip();
  }

  upgradeExplorerEngine(): void {
    this.game.upgradeExplorerEngine();
  }

  upgradeExplorerFuel(): void {
    this.game.upgradeExplorerFuel();
  }

  startExpedition(): void {
    this.game.startExpedition();
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

    return this.copy.format(this.copy.messages.ui.fleetManager.routeSummary, {
      origin: this.getLocationLabelFromFields(route.originPlanetId, route.originKind),
      destination: this.getLocationLabelFromFields(route.destinationPlanetId, route.destinationKind),
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
    return this.filteredShips.filter(ship => !ship.transit && ship.currentPlanetId === planetId).length;
  }

  getDockedShipLabel(planetId: string): string {
    return this.copy.format(this.copy.messages.ui.fleetManager.mapDockedShips, {
      ships: this.getDockedShipCount(planetId),
    });
  }

  getPlanetPositionPx(planet: Planet | string): number {
    const orbitPosition = typeof planet === 'string'
      ? this.game.getPlanet(planet)?.orbitPosition ?? 0
      : planet.orbitPosition;

    return this.mapPaddingPx + (orbitPosition * this.orbitUnitWidthPx);
  }

  getPlanetMarkerTopPercent(index: number): number {
    return this.isPlanetAboveAxis(index) ? 27 : 73;
  }

  isPlanetAboveAxis(index: number): boolean {
    return index % 2 === 0;
  }

  getRouteStartPx(route: ShipRoute): number {
    const originPosition = this.getPlanetPositionPx(route.originPlanetId);
    const destinationPosition = this.getPlanetPositionPx(route.destinationPlanetId);
    return Math.min(originPosition, destinationPosition);
  }

  getRouteWidthPx(route: ShipRoute): number {
    const originPosition = this.getPlanetPositionPx(route.originPlanetId);
    const destinationPosition = this.getPlanetPositionPx(route.destinationPlanetId);
    return Math.abs(destinationPosition - originPosition);
  }

  getShipMarkerLeftPx(ship: OwnedShip): number | null {
    if (!ship.transit) {
      return null;
    }

    const progress = this.game.getShipTransitProgress(ship, this.currentTime);
    if (progress === null) {
      return null;
    }

    const fromPosition = this.getPlanetPositionPx(ship.transit.fromPlanetId);
    const toPosition = this.getPlanetPositionPx(ship.transit.toPlanetId);
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
    const summary = this.copy.format(this.copy.messages.ui.fleetManager.routeSummary, {
      origin: this.getLocationLabelFromFields(route.originPlanetId, route.originKind),
      destination: this.getLocationLabelFromFields(route.destinationPlanetId, route.destinationKind),
      item: this.getItemLabel(route.itemId),
    });
    const distance = this.getDistanceLabel(route.originPlanetId, route.destinationPlanetId);
    return distance ? `${summary} · ${distance}` : summary;
  }

  getSystemMapCanvasWidthPx(): number {
    return Math.max(
      this.mapMinimumWidthPx,
      (this.maxOrbitPosition * this.orbitUnitWidthPx) + (this.mapPaddingPx * 2),
    );
  }

  toggleSystemMapExpanded(): void {
    this.isSystemMapExpanded = !this.isSystemMapExpanded;
    if (!this.isSystemMapExpanded) {
      this.stopSystemMapPan();
    }
  }

  startSystemMapPan(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const viewport = this.mapViewport()?.nativeElement;
    if (!viewport) {
      return;
    }

    this.isPanningSystemMap = true;
    this.mapPanPointerId = event.pointerId;
    this.mapPanStartX = event.clientX;
    this.mapPanStartY = event.clientY;
    this.mapPanStartScrollLeft = viewport.scrollLeft;
    this.mapPanStartScrollTop = viewport.scrollTop;
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onSystemMapPan(event: PointerEvent): void {
    if (!this.isPanningSystemMap) {
      return;
    }

    const viewport = this.mapViewport()?.nativeElement;
    if (!viewport) {
      return;
    }

    viewport.scrollLeft = this.mapPanStartScrollLeft - (event.clientX - this.mapPanStartX);
    viewport.scrollTop = this.mapPanStartScrollTop - (event.clientY - this.mapPanStartY);
  }

  stopSystemMapPan(event?: PointerEvent): void {
    if (!this.isPanningSystemMap) {
      return;
    }

    const viewport = this.mapViewport()?.nativeElement;
    if (viewport && this.mapPanPointerId !== null) {
      try {
        viewport.releasePointerCapture(this.mapPanPointerId);
      } catch {
        // Ignore stale pointer capture releases.
      }
    }

    if (!event || event.pointerId === this.mapPanPointerId) {
      this.isPanningSystemMap = false;
      this.mapPanPointerId = null;
    }
  }

  updateRoutePlanetFilter(planetId: string): void {
    this.routePlanetFilterId = planetId;
    if (planetId === 'all') {
      this.routePlanetTrafficFilter = 'any';
    }
  }

  clearRouteFilters(): void {
    this.routeActivityFilter = 'all';
    this.routePlanetFilterId = 'all';
    this.routePlanetTrafficFilter = 'any';
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

  private normalizeRouteFilters(): void {
    if (this.routePlanetFilterId === 'all') {
      this.routePlanetTrafficFilter = 'any';
      return;
    }

    const selectedPlanetStillVisible = this.routeFilterPlanets.some(planet => planet.id === this.routePlanetFilterId);
    if (!selectedPlanetStillVisible) {
      this.clearRouteFilters();
    }
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
    const originLocationId = route
      ? this.encodeLocationId({
        planetId: route.originPlanetId,
        kind: route.originKind,
      })
      : this.getCurrentShipLocationId(ship);
    const destinationLocationId = route
      ? this.encodeLocationId({
        planetId: route.destinationPlanetId,
        kind: route.destinationKind,
      })
      : this.getReachableDestinationOptions(ship, originLocationId)[0]?.id ?? originLocationId;

    return this.normalizeRouteDraft(ship, {
      originLocationId,
      destinationLocationId,
      itemId: route?.itemId ?? 'carbon',
      keepMinimum: route?.keepMinimum ?? 0,
    });
  }

  private normalizeRouteDraft(ship: OwnedShip, draft: RouteDraft): RouteDraft {
    const reachableOrigins = this.getReachableLocationOptions(ship);
    const originLocationId = reachableOrigins.some(option => option.id === draft.originLocationId)
      ? draft.originLocationId
      : this.getCurrentShipLocationId(ship);
    const destinationOptions = this.getReachableDestinationOptions(ship, originLocationId);
    const destinationLocationId = destinationOptions.some(option => option.id === draft.destinationLocationId)
      ? draft.destinationLocationId
      : destinationOptions[0]?.id ?? originLocationId;

    return {
      originLocationId,
      destinationLocationId,
      itemId: draft.itemId,
      keepMinimum: Math.max(0, Number(draft.keepMinimum) || 0),
    };
  }

  private getReachableDestinationOptions(ship: OwnedShip, originLocationId: string): RouteLocationOption[] {
    return this.getReachableLocationOptions(ship).filter(option => option.id !== originLocationId);
  }

  private getReachableLocationOptions(ship: OwnedShip): RouteLocationOption[] {
    const shipTier = this.getShipDefinition(ship).tier;
    return this.availableLocationOptions.filter(option => shipTier >= option.planet.requiredShipTier);
  }

  private getCurrentShipLocationId(ship: OwnedShip): string {
    if (ship.currentPlanetId && ship.currentLocationKind) {
      return this.encodeLocationId({
        planetId: ship.currentPlanetId,
        kind: ship.currentLocationKind,
      });
    }

    if (ship.transit) {
      return this.encodeLocationId({
        planetId: ship.transit.toPlanetId,
        kind: ship.transit.toKind,
      });
    }

    return this.encodeLocationId({
      planetId: this.discoveredPlanets[0]?.id ?? this.game.getCurrentPlanet().id,
      kind: 'planet',
    });
  }

  private getShipLocationId(ship: OwnedShip): string | null {
    if (!ship.currentPlanetId || !ship.currentLocationKind) {
      return null;
    }

    return this.encodeLocationId({
      planetId: ship.currentPlanetId,
      kind: ship.currentLocationKind,
    });
  }

  private findLocationOption(locationId: string): RouteLocationOption | undefined {
    return this.availableLocationOptions.find(option => option.id === locationId);
  }

  private getLocationLabel(location: LogisticsLocation): string {
    const planetName = this.game.getPlanet(location.planetId)?.name ?? location.planetId;
    const template = location.kind === 'station'
      ? this.copy.messages.ui.fleetManager.locationStation
      : this.copy.messages.ui.fleetManager.locationSurface;
    return this.copy.format(template, {
      planet: planetName,
    });
  }

  private getLocationLabelFromFields(planetId: string, kind: LogisticsLocationKind): string {
    return this.getLocationLabel({
      planetId,
      kind,
    });
  }

  private parseLocationId(value: string): LogisticsLocation | null {
    return parseLogisticsLocation(value);
  }

  private encodeLocationId(location: LogisticsLocation): string {
    return encodeLogisticsLocation(location);
  }

  private matchesActivityFilter(ship: OwnedShip): boolean {
    switch (this.routeActivityFilter) {
      case 'working':
        return !!ship.routeId;
      case 'idle':
        return !ship.routeId && !ship.transit;
      case 'docked':
        return !ship.transit;
      case 'transit':
        return !!ship.transit;
      default:
        return true;
    }
  }

  private matchesPlanetFilter(ship: OwnedShip): boolean {
    if (this.routePlanetFilterId === 'all') {
      return true;
    }

    const route = this.game.getShipRoute(ship.id);
    const planetId = this.routePlanetFilterId;

    if (this.routePlanetTrafficFilter === 'sending') {
      return route?.originPlanetId === planetId || ship.transit?.fromPlanetId === planetId;
    }

    if (this.routePlanetTrafficFilter === 'receiving') {
      return route?.destinationPlanetId === planetId || ship.transit?.toPlanetId === planetId;
    }

    return ship.currentPlanetId === planetId
      || route?.originPlanetId === planetId
      || route?.destinationPlanetId === planetId
      || ship.transit?.fromPlanetId === planetId
      || ship.transit?.toPlanetId === planetId;
  }

  private get availableLocationOptions(): RouteLocationOption[] {
    return this.game.getAvailableLogisticsLocations()
      .map(location => {
        const planet = this.game.getPlanet(location.planetId) ?? this.game.getCurrentPlanet();
        return {
          id: this.encodeLocationId(location),
          label: this.getLocationLabel(location),
          location,
          planet,
        };
      })
      .sort((left, right) => {
        if (left.planet.orbitIndex !== right.planet.orbitIndex) {
          return left.planet.orbitIndex - right.planet.orbitIndex;
        }

        if (left.location.kind === right.location.kind) {
          return left.label.localeCompare(right.label);
        }

        return left.location.kind === 'planet' ? -1 : 1;
      });
  }

  private get maxOrbitPosition(): number {
    return this.game.planets.reduce((highest, planet) => Math.max(highest, planet.orbitPosition), 0);
  }
}
