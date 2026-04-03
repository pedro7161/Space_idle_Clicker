import { ItemId, ResourceId } from './resource.model';

export interface GameState {
  version: number;
  inventory: Record<ItemId, number>;
  activeResourceId: ResourceId;
  upgradeLevels: Record<string, number>;
  autoMinerCounts: Record<string, number>;
  builtShipPartIds: string[];
  discoveredPlanetIds: string[];
  totalClicks: number;
  totalMined: Record<ResourceId, number>;
  currentPlanetId: string;
  shipLaunched: boolean;
  lastTickAt: number;
}
