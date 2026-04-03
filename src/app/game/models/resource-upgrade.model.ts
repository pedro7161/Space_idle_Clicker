import { ItemCost, ResourceId } from './resource.model';

export type UpgradeEffect = 'flatClick' | 'yieldMultiplier';

export interface ResourceUpgrade {
  id: string;
  resourceId: ResourceId;
  name: string;
  description: string;
  baseCost: ItemCost[];
  costScaling: number;
  maxLevel: number;
  effectType: UpgradeEffect;
  effectValue: number;
  icon: string;
  unlockAtTotal: number;
}
