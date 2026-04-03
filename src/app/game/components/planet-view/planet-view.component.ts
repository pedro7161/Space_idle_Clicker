import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { FloatingText, ItemId, Planet, ResourceDef } from '../../models';
import { GameMessagesService } from '../../i18n/game-messages';

interface MineralNode {
  x: number;
  y: number;
  size: number;
  delay: number;
}

@Component({
  selector: 'app-planet-view',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './planet-view.component.html',
})
export class PlanetViewComponent implements OnInit {
  floatingTexts: FloatingText[] = [];
  mineralNodes: MineralNode[] = [];
  mineAnimating = false;
  stationCollapsed = false;

  private readonly destroyRef = inject(DestroyRef);
  private floatId = 0;
  private currentPlanetId = '';

  constructor(
    public game: GameService,
    public copy: GameMessagesService,
  ) {}

  ngOnInit(): void {
    this.currentPlanetId = this.currentPlanet.id;
    this.generateMineralNodes();

    this.game.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (state.currentPlanetId !== this.currentPlanetId) {
          this.currentPlanetId = state.currentPlanetId;
          this.generateMineralNodes();
        }
      });
  }

  get resources(): ResourceDef[] {
    return this.game.resources;
  }

  get currentPlanet(): Planet {
    return this.game.getCurrentPlanet();
  }

  get activeResource(): ResourceDef {
    return this.game.getActiveResource();
  }

  get activeClickYield(): number {
    return this.game.getManualYield(this.activeResource.id, this.currentPlanet.id);
  }

  get localAutoRate(): number {
    return this.game.getAutoRateForPlanetResource(this.currentPlanet.id, this.activeResource.id);
  }

  get localAutoLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.perSecond, {
      value: new FormatNumberPipe().transform(this.localAutoRate),
    });
  }

  get stationToggleLabel(): string {
    return this.stationCollapsed
      ? this.copy.messages.ui.planetView.expandOrbitalStation
      : this.copy.messages.ui.planetView.collapseOrbitalStation;
  }

  get hasUnlockedOrbitalStationPanel(): boolean {
    return this.game.getState().shipLaunched || this.game.hasSpaceStation(this.currentPlanet.id);
  }

  get hasSpaceStation(): boolean {
    return this.game.hasSpaceStation(this.currentPlanet.id);
  }

  get stationBlueprint() {
    return this.game.getSpaceStationBlueprintForPlanet(this.currentPlanet.id);
  }

  get stationCargoBonusLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.stationCargoBoost, {
      percent: this.game.getSpaceStationCargoBonusPercent(this.currentPlanet.id),
    });
  }

  get stationTravelReductionLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.stationTravelReduction, {
      percent: this.game.getSpaceStationTravelReductionPercent(this.currentPlanet.id),
    });
  }

  get stationLinkedRoutesLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.stationRoutes, {
      count: this.game.getPlanetRouteCount(this.currentPlanet.id),
    });
  }

  get stationInboundRoutesLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.stationInbound, {
      count: this.game.getPlanetRouteCount(this.currentPlanet.id, 'inbound'),
    });
  }

  get stationOutboundRoutesLabel(): string {
    return this.copy.format(this.copy.messages.ui.planetView.stationOutbound, {
      count: this.game.getPlanetRouteCount(this.currentPlanet.id, 'outbound'),
    });
  }

  onMineClick(event: MouseEvent): void {
    const gained = this.game.mineActiveResource();
    this.spawnFloatingText(event, gained);
    this.triggerMineAnimation();
  }

  setActiveResource(resourceId: ResourceDef['id']): void {
    this.game.setActiveResource(resourceId);
  }

  getResourceAmount(resourceId: ResourceDef['id']): number {
    return this.game.getInventoryAmount(resourceId);
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

  getPlanetMultiplier(resourceId: ResourceDef['id']): number {
    return this.game.getPlanetMultiplier(this.currentPlanet.id, resourceId);
  }

  canBuildStation(): boolean {
    return this.game.canBuildSpaceStation(this.currentPlanet.id);
  }

  buildStation(): void {
    this.game.buildSpaceStation(this.currentPlanet.id);
  }

  toggleStationCollapsed(): void {
    this.stationCollapsed = !this.stationCollapsed;
  }

  private spawnFloatingText(event: MouseEvent, value: number): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const pipe = new FormatNumberPipe();
    const floatingText: FloatingText = {
      id: this.floatId++,
      value: `+${pipe.transform(value)}`,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    this.floatingTexts.push(floatingText);

    setTimeout(() => {
      this.floatingTexts = this.floatingTexts.filter(item => item.id !== floatingText.id);
    }, 900);
  }

  private triggerMineAnimation(): void {
    this.mineAnimating = true;
    setTimeout(() => {
      this.mineAnimating = false;
    }, 120);
  }

  private generateMineralNodes(): void {
    this.mineralNodes = Array.from({ length: 14 }, () => ({
      x: 10 + Math.random() * 80,
      y: 12 + Math.random() * 72,
      size: 10 + Math.random() * 26,
      delay: Math.random() * 3,
    }));
  }
}
