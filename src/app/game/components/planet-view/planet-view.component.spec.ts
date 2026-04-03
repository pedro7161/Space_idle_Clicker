import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanetViewComponent } from './planet-view.component';
import { GameService } from '../../services/game.service';

describe('PlanetViewComponent', () => {
  let fixture: ComponentFixture<PlanetViewComponent>;
  let component: PlanetViewComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PlanetViewComponent],
    }).compileComponents();

    gameService = TestBed.inject(GameService);
    gameService.init();

    fixture = TestBed.createComponent(PlanetViewComponent);
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

  it('should generate mineral nodes on init', () => {
    expect(component.mineralNodes.length).toBe(14);
    component.mineralNodes.forEach(node => {
      expect(node.x).toBeGreaterThanOrEqual(10);
      expect(node.x).toBeLessThanOrEqual(90);
      expect(node.y).toBeGreaterThanOrEqual(12);
      expect(node.y).toBeLessThanOrEqual(84);
      expect(node.size).toBeGreaterThanOrEqual(10);
      expect(node.size).toBeLessThanOrEqual(36);
    });
  });

  it('should return the current planet', () => {
    expect(component.currentPlanet.id).toBe('solara');
  });

  it('should return the active resource', () => {
    expect(component.activeResource.id).toBe('carbon');
  });

  it('should return active click yield', () => {
    expect(component.activeClickYield).toBeGreaterThanOrEqual(1);
  });

  it('should return local auto rate (zero initially)', () => {
    expect(component.localAutoRate).toBe(0);
  });

  it('should produce a local auto label', () => {
    expect(component.localAutoLabel).toBeTruthy();
  });

  it('should not have unlocked the orbital station panel initially', () => {
    expect(component.hasUnlockedOrbitalStationPanel).toBeFalse();
  });

  it('should toggle orbital station collapsed', () => {
    expect(component.stationCollapsed).toBeFalse();
    component.toggleStationCollapsed();
    expect(component.stationCollapsed).toBeTrue();
    component.toggleStationCollapsed();
    expect(component.stationCollapsed).toBeFalse();
  });

  it('should produce an orbital station toggle label', () => {
    expect(component.stationToggleLabel).toBeTruthy();
  });

  it('should get resource amount from service', () => {
    expect(component.getResourceAmount('carbon')).toBe(0);
    gameService.mineActiveResource();
    expect(component.getResourceAmount('carbon')).toBeGreaterThan(0);
  });

  it('should get item label for crafted items', () => {
    expect(component.getItemLabel('condensedCarbon' as any)).toBeTruthy();
  });

  it('should get item color for crafted items', () => {
    expect(component.getItemColor('condensedCarbon' as any)).toBe('#f97316');
  });

  it('should get planet multiplier', () => {
    expect(component.getPlanetMultiplier('carbon')).toBe(1);
  });

  it('should set active resource via service', () => {
    component.setActiveResource('ferrite');
    expect(gameService.getActiveResource().id).toBe('ferrite');
  });

  it('should handle mine click', () => {
    const mouseEvent = new MouseEvent('click', { clientX: 100, clientY: 100 });
    Object.defineProperty(mouseEvent, 'currentTarget', {
      value: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    });

    component.onMineClick(mouseEvent);
    expect(gameService.getInventoryAmount('carbon')).toBeGreaterThan(0);
    expect(component.floatingTexts.length).toBe(1);
  });

  it('should trigger mine animation on click', () => {
    const mouseEvent = new MouseEvent('click', { clientX: 100, clientY: 100 });
    Object.defineProperty(mouseEvent, 'currentTarget', {
      value: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    });

    component.onMineClick(mouseEvent);
    expect(component.mineAnimating).toBeTrue();
  });
});
