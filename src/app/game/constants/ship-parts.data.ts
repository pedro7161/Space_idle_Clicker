import { ShipPart } from '../models';

export const SHIP_PARTS: ShipPart[] = [
  {
    id: 'hull',
    name: 'Hull Frame',
    description: 'A pressure-rated shell strong enough to survive launch.',
    cost: [
      { itemId: 'refinedMetal', amount: 8 },
      { itemId: 'mechanicalParts', amount: 4 },
    ],
    icon: 'HF',
    order: 1,
  },
  {
    id: 'thrusters',
    name: 'Thruster Stack',
    description: 'A patched propulsion system that can escape the first planet.',
    cost: [
      { itemId: 'condensedCarbon', amount: 6 },
      { itemId: 'oxygenCells', amount: 6 },
      { itemId: 'mechanicalParts', amount: 2 },
    ],
    icon: 'TS',
    order: 2,
  },
  {
    id: 'guidance',
    name: 'Guidance Core',
    description: 'Primitive avionics good enough for short interplanetary routes.',
    cost: [
      { itemId: 'basicCircuits', amount: 4 },
      { itemId: 'refinedMetal', amount: 4 },
    ],
    icon: 'GC',
    order: 3,
  },
];
