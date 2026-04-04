import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetManagerComponent } from './fleet-manager.component';
import { GameService } from '../../services/game.service';
import { PLANETS } from '../../constants/planets.data';

describe('FleetManagerComponent', () => {
  let fixture: ComponentFixture<FleetManagerComponent>;
  let component: FleetManagerComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FleetManagerComponent],
    }).compileComponents();

    gameService = TestBed.inject(GameService);
    gameService.init();

    const state = (gameService as any).state;
    state.builtShipPartIds = gameService.shipParts.map(part => part.id);
    gameService.launchShip();
    state.discoveredPlanetIds = ['solara', 'ferros', 'verdara', 'cinder'];
    state.planetInventories['solara']['carbon'] = 120;
    state.ships = [
      ...state.ships,
      {
        id: 'ship-idle',
        definitionId: 'shuttle',
        routeId: null,
        status: 'idle',
        currentPlanetId: 'cinder',
        currentLocationKind: 'planet',
        cargo: { itemId: null, amount: 0 },
        transit: null,
      },
    ];

    const starterShip = gameService.getState().ships[0];
    gameService.saveShipRoute({
      shipId: starterShip.id,
      originPlanetId: 'solara',
      destinationPlanetId: 'ferros',
      itemId: 'carbon',
      keepMinimum: 0,
    });

    fixture = TestBed.createComponent(FleetManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    gameService.destroy();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should order discovered planets by orbit for the system map', () => {
    expect(component.mapPlanets.map(planet => planet.id)).toEqual(['solara', 'ferros', 'verdara', 'cinder']);
  });

  it('should only list destinations the ship tier can reach', () => {
    const starterShip = component.ships[0];

    expect(component.getDestinationOptions(starterShip).map(option => option.id)).toEqual([
      'planet:ferros',
      'planet:verdara',
    ]);
  });

  it('should preserve a selected destination across state updates and save it', () => {
    const starterShip = component.ships[0];

    component.updateRouteDraft(starterShip.id, 'destinationLocationId', 'planet:verdara');
    gameService.grantDevResources(1);

    expect(component.getRouteDraft(starterShip).destinationLocationId).toBe('planet:verdara');

    component.saveRoute(starterShip);

    expect(gameService.getShipRoute(starterShip.id)?.destinationPlanetId).toBe('verdara');
    expect(gameService.getShipRoute(starterShip.id)?.destinationKind).toBe('planet');
  });

  it('should render the system map with route distances and ship markers', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const systemMap = nativeElement.querySelector('[data-testid="fleet-system-map"]');

    expect(systemMap).toBeTruthy();
    expect(systemMap?.textContent).toContain(gameService.getPlanet('solara')!.name);
    expect(systemMap?.textContent).toContain(gameService.getPlanet('ferros')!.name);
    expect(nativeElement.textContent).toContain('Distance 1');
    expect(nativeElement.textContent).toContain('Distance 2');
    expect(nativeElement.textContent).toContain('Distance 3');
    expect(nativeElement.querySelectorAll('[data-testid="fleet-system-map-ship"]').length).toBe(1);
  });

  it('should filter ships by activity', () => {
    component.routeActivityFilter = 'working';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-1']);

    component.routeActivityFilter = 'idle';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-idle']);

    component.routeActivityFilter = 'docked';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-idle']);

    component.routeActivityFilter = 'transit';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-1']);
  });

  it('should filter ships by sending and receiving planet traffic', () => {
    component.updateRoutePlanetFilter('solara');
    component.routePlanetTrafficFilter = 'sending';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-1']);

    component.updateRoutePlanetFilter('ferros');
    component.routePlanetTrafficFilter = 'receiving';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-1']);

    component.updateRoutePlanetFilter('cinder');
    component.routePlanetTrafficFilter = 'any';
    expect(component.filteredShips.map(ship => ship.id)).toEqual(['ship-idle']);
  });

  it('should expand the system map into fullscreen mode', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const mapPanel = nativeElement.querySelector('[data-testid="fleet-system-map-panel"]');

    expect(mapPanel?.className).not.toContain('fixed');

    component.toggleSystemMapExpanded();
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="fleet-system-map-panel"]')?.className).toContain('fixed');
  });

  it('should show the expedition deck once every handcrafted planet is discovered', () => {
    const state = (gameService as any).state;
    state.discoveredPlanetIds = PLANETS.map(planet => planet.id);

    component.activeSection = 'expeditions';
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Expeditions');
    expect(text).toContain('Build Explorer Ship');
    expect(text).toContain('Next target:');
    expect(text).toContain('0 frontier worlds');
  });
});
