import { ItemId, ResourceId } from './resource.model';
import { MilitaryUnitId } from './military.model';

export interface InvasionFleet {
  id: string;
  name: string;
  tier: number;
  hp: number;
  maxHp: number;
  spawnedAt: number;
  nextAttackAt: number;
}

export interface PlanetThreatState {
  planetId: string;
  dangerLevel: number; // 0-5
  nextRaidAt: number; // epoch ms, 0 if not yet scheduled
  raidCount: number;
  lastRaidAt: number | null;
}

export interface ActiveInvasionStrike {
  id: string;
  originPlanetId: string;
  targetFleetId: string;
  unitsLaunched: Record<MilitaryUnitId, number>;
  totalDamage: number;
  launchedAt: number;
  arriveAt: number;
}

export interface RaidEvent {
  id: string; // "raid-{planetId}-{timestamp}"
  kind: 'raid';
  planetId: string;
  resourcesStolen: Record<ItemId, number>;
  resolvedAt: number;
  defensePointsActive: number;
}
