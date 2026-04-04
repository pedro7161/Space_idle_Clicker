import { CraftedId, ItemCost, ResourceId } from './resource.model';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  resourceIds: ResourceId[];
  ingredients: ItemCost[];
  outputId: CraftedId;
  outputAmount: number;
  tier: number;
  unlockAtTotal: number;
  icon: string;
}
