import { MilitaryUnitDef } from '../models';

export const MILITARY_UNIT_DEFS: MilitaryUnitDef[] = [
  {
    id: 'sentinelDrone',
    name: 'Sentinel Drone',
    description: 'Autonomous scout drone for planetary defense.',
    defenseStrength: 1,
    tier: 1,
    recipeId: 'sentinel-drone',
    unlockAtScore: 1200,
  },
  {
    id: 'defenseArray',
    name: 'Defense Array',
    description: 'Modular defense turrets with targeting systems.',
    defenseStrength: 3,
    tier: 2,
    recipeId: 'defense-array',
    unlockAtScore: 1800,
  },
  {
    id: 'patrolCorvette',
    name: 'Patrol Corvette',
    description: 'Light armed vessel for planetary patrols.',
    defenseStrength: 6,
    tier: 3,
    recipeId: 'patrol-corvette',
    unlockAtScore: 2500,
  },
  {
    id: 'ionCruiser',
    name: 'Ion Cruiser',
    description: 'Mid-size combat vessel with ion weapons.',
    defenseStrength: 10,
    tier: 4,
    recipeId: 'ion-cruiser',
    unlockAtScore: 3500,
  },
  {
    id: 'voidBattleship',
    name: 'Void Battleship',
    description: 'Heavy capital ship for major defense operations.',
    defenseStrength: 18,
    tier: 5,
    recipeId: 'void-battleship',
    unlockAtScore: 5000,
  },
  {
    id: 'quantumDreadnought',
    name: 'Quantum Dreadnought',
    description: 'Apex military platform with quantum weapons.',
    defenseStrength: 30,
    tier: 6,
    recipeId: 'quantum-dreadnought',
    unlockAtScore: 7500,
  },
];

export function getMilitaryUnitDef(unitId: string): MilitaryUnitDef | undefined {
  return MILITARY_UNIT_DEFS.find(unit => unit.id === unitId);
}
