import { CraftedId, ItemCost, ResourceId } from './resource.model';

export interface AutoMiner {
  id: string;
  resourceId: ResourceId;
  name: string;
  description: string;
  perSecond: number;
  baseCost: ItemCost[];
  costScaling: number;
  icon: string;
  unlockAtTotal: number;
  unlockCraftedId?: CraftedId;
}
