import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetManagerComponent } from './fleet-manager.component';
import { GameService } from '../../services/game.service';

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

    expect(component.getDestinationOptions(starterShip).map(planet => planet.id)).toEqual(['ferros', 'verdara']);
  });

  it('should preserve a selected destination across state updates and save it', () => {
    const starterShip = component.ships[0];

    component.updateRouteDraft(starterShip.id, 'destinationPlanetId', 'verdara');
    gameService.grantDevResources(1);

    expect(component.getRouteDraft(starterShip).destinationPlanetId).toBe('verdara');

    component.saveRoute(starterShip);

    expect(gameService.getShipRoute(starterShip.id)?.destinationPlanetId).toBe('verdara');
  });

  it('should render the system map with route distances and ship markers', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const systemMap = nativeElement.querySelector('[data-testid="fleet-system-map"]');

    expect(systemMap).toBeTruthy();
    expect(systemMap?.textContent).toContain(gameService.getPlanet('solara')!.name);
    expect(systemMap?.textContent).toContain(gameService.getPlanet('ferros')!.name);
    expect(nativeElement.textContent).toContain('Distance 1');
    expect(nativeElement.querySelectorAll('[data-testid="fleet-system-map-ship"]').length).toBe(1);
  });
});
