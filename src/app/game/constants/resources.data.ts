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
  {
    id: 'copper',
    name: resourceMessages.copper.name,
    description: resourceMessages.copper.description,
    icon: 'Cu',
    color: '#f97316',
    mineralColor: '#fdba74',
    basePerClick: 1,
  },
  {
    id: 'silica',
    name: resourceMessages.silica.name,
    description: resourceMessages.silica.description,
    icon: 'Si',
    color: '#e2e8f0',
    mineralColor: '#f8fafc',
    basePerClick: 1,
  },
  {
    id: 'hydrogen',
    name: resourceMessages.hydrogen.name,
    description: resourceMessages.hydrogen.description,
    icon: 'H2',
    color: '#38bdf8',
    mineralColor: '#bae6fd',
    basePerClick: 1,
  },
  {
    id: 'titanium',
    name: resourceMessages.titanium.name,
    description: resourceMessages.titanium.description,
    icon: 'Ti',
    color: '#a78bfa',
    mineralColor: '#ddd6fe',
    basePerClick: 1,
  },
  {
    id: 'rareCrystal',
    name: resourceMessages.rareCrystal.name,
    description: resourceMessages.rareCrystal.description,
    icon: 'RC',
    color: '#ec4899',
    mineralColor: '#f9a8d4',
    basePerClick: 1,
  },
  {
    id: 'uranium',
    name: resourceMessages.uranium.name,
    description: resourceMessages.uranium.description,
    icon: 'U',
    color: '#a3e635',
    mineralColor: '#d9f99d',
    basePerClick: 2,
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
  {
    id: 'titaniumAlloy',
    name: craftedMessages.titaniumAlloy.name,
    description: craftedMessages.titaniumAlloy.description,
    icon: 'TA',
    color: '#c4b5fd',
    tier: 3,
  },
  {
    id: 'reactorCores',
    name: craftedMessages.reactorCores.name,
    description: craftedMessages.reactorCores.description,
    icon: 'RC',
    color: '#bef264',
    tier: 4,
  },
];

export const RESOURCE_IDS = RESOURCE_DEFS.map(resource => resource.id) as ResourceId[];
export const CRAFTED_IDS = CRAFTED_DEFS.map(item => item.id) as CraftedId[];
export const ALL_ITEM_IDS = [...RESOURCE_IDS, ...CRAFTED_IDS] as ItemId[];
