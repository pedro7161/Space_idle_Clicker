export type ResourceId =
  | 'carbon'
  | 'ferrite'
  | 'oxygen'
  | 'copper'
  | 'silica'
  | 'hydrogen'
  | 'titanium'
  | 'rareCrystal'
  | 'uranium'
  | 'salvage';

export type CraftedId =
  | 'condensedCarbon'
  | 'refinedMetal'
  | 'oxygenCells'
  | 'mechanicalParts'
  | 'basicCircuits'
  | 'titaniumAlloy'
  | 'reactorCores'
  | 'sentinelDrone'
  | 'defenseArray'
  | 'patrolCorvette'
  | 'ionCruiser'
  | 'voidBattleship'
  | 'quantumDreadnought';

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
