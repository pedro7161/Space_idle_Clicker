import { ItemCost } from './resource.model';

export interface SpaceStationBlueprint {
  id: string;
  tier: number;
  name: string;
  description: string;
  buildCost: ItemCost[];
  cargoBonusMultiplier: number;
  travelTimeMultiplier: number;
}

export interface OwnedSpaceStation {
  planetId: string;
  blueprintId: string;
}
