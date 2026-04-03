import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsHeaderComponent } from './stats-header.component';
import { GameService } from '../../services/game.service';

describe('StatsHeaderComponent', () => {
  let fixture: ComponentFixture<StatsHeaderComponent>;
  let component: StatsHeaderComponent;
  let gameService: GameService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [StatsHeaderComponent],
    }).compileComponents();

    gameService = TestBed.inject(GameService);
    gameService.init();

    fixture = TestBed.createComponent(StatsHeaderComponent);
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

  it('should return all resource definitions', () => {
    expect(component.resources.length).toBe(3);
    expect(component.resources.map(r => r.id)).toEqual(['carbon', 'ferrite', 'oxygen']);
  });

  it('should return the current planet', () => {
    expect(component.currentPlanet.id).toBe('solara');
  });

  it('should return the active resource', () => {
    expect(component.activeResource.id).toBe('carbon');
  });

  it('should return the active resource amount', () => {
    expect(component.activeAmount).toBe(0);
    gameService.mineActiveResource();
    expect(component.activeAmount).toBeGreaterThan(0);
  });

  it('should return perClick yield', () => {
    expect(component.perClick).toBeGreaterThanOrEqual(1);
  });

  it('should return totalAutoRate', () => {
    expect(component.totalAutoRate).toBe(0);
  });

  it('should return totalClicks', () => {
    expect(component.totalClicks).toBe(0);
    gameService.mineActiveResource();
    expect(component.totalClicks).toBe(1);
  });

  it('should produce a ship status label', () => {
    expect(component.shipStatus).toBeTruthy();
    expect(typeof component.shipStatus).toBe('string');
  });

  it('should produce a mining label', () => {
    expect(component.miningLabel).toBeTruthy();
  });

  it('should produce a click rate label', () => {
    expect(component.clickRateLabel).toBeTruthy();
  });

  it('should produce a totalClicks label', () => {
    expect(component.totalClicksLabel).toBeTruthy();
  });

  it('should get amount for a given resource', () => {
    expect(component.getAmount('carbon')).toBe(0);
  });

  it('should produce mobile resources label based on input', () => {
    expect(component.mobileResourcesLabel).toBeTruthy();
  });

  it('should produce mobile menu label based on input', () => {
    expect(component.mobileMenuLabel).toBeTruthy();
  });
});
