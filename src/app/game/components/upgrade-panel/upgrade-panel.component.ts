import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { GameService } from '../../services/game.service';
import {
  AutoMiner,
  ItemCost,
  ItemId,
  Planet,
  Recipe,
  ResourceDef,
  ResourceUpgrade,
  ShipPart,
} from '../../models';

type Tab = 'upgrades' | 'crafting' | 'automation' | 'launch';

interface TabDef {
  key: Tab;
  label: string;
}

@Component({
  selector: 'app-upgrade-panel',
  standalone: true,
  imports: [CommonModule, FormatNumberPipe],
  templateUrl: './upgrade-panel.component.html',
  styleUrl: './upgrade-panel.component.css',
})
export class UpgradePanelComponent {
  activeTab: Tab = 'upgrades';

  readonly tabs: TabDef[] = [
    { key: 'upgrades', label: 'Upgrades' },
    { key: 'crafting', label: 'Crafting' },
    { key: 'automation', label: 'Automation' },
    { key: 'launch', label: 'Launch' },
  ];

  constructor(public game: GameService) {}

  get resources(): ResourceDef[] {
    return this.game.resources;
  }

  get craftedItems() {
    return this.game.craftedItems;
  }

  get currentPlanet(): Planet {
    return this.game.getCurrentPlanet();
  }

  get visibleRecipes(): Recipe[] {
    return this.game.recipes.filter(recipe => this.game.isRecipeVisible(recipe));
  }

  get visibleAutoMiners(): AutoMiner[] {
    return this.game.autoMiners.filter(miner => this.game.isAutoMinerVisible(miner));
  }

  get planets(): Planet[] {
    return this.game.planets;
  }

  get shipParts(): ShipPart[] {
    return this.game.shipParts;
  }

  get state() {
    return this.game.getState();
  }

  getResourceUpgrades(resourceId: ResourceDef['id']): ResourceUpgrade[] {
    return this.game.upgrades.filter(
      upgrade => upgrade.resourceId === resourceId && this.game.isUpgradeVisible(upgrade),
    );
  }

  getMinersForResource(resourceId: ResourceDef['id']): AutoMiner[] {
    return this.visibleAutoMiners.filter(miner => miner.resourceId === resourceId);
  }

  getItemAmount(itemId: ItemId): number {
    return this.game.getInventoryAmount(itemId);
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

  getUpgradeLevel(upgrade: ResourceUpgrade): number {
    return this.game.getUpgradeLevel(this.currentPlanet.id, upgrade.id);
  }

  getAutoMinerCount(miner: AutoMiner): number {
    return this.game.getAutoMinerCount(this.currentPlanet.id, miner.id);
  }

  getAutoMinerOutput(miner: AutoMiner): number {
    const count = this.getAutoMinerCount(miner);
    if (count === 0) {
      return 0;
    }

    const totalResourceRate = this.game.getAutoRateForPlanetResource(this.currentPlanet.id, miner.resourceId);
    const resourceMiners = this.getMinersForResource(miner.resourceId);
    const totalBase = resourceMiners.reduce((sum, item) => {
      return sum + item.perSecond * this.getAutoMinerCount(item);
    }, 0);

    if (totalBase <= 0) {
      return 0;
    }

    return totalResourceRate * ((miner.perSecond * count) / totalBase);
  }

  canBuildShipPart(part: ShipPart): boolean {
    return !this.game.isShipPartBuilt(part.id) && this.game.canAfford(part.cost);
  }

  buyUpgrade(upgrade: ResourceUpgrade): void {
    this.game.buyUpgrade(upgrade.id);
  }

  craft(recipe: Recipe): void {
    this.game.craft(recipe.id);
  }

  buyAutoMiner(miner: AutoMiner): void {
    this.game.buyAutoMiner(miner.id);
  }

  buildShipPart(part: ShipPart): void {
    this.game.buildShipPart(part.id);
  }

  launchShip(): void {
    this.game.launchShip();
  }

  travelToPlanet(planet: Planet): void {
    this.game.travelToPlanet(planet.id);
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  trackByCost(_: number, item: ItemCost): string {
    return `${item.itemId}-${item.amount}`;
  }
}
