import { Ship } from '../models';

export const INITIAL_SHIPS: Ship[] = [
  {
    id: 'shuttle',
    name: 'Basic Shuttle',
    description: 'A patched-together shuttle. Enough to leave the planet.',
    cost: 2000,
    tier: 1,
    purchased: false,
    icon: '🚀',
  },
  {
    id: 'cruiser',
    name: 'Star Cruiser',
    description: 'A proper exploration vessel. Reaches farther worlds.',
    cost: 40000,
    tier: 2,
    purchased: false,
    icon: '🛸',
  },
  {
    id: 'quantum_ship',
    name: 'Quantum Vessel',
    description: 'Warps through dimensions. Access all planets.',
    cost: 400000,
    tier: 3,
    purchased: false,
    icon: '✨',
  },
];
