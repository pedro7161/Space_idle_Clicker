import { CraftedDef, CraftedId, ItemId, ResourceDef, ResourceId } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const resourceMessages = GAME_MESSAGES.resources.raw;
const craftedMessages = GAME_MESSAGES.resources.crafted;

export const RESOURCE_DEFS: ResourceDef[] = [
  {
    id: 'carbon',
    name: resourceMessages.carbon.name,
    description: resourceMessages.carbon.description,
    icon: 'C',
    color: '#f59e0b',
    mineralColor: '#fbbf24',
    basePerClick: 1,
  },
  {
    id: 'ferrite',
    name: resourceMessages.ferrite.name,
    description: resourceMessages.ferrite.description,
    icon: 'Fe',
    color: '#94a3b8',
    mineralColor: '#cbd5e1',
    basePerClick: 1,
  },
  {
    id: 'oxygen',
    name: resourceMessages.oxygen.name,
    description: resourceMessages.oxygen.description,
    icon: 'O2',
    color: '#22c55e',
    mineralColor: '#86efac',
    basePerClick: 1,
  },
];

export const CRAFTED_DEFS: CraftedDef[] = [
  {
    id: 'condensedCarbon',
    name: craftedMessages.condensedCarbon.name,
    description: craftedMessages.condensedCarbon.description,
    icon: 'CC',
    color: '#f97316',
    tier: 1,
  },
  {
    id: 'refinedMetal',
    name: craftedMessages.refinedMetal.name,
    description: craftedMessages.refinedMetal.description,
    icon: 'RM',
    color: '#e2e8f0',
    tier: 1,
  },
  {
    id: 'oxygenCells',
    name: craftedMessages.oxygenCells.name,
    description: craftedMessages.oxygenCells.description,
    icon: 'OC',
    color: '#4ade80',
    tier: 1,
  },
  {
    id: 'mechanicalParts',
    name: craftedMessages.mechanicalParts.name,
    description: craftedMessages.mechanicalParts.description,
    icon: 'MP',
    color: '#facc15',
    tier: 2,
  },
  {
    id: 'basicCircuits',
    name: craftedMessages.basicCircuits.name,
    description: craftedMessages.basicCircuits.description,
    icon: 'BC',
    color: '#38bdf8',
    tier: 2,
  },
];

export const RESOURCE_IDS = RESOURCE_DEFS.map(resource => resource.id) as ResourceId[];
export const CRAFTED_IDS = CRAFTED_DEFS.map(item => item.id) as CraftedId[];
export const ALL_ITEM_IDS = [...RESOURCE_IDS, ...CRAFTED_IDS] as ItemId[];
