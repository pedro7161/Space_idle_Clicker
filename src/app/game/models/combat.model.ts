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
  dangerLevel: number; // starts at planet.requiredShipTier, can escalate/de-escalate
  nextRaidAt: number; // epoch ms, 0 if not yet scheduled
  raidCount: number;
  lastRaidAt: number | null;
  consecutiveUndefendedRaids: number;
  consecutiveDefendedRaids: number;
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

export interface ActiveInvasionRaid {
  id: string;
  fleetId: string;
  fleetName: string;
  fleetTier: number;
  targetPlanetId: string;
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
  garrisonLost: number;
  dangerLevelAfter: number;
}

export interface FactionAngerEvent {
  id: string;
  kind: 'factionAnger';
  previousTier: 'calm' | 'alert' | 'enraged';
  newTier: 'calm' | 'alert' | 'enraged';
  timestamp: number;
}
