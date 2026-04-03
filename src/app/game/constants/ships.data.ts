import { Ship } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const shipMessages = GAME_MESSAGES.progression.ships;

export const SHIPS: Ship[] = [
  {
    id: 'shuttle',
    name: shipMessages.shuttle.name,
    description: shipMessages.shuttle.description,
    buildCost: [
      { itemId: 'refinedMetal', amount: 10 },
      { itemId: 'mechanicalParts', amount: 2 },
    ],
    tier: 1,
    cargoCapacity: 20,
    travelSpeed: 1.6,
    icon: '🚀',
  },
  {
    id: 'hauler',
    name: shipMessages.hauler.name,
    description: shipMessages.hauler.description,
    buildCost: [
      { itemId: 'refinedMetal', amount: 14 },
      { itemId: 'oxygenCells', amount: 6 },
      { itemId: 'mechanicalParts', amount: 4 },
    ],
    tier: 1,
    cargoCapacity: 40,
    travelSpeed: 0.95,
    icon: '🚛',
  },
  {
    id: 'cruiser',
    name: shipMessages.cruiser.name,
    description: shipMessages.cruiser.description,
    buildCost: [
      { itemId: 'refinedMetal', amount: 18 },
      { itemId: 'mechanicalParts', amount: 8 },
      { itemId: 'basicCircuits', amount: 4 },
    ],
    tier: 2,
    cargoCapacity: 56,
    travelSpeed: 1.25,
    icon: '🛸',
  },
  {
    id: 'quantum_ship',
    name: shipMessages.quantum_ship.name,
    description: shipMessages.quantum_ship.description,
    buildCost: [
      { itemId: 'refinedMetal', amount: 30 },
      { itemId: 'mechanicalParts', amount: 12 },
      { itemId: 'basicCircuits', amount: 8 },
      { itemId: 'oxygenCells', amount: 10 },
    ],
    tier: 3,
    cargoCapacity: 96,
    travelSpeed: 1.9,
    icon: '✨',
  },
];
