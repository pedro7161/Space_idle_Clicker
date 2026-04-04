import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceOverviewComponent } from './resource-overview.component';
import { GameService } from '../../services/game.service';

describe('ResourceOverviewComponent', () => {
  let fixture: ComponentFixture<ResourceOverviewComponent>;
  let component: ResourceOverviewComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ResourceOverviewComponent],
    }).compileComponents();

    gameService = TestBed.inject(GameService);
    gameService.init();

    fixture = TestBed.createComponent(ResourceOverviewComponent);
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

  it('should expose discovered planets for the overview', () => {
    expect(component.trackedPlanets.length).toBeGreaterThan(0);
    expect(component.trackedPlanets[0].id).toBe('solara');
  });

  it('should report network totals for an item', () => {
    expect(component.getTotalAmount('carbon')).toBe(0);
    gameService.mineActiveResource();
    expect(component.getTotalAmount('carbon')).toBeGreaterThan(0);
  });

  it('should report per-planet amounts', () => {
    gameService.mineActiveResource();
    expect(component.getPlanetAmount('carbon', 'solara')).toBeGreaterThan(0);
  });

  it('should provide overall tracked stock', () => {
    expect(component.networkTotalItems).toBe(0);
    gameService.mineActiveResource();
    expect(component.networkTotalItems).toBeGreaterThan(0);
  });
});
