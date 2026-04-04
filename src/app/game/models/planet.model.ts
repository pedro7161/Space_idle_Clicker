import { ItemCost, ResourceId } from './resource.model';

export interface Planet {
  id: string;
  name: string;
  description: string;
  availableResourceIds: ResourceId[];
  resourceMultipliers: Record<ResourceId, number>;
  travelCost: ItemCost[];
  requiredShipTier: number;
  orbitIndex: number;
  unlockedByDefault: boolean;
  color: string;
  mineralColor: string;
  bgGradient: string;
}
