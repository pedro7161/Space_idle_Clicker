import { AutoMiner, ResourceId } from '../models';

interface MinerTemplate {
  suffix: string;
  name: string;
  description: string;
  perSecond: number;
  baseCost: (resourceId: ResourceId) => AutoMiner['baseCost'];
  costScaling: number;
  unlockAtTotal: number;
  icon: string;
  unlockCraftedId?: AutoMiner['unlockCraftedId'];
}

const MINER_TEMPLATES: MinerTemplate[] = [
  {
    suffix: 'rig',
    name: 'Field Rig',
    description: 'A rugged extractor that keeps a basic stream running on this planet.',
    perSecond: 0.8,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 30 },
      { itemId: 'refinedMetal', amount: 1 },
    ],
    costScaling: 1.5,
    unlockAtTotal: 60,
    icon: 'FR',
  },
  {
    suffix: 'array',
    name: 'Extraction Array',
    description: 'A stabilized automation platform tuned to this resource chain.',
    perSecond: 4,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 90 },
      { itemId: 'mechanicalParts', amount: 2 },
      { itemId: 'basicCircuits', amount: 1 },
    ],
    costScaling: 1.65,
    unlockAtTotal: 220,
    icon: 'EA',
    unlockCraftedId: 'mechanicalParts',
  },
];

const RESOURCE_LABELS: Record<ResourceId, string> = {
  carbon: 'Carbon',
  ferrite: 'Ferrite',
  oxygen: 'Oxygen',
};

const RESOURCE_IDS: ResourceId[] = ['carbon', 'ferrite', 'oxygen'];

export const AUTO_MINERS: AutoMiner[] = RESOURCE_IDS.flatMap(resourceId =>
  MINER_TEMPLATES.map(template => ({
    id: `${resourceId}-${template.suffix}`,
    resourceId,
    name: `${RESOURCE_LABELS[resourceId]} ${template.name}`,
    description: template.description,
    perSecond: template.perSecond,
    baseCost: template.baseCost(resourceId),
    costScaling: template.costScaling,
    icon: template.icon,
    unlockAtTotal: template.unlockAtTotal,
    unlockCraftedId: template.unlockCraftedId,
  })),
);
