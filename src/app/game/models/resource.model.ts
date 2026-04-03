export type ResourceId = 'carbon' | 'ferrite' | 'oxygen';

export type CraftedId =
  | 'condensedCarbon'
  | 'refinedMetal'
  | 'oxygenCells'
  | 'mechanicalParts'
  | 'basicCircuits';

export type ItemId = ResourceId | CraftedId;

export interface ItemCost {
  itemId: ItemId;
  amount: number;
}

export interface ResourceDef {
  id: ResourceId;
  name: string;
  description: string;
  icon: string;
  color: string;
  mineralColor: string;
  basePerClick: number;
}

export interface CraftedDef {
  id: CraftedId;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: number;
}
