import { ResourceId, ResourceUpgrade } from '../models';
import { RESOURCE_DEFS } from './resources.data';
import { GAME_MESSAGES } from '../i18n/game-messages';

const upgradeMessages = GAME_MESSAGES.progression.upgradeTemplates;
const specialUpgradeMessages = GAME_MESSAGES.progression.specialUpgrades;

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
    costScaling: 1.58,
    maxLevel: 8,
    unlockAtTotal: 0,
    icon: 'CL',
  },
  {
    suffix: 'survey',
    name: upgradeMessages.survey.name,
    description: upgradeMessages.survey.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.18,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 35 },
      { itemId: 'refinedMetal', amount: 1 },
    ],
    costScaling: 1.72,
    maxLevel: 7,
    unlockAtTotal: 60,
    icon: 'SM',
  },
  {
    suffix: 'lattice',
    name: upgradeMessages.lattice.name,
    description: upgradeMessages.lattice.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.3,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 80 },
      { itemId: 'mechanicalParts', amount: 2 },
      { itemId: 'basicCircuits', amount: 1 },
    ],
    costScaling: 1.88,
    maxLevel: 6,
    unlockAtTotal: 220,
    icon: 'PL',
  },
  {
    suffix: 'harmonics',
    name: upgradeMessages.harmonics.name,
    description: upgradeMessages.harmonics.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.55,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 140 },
      { itemId: 'mechanicalParts', amount: 4 },
      { itemId: 'basicCircuits', amount: 3 },
    ],
    costScaling: 2.05,
    maxLevel: 5,
    unlockAtTotal: 520,
    icon: 'HY',
  },
  {
    suffix: 'overdrive',
    name: upgradeMessages.overdrive.name,
    description: upgradeMessages.overdrive.description,
    effectType: 'flatClick',
    effectValue: 3,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 220 },
      { itemId: 'titaniumAlloy', amount: 1 },
      { itemId: 'mechanicalParts', amount: 6 },
      { itemId: 'basicCircuits', amount: 4 },
    ],
    costScaling: 2.15,
    maxLevel: 4,
    unlockAtTotal: 900,
    icon: 'OD',
  },
  {
    suffix: 'cascade',
    name: upgradeMessages.cascade.name,
    description: upgradeMessages.cascade.description,
    effectType: 'yieldMultiplier',
    effectValue: 0.95,
    baseCost: resourceId => [
      { itemId: resourceId, amount: 360 },
      { itemId: 'titaniumAlloy', amount: 2 },
      { itemId: 'reactorCores', amount: 1 },
      { itemId: 'basicCircuits', amount: 8 },
    ],
    costScaling: 2.3,
    maxLevel: 4,
    unlockAtTotal: 1450,
    icon: 'DC',
  },
];

const SPECIAL_RESOURCE_UPGRADES: ResourceUpgrade[] = [
  {
    id: 'uranium-reactor-core',
    resourceId: 'uranium',
    name: specialUpgradeMessages['uranium-reactor-core'].name,
    description: specialUpgradeMessages['uranium-reactor-core'].description,
    baseCost: [
      { itemId: 'uranium', amount: 100 },
      { itemId: 'rareCrystal', amount: 10 },
      { itemId: 'titaniumAlloy', amount: 2 },
    ],
    costScaling: 1.95,
    maxLevel: 6,
    effectType: 'flatClick',
    effectValue: 5,
    icon: 'RX',
    unlockAtTotal: 120,
  },
  {
    id: 'uranium-breeder-cycle',
    resourceId: 'uranium',
    name: specialUpgradeMessages['uranium-breeder-cycle'].name,
    description: specialUpgradeMessages['uranium-breeder-cycle'].description,
    baseCost: [
      { itemId: 'uranium', amount: 180 },
      { itemId: 'basicCircuits', amount: 8 },
      { itemId: 'reactorCores', amount: 1 },
    ],
    costScaling: 2.1,
    maxLevel: 5,
    effectType: 'yieldMultiplier',
    effectValue: 0.9,
    icon: 'BC',
    unlockAtTotal: 280,
  },
  {
    id: 'uranium-criticality-overdrive',
    resourceId: 'uranium',
    name: specialUpgradeMessages['uranium-criticality-overdrive'].name,
    description: specialUpgradeMessages['uranium-criticality-overdrive'].description,
    baseCost: [
      { itemId: 'uranium', amount: 320 },
      { itemId: 'rareCrystal', amount: 16 },
      { itemId: 'reactorCores', amount: 2 },
    ],
    costScaling: 2.25,
    maxLevel: 4,
    effectType: 'yieldMultiplier',
    effectValue: 1.6,
    icon: 'OD',
    unlockAtTotal: 650,
  },
];

export const RESOURCE_UPGRADES: ResourceUpgrade[] = [
  ...RESOURCE_DEFS.flatMap(resource =>
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
  ),
  ...SPECIAL_RESOURCE_UPGRADES,
];
