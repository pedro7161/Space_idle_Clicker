import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import { FloatingText, Planet, ResourceDef } from '../../models';
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

  get craftedItems() {
    return this.game.craftedItems;
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

  getCraftedAmount(itemId: string): number {
    return this.game.getInventoryAmount(itemId as never);
  }

  getPlanetMultiplier(resourceId: ResourceDef['id']): number {
    return this.game.getPlanetMultiplier(this.currentPlanet.id, resourceId);
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
