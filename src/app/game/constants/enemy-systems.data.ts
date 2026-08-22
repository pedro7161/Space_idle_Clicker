import { EnemySystem } from '../models';

const ATTACK_BASE_DURATION_MS = 60_000;
const ATTACK_TIER_DURATION_STEP_MS = 30_000;

export const ENEMY_SYSTEMS: EnemySystem[] = [
  {
    id: 'raider-outpost',
    name: 'Raider Outpost',
    description: 'A small pirate base operating in the outer sectors.',
    tier: 1,
    revealAtScore: 3500,
    attackDurationMs: ATTACK_BASE_DURATION_MS + 1 * ATTACK_TIER_DURATION_STEP_MS,
    requiredDefenseStrength: 5,
    lootTable: [
      { itemId: 'carbon', baseAmount: 100, variance: 50 },
      { itemId: 'copper', baseAmount: 80, variance: 40 },
      { itemId: 'salvage', baseAmount: 20, variance: 10 },
    ],
  },
  {
    id: 'scavenger-den',
    name: 'Scavenger Den',
    description: 'A well-organized scavenger collective with valuable salvage.',
    tier: 2,
    revealAtScore: 4500,
    attackDurationMs: ATTACK_BASE_DURATION_MS + 2 * ATTACK_TIER_DURATION_STEP_MS,
    requiredDefenseStrength: 12,
    lootTable: [
      { itemId: 'ferrite', baseAmount: 120, variance: 60 },
      { itemId: 'silica', baseAmount: 100, variance: 50 },
      { itemId: 'rareCrystal', baseAmount: 40, variance: 20 },
      { itemId: 'salvage', baseAmount: 35, variance: 15 },
    ],
  },
  {
    id: 'pirate-station',
    name: 'Pirate Station',
    description: 'A heavily fortified station with dangerous defenders.',
    tier: 3,
    revealAtScore: 5500,
    attackDurationMs: ATTACK_BASE_DURATION_MS + 3 * ATTACK_TIER_DURATION_STEP_MS,
    requiredDefenseStrength: 25,
    lootTable: [
      { itemId: 'titanium', baseAmount: 150, variance: 75 },
      { itemId: 'hydrogen', baseAmount: 120, variance: 60 },
      { itemId: 'basicCircuits', baseAmount: 60, variance: 30 },
      { itemId: 'salvage', baseAmount: 50, variance: 25 },
    ],
  },
  {
    id: 'warlord-fortress',
    name: 'Warlord Fortress',
    description: 'A massive stronghold controlled by a powerful warlord.',
    tier: 4,
    revealAtScore: 7000,
    attackDurationMs: ATTACK_BASE_DURATION_MS + 4 * ATTACK_TIER_DURATION_STEP_MS,
    requiredDefenseStrength: 50,
    lootTable: [
      { itemId: 'uranium', baseAmount: 80, variance: 40 },
      { itemId: 'reactorCores', baseAmount: 30, variance: 15 },
      { itemId: 'titaniumAlloy', baseAmount: 50, variance: 25 },
      { itemId: 'salvage', baseAmount: 80, variance: 40 },
    ],
  },
  {
    id: 'void-overlord-citadel',
    name: 'Void Overlord Citadel',
    description: 'An ancient alien megastructure filled with apex technology.',
    tier: 5,
    revealAtScore: 9000,
    attackDurationMs: ATTACK_BASE_DURATION_MS + 5 * ATTACK_TIER_DURATION_STEP_MS,
    requiredDefenseStrength: 100,
    lootTable: [
      { itemId: 'uranium', baseAmount: 150, variance: 75 },
      { itemId: 'rareCrystal', baseAmount: 120, variance: 60 },
      { itemId: 'reactorCores', baseAmount: 60, variance: 30 },
      { itemId: 'titaniumAlloy', baseAmount: 80, variance: 40 },
      { itemId: 'salvage', baseAmount: 150, variance: 75 },
    ],
  },
];

export function getEnemySystemDef(systemId: string): EnemySystem | undefined {
  return ENEMY_SYSTEMS.find(system => system.id === systemId);
}
