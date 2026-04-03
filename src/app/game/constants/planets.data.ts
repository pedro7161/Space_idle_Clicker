import { Planet } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const planetMessages = GAME_MESSAGES.world.planets;

export const PLANETS: Planet[] = [
  {
    id: 'solara',
    name: planetMessages.solara.name,
    description: planetMessages.solara.description,
    resourceMultipliers: {
      carbon: 1,
      ferrite: 1,
      oxygen: 1,
    },
    travelCost: [],
    requiredShipTier: 0,
    orbitIndex: 0,
    unlockedByDefault: true,
    color: '#f59e0b',
    mineralColor: '#fcd34d',
    bgGradient: 'radial-gradient(circle at 50% 120%, #5b3411 0%, #1e160f 52%, #090b10 100%)',
  },
  {
    id: 'ferros',
    name: planetMessages.ferros.name,
    description: planetMessages.ferros.description,
    resourceMultipliers: {
      carbon: 0.65,
      ferrite: 2.8,
      oxygen: 0.9,
    },
    travelCost: [
      { itemId: 'oxygenCells', amount: 4 },
      { itemId: 'refinedMetal', amount: 3 },
    ],
    requiredShipTier: 1,
    orbitIndex: 1,
    unlockedByDefault: false,
    color: '#94a3b8',
    mineralColor: '#e2e8f0',
    bgGradient: 'radial-gradient(circle at 50% 120%, #334155 0%, #111827 55%, #05070d 100%)',
  },
  {
    id: 'verdara',
    name: planetMessages.verdara.name,
    description: planetMessages.verdara.description,
    resourceMultipliers: {
      carbon: 0.85,
      ferrite: 0.7,
      oxygen: 3.2,
    },
    travelCost: [
      { itemId: 'oxygenCells', amount: 6 },
      { itemId: 'mechanicalParts', amount: 2 },
    ],
    requiredShipTier: 1,
    orbitIndex: 2,
    unlockedByDefault: false,
    color: '#22c55e',
    mineralColor: '#86efac',
    bgGradient: 'radial-gradient(circle at 50% 120%, #14532d 0%, #052e16 50%, #030712 100%)',
  },
  {
    id: 'cinder',
    name: planetMessages.cinder.name,
    description: planetMessages.cinder.description,
    resourceMultipliers: {
      carbon: 3.4,
      ferrite: 0.8,
      oxygen: 1.1,
    },
    travelCost: [
      { itemId: 'mechanicalParts', amount: 3 },
      { itemId: 'basicCircuits', amount: 2 },
    ],
    requiredShipTier: 2,
    orbitIndex: 4,
    unlockedByDefault: false,
    color: '#f97316',
    mineralColor: '#fb923c',
    bgGradient: 'radial-gradient(circle at 50% 120%, #7c2d12 0%, #431407 50%, #09090b 100%)',
  },
];
