import { CraftedId, ItemCost } from './resource.model';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: ItemCost[];
  outputId: CraftedId;
  outputAmount: number;
  tier: number;
  unlockAtTotal: number;
  icon: string;
}
