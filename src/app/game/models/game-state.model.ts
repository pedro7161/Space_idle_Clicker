import { ItemId, ResourceId } from './resource.model';
import { OwnedShip, ShipRoute } from './ship.model';
import { OwnedSpaceStation } from './space-station.model';

export interface GameState {
  version: number;
  planetInventories: Record<string, Record<ItemId, number>>;
  activeResourceId: ResourceId;
  upgradeLevels: Record<string, number>;
  autoMinerCounts: Record<string, number>;
  builtShipPartIds: string[];
  discoveredPlanetIds: string[];
  totalClicks: number;
  totalMined: Record<ResourceId, number>;
  currentPlanetId: string;
  shipLaunched: boolean;
  ships: OwnedShip[];
  shipRoutes: ShipRoute[];
  spaceStations: OwnedSpaceStation[];
  nextShipId: number;
  nextShipRouteId: number;
  lastTickAt: number;
}
