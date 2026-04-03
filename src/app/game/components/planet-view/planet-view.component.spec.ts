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

  it('should not have unlocked cargo hold initially', () => {
    expect(component.hasUnlockedCargoHold).toBeFalse();
  });

  it('should toggle cargo collapsed', () => {
    expect(component.cargoCollapsed).toBeFalse();
    component.toggleCargoCollapsed();
    expect(component.cargoCollapsed).toBeTrue();
    component.toggleCargoCollapsed();
    expect(component.cargoCollapsed).toBeFalse();
  });

  it('should produce a cargo toggle label', () => {
    expect(component.cargoToggleLabel).toBeTruthy();
  });

  it('should get resource amount from service', () => {
    expect(component.getResourceAmount('carbon')).toBe(0);
    gameService.mineActiveResource();
    expect(component.getResourceAmount('carbon')).toBeGreaterThan(0);
  });

  it('should get crafted amount from service', () => {
    expect(component.getCraftedAmount('condensedCarbon')).toBe(0);
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
