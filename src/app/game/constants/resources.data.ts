import { CraftedDef, CraftedId, ItemId, ResourceDef, ResourceId } from '../models';

export const RESOURCE_DEFS: ResourceDef[] = [
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Fuel-rich organic matter used for heat, power, and survival systems.',
    icon: 'C',
    color: '#f59e0b',
    mineralColor: '#fbbf24',
    basePerClick: 1,
  },
  {
    id: 'ferrite',
    name: 'Ferrite',
    description: 'The structural backbone for plating, machinery, and ship construction.',
    icon: 'Fe',
    color: '#94a3b8',
    mineralColor: '#cbd5e1',
    basePerClick: 1,
  },
  {
    id: 'oxygen',
    name: 'Oxygen',
    description: 'A volatile gas used for pressure systems, fuel cells, and life support.',
    icon: 'O2',
    color: '#22c55e',
    mineralColor: '#86efac',
    basePerClick: 1,
  },
];

export const CRAFTED_DEFS: CraftedDef[] = [
  {
    id: 'condensedCarbon',
    name: 'Condensed Carbon',
    description: 'Compressed carbon bricks for high-density energy systems.',
    icon: 'CC',
    color: '#f97316',
    tier: 1,
  },
  {
    id: 'refinedMetal',
    name: 'Refined Metal',
    description: 'Purified ferrite alloys for durable structures and machines.',
    icon: 'RM',
    color: '#e2e8f0',
    tier: 1,
  },
  {
    id: 'oxygenCells',
    name: 'Oxygen Cells',
    description: 'Stable oxygen canisters for engines, pressure systems, and fuel.',
    icon: 'OC',
    color: '#4ade80',
    tier: 1,
  },
  {
    id: 'mechanicalParts',
    name: 'Mechanical Parts',
    description: 'Precision components required for automation and hull assemblies.',
    icon: 'MP',
    color: '#facc15',
    tier: 2,
  },
  {
    id: 'basicCircuits',
    name: 'Basic Circuits',
    description: 'Simple control boards for routing power and flight systems.',
    icon: 'BC',
    color: '#38bdf8',
    tier: 2,
  },
];

export const RESOURCE_IDS = RESOURCE_DEFS.map(resource => resource.id) as ResourceId[];
export const CRAFTED_IDS = CRAFTED_DEFS.map(item => item.id) as CraftedId[];
export const ALL_ITEM_IDS = [...RESOURCE_IDS, ...CRAFTED_IDS] as ItemId[];
