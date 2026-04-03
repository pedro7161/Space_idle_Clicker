import { ItemCost } from './resource.model';

export interface ShipPart {
  id: string;
  name: string;
  description: string;
  cost: ItemCost[];
  icon: string;
  order: number;
}
