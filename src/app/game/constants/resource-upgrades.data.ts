import { ResourceId, ResourceUpgrade } from '../models';
import { RESOURCE_DEFS } from './resources.data';
import { GAME_MESSAGES } from '../i18n/game-messages';

const upgradeMessages = GAME_MESSAGES.progression.upgradeTemplates;

interface UpgradeTemplate {
  suffix: string;
  name: string;
  description: string;
  effectType: ResourceUpgrade['effectType'];
  effectValue: number;
  baseCost: (resourceId: ResourceId) => ResourceUpgrade['baseCost'];
  costScaling: number;
  maxLevel: number;
  unlockAtTotal: number;
  icon: string;
}

const UPGRADE_TEMPLATES: UpgradeTemplate[] = [
  {
    suffix: 'cutters',
    name: upgradeMessages.cutters.name,
    description: upgradeMessages.cutters.description,
    effectType: 'flatClick',
    effectValue: 1,
    baseCost: resourceId => [{ itemId: resourceId, amount: 20 }],
    costScaling: 1.7,
    maxLevel: 6,
    unlockAtTotal: 0,
    icon: 'CL',
  },
  {
    suffix: 'survey',
    name: upgradeMessages.survey.name,
    description: upgradeMessages.survey.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.2,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 35 },
      { itemId: 'refinedMetal', amount: 1 },
    ],
    costScaling: 1.85,
    maxLevel: 5,
    unlockAtTotal: 80,
    icon: 'SM',
  },
  {
    suffix: 'lattice',
    name: upgradeMessages.lattice.name,
    description: upgradeMessages.lattice.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.35,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 80 },
      { itemId: 'mechanicalParts', amount: 2 },
      { itemId: 'basicCircuits', amount: 1 },
    ],
    costScaling: 2,
    maxLevel: 4,
    unlockAtTotal: 260,
    icon: 'PL',
  },
];

export const RESOURCE_UPGRADES: ResourceUpgrade[] = RESOURCE_DEFS.flatMap(resource =>
  UPGRADE_TEMPLATES.map(template => ({
    id: `${resource.id}-${template.suffix}`,
    resourceId: resource.id,
    name: `${resource.name} ${template.name}`,
    description: template.description,
    baseCost: template.baseCost(resource.id),
    costScaling: template.costScaling,
    maxLevel: template.maxLevel,
    effectType: template.effectType,
    effectValue: template.effectValue,
    icon: template.icon,
    unlockAtTotal: template.unlockAtTotal,
  })),
);
