import { ItemCost, ResourceId } from './resource.model';

export interface Planet {
  id: string;
  name: string;
  description: string;
  resourceMultipliers: Record<ResourceId, number>;
  travelCost: ItemCost[];
  unlockedByDefault: boolean;
  color: string;
  mineralColor: string;
  bgGradient: string;
}
