import { ShipPart } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const shipPartMessages = GAME_MESSAGES.progression.shipParts;

export const SHIP_PARTS: ShipPart[] = [
  {
    id: 'hull',
    name: shipPartMessages.hull.name,
    description: shipPartMessages.hull.description,
    cost: [
      { itemId: 'refinedMetal', amount: 8 },
      { itemId: 'mechanicalParts', amount: 4 },
    ],
    icon: 'HF',
    order: 1,
  },
  {
    id: 'thrusters',
    name: shipPartMessages.thrusters.name,
    description: shipPartMessages.thrusters.description,
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
    name: shipPartMessages.guidance.name,
    description: shipPartMessages.guidance.description,
    cost: [
      { itemId: 'basicCircuits', amount: 4 },
      { itemId: 'refinedMetal', amount: 4 },
    ],
    icon: 'GC',
    order: 3,
  },
];
