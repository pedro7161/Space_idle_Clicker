import { ItemId } from './resource.model';
import { MilitaryUnitId } from './military.model';

export interface EnemyLootEntry {
  itemId: ItemId;
  baseAmount: number;
  variance: number;
}

export interface EnemySystem {
  id: string;
  name: string;
  description: string;
  tier: number;
  revealAtScore: number;
  attackDurationMs: number;
  requiredDefenseStrength: number;
  lootTable: EnemyLootEntry[];
}

export interface ActiveAttack {
  id: string;
  originPlanetId: string;
  targetSystemId: string;
  unitsLaunched: Record<MilitaryUnitId, number>;
  launchedAt: number;
  arriveAt: number;
  totalStrength: number;
}

export interface AttackResult {
  id: string;
  kind: 'attack';
  systemId: string;
  systemName: string;
  success: boolean;
  lootObtained: Record<ItemId, number>;
  casualtyCount: number;
  strengthRatio: number;
  timestamp: number;
}
