import { ItemCost, ItemId } from './resource.model';

export type ShipStatus = 'idle' | 'outbound' | 'returning';

export interface Ship {
  id: string;
  name: string;
  description: string;
  buildCost: ItemCost[];
  tier: number;
  cargoCapacity: number;
  travelSpeed: number;
  icon: string;
}

export interface ShipCargo {
  itemId: ItemId | null;
  amount: number;
}

export interface ShipTransit {
  fromPlanetId: string;
  toPlanetId: string;
  departAt: number;
  arriveAt: number;
}

export interface OwnedShip {
  id: string;
  definitionId: string;
  routeId: string | null;
  status: ShipStatus;
  currentPlanetId: string | null;
  cargo: ShipCargo;
  transit: ShipTransit | null;
}

export interface ShipRoute {
  id: string;
  shipId: string;
  originPlanetId: string;
  destinationPlanetId: string;
  itemId: ItemId;
  keepMinimum: number;
  enabled: boolean;
}
