import { MilitaryBuilding } from '../models';

export const MILITARY_BUILDINGS: MilitaryBuilding[] = [
  {
    id: 'garrisonBarracks',
    name: 'Garrison Barracks',
    description: 'Training facilities that sharpen deployed units, multiplying their effective defense strength.',
    icon: 'GB',
    maxLevel: 5,
    baseCost: [
      { itemId: 'salvage', amount: 15 },
      { itemId: 'basicCircuits', amount: 8 },
    ],
    costScaling: 1.8,
    unlockAtScore: 1200,
    effectSummary: (l) => `Defense ×${(1 + 0.2 * l).toFixed(1)}`,
  },
  {
    id: 'fortificationWall',
    name: 'Fortification Wall',
    description: 'Reinforced perimeter structures that provide passive defense even without garrison units.',
    icon: 'FW',
    maxLevel: 5,
    baseCost: [
      { itemId: 'ferrite', amount: 40 },
      { itemId: 'titanium', amount: 10 },
    ],
    costScaling: 1.9,
    unlockAtScore: 1500,
    effectSummary: (l) => `+${8 * l} flat defense`,
  },
  {
    id: 'sensorArray',
    name: 'Sensor Array',
    description: 'Long-range detection systems that extend the time between incoming raids.',
    icon: 'SA',
    maxLevel: 3,
    baseCost: [
      { itemId: 'basicCircuits', amount: 12 },
      { itemId: 'hydrogen', amount: 20 },
    ],
    costScaling: 2.1,
    unlockAtScore: 1800,
    effectSummary: (l) => `Raid interval ×${(1 + 0.4 * l).toFixed(1)}`,
  },
  {
    id: 'armory',
    name: 'Armory',
    description: 'Advanced fabrication wing that produces additional units alongside each crafting run.',
    icon: 'AR',
    maxLevel: 3,
    baseCost: [
      { itemId: 'titaniumAlloy', amount: 4 },
      { itemId: 'reactorCores', amount: 2 },
    ],
    costScaling: 2.2,
    unlockAtScore: 2200,
    effectSummary: (l) => `+${l} unit(s) per craft`,
  },
];

export function getMilitaryBuildingDef(id: string): MilitaryBuilding | undefined {
  return MILITARY_BUILDINGS.find(b => b.id === id);
}
