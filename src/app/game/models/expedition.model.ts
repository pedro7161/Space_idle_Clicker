import { ItemCost, ResourceId } from './resource.model';

export interface GeneratedPlanetSeed {
  id: string;
  sequence: number;
  primaryResourceId: ResourceId;
  supportResourceIds: ResourceId[];
  orbitIndex: number;
  orbitPosition: number;
}

export interface ExpeditionMission {
  targetSequence: number;
  departAt: number;
  arriveAt: number;
  fuelRequired: number;
  launchCost: ItemCost[];
}

export interface ExpeditionState {
  shipBuilt: boolean;
  engineLevel: number;
  fuelLevel: number;
  expeditionsCompleted: number;
  activeMission: ExpeditionMission | null;
}
