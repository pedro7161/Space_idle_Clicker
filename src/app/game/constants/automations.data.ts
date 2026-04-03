import { AutoMiner, ResourceId } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const automationMessages = GAME_MESSAGES.progression.automationTemplates;

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
    name: automationMessages.rig.name,
    description: automationMessages.rig.description,
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
    name: automationMessages.array.name,
    description: automationMessages.array.description,
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
  carbon: GAME_MESSAGES.resources.raw.carbon.name,
  ferrite: GAME_MESSAGES.resources.raw.ferrite.name,
  oxygen: GAME_MESSAGES.resources.raw.oxygen.name,
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
