import { ItemCost, ItemId } from './resource.model';
import { LogisticsLocationKind } from './logistics-location.model';

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
  fromKind: LogisticsLocationKind;
  toPlanetId: string;
  toKind: LogisticsLocationKind;
  departAt: number;
  arriveAt: number;
}

export interface OwnedShip {
  id: string;
  definitionId: string;
  routeId: string | null;
  status: ShipStatus;
  currentPlanetId: string | null;
  currentLocationKind: LogisticsLocationKind | null;
  cargo: ShipCargo;
  transit: ShipTransit | null;
}

export interface ShipRoute {
  id: string;
  shipId: string;
  originPlanetId: string;
  originKind: LogisticsLocationKind;
  destinationPlanetId: string;
  destinationKind: LogisticsLocationKind;
  itemId: ItemId;
  keepMinimum: number;
  enabled: boolean;
}
