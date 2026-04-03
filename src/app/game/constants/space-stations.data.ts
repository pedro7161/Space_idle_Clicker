import { SpaceStationBlueprint } from '../models';

export const SPACE_STATION_BLUEPRINTS: SpaceStationBlueprint[] = [
  {
    id: 'orbital-outpost',
    tier: 0,
    name: 'Orbital Outpost',
    description: 'A compact dock ring that turns local mining output into organized launches.',
    buildCost: [
      { itemId: 'refinedMetal', amount: 8 },
      { itemId: 'basicCircuits', amount: 4 },
    ],
    cargoBonusMultiplier: 1.2,
    travelTimeMultiplier: 0.95,
  },
  {
    id: 'orbital-relay',
    tier: 1,
    name: 'Orbital Relay',
    description: 'A reinforced logistics platform with better scheduling and faster cargo cycling.',
    buildCost: [
      { itemId: 'refinedMetal', amount: 14 },
      { itemId: 'oxygenCells', amount: 8 },
      { itemId: 'basicCircuits', amount: 6 },
    ],
    cargoBonusMultiplier: 1.35,
    travelTimeMultiplier: 0.9,
  },
  {
    id: 'orbital-hub',
    tier: 2,
    name: 'Orbital Hub',
    description: 'A high-throughput command station built for distant worlds and heavy redistribution.',
    buildCost: [
      { itemId: 'refinedMetal', amount: 24 },
      { itemId: 'oxygenCells', amount: 12 },
      { itemId: 'mechanicalParts', amount: 8 },
      { itemId: 'basicCircuits', amount: 10 },
    ],
    cargoBonusMultiplier: 1.5,
    travelTimeMultiplier: 0.86,
  },
];
