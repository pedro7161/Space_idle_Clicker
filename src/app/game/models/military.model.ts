import { CraftedId, ItemCost } from './resource.model';

export type MilitaryUnitId = Extract<CraftedId, 'sentinelDrone' | 'defenseArray' | 'patrolCorvette' | 'ionCruiser' | 'voidBattleship' | 'quantumDreadnought'>;

export interface MilitaryUnitDef {
  id: MilitaryUnitId;
  name: string;
  description: string;
  defenseStrength: number;
  tier: number;
  recipeId: string;
  unlockAtScore: number;
}

export interface DeployedGarrison {
  planetId: string;
  unitId: MilitaryUnitId;
  count: number;
}

export interface MilitaryUnitTransit {
  id: string;
  unitId: MilitaryUnitId;
  count: number;
  fromPlanetId: string;
  toPlanetId: string;
  kind?: 'deploy' | 'recall';
  departAt: number;
  arriveAt: number;
}

export type MilitaryBuildingId = 'garrisonBarracks' | 'fortificationWall' | 'sensorArray' | 'armory' | 'planetaryHangar';

export interface MilitaryBuilding {
  id: MilitaryBuildingId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: ItemCost[];
  costScaling: number;
  unlockAtScore: number;
  effectSummary: (level: number) => string;
}
