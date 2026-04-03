import { Recipe } from '../models';
import { GAME_MESSAGES } from '../i18n/game-messages';

const recipeMessages = GAME_MESSAGES.progression.recipes;

export const RECIPES: Recipe[] = [
  {
    id: 'condensed-carbon',
    name: recipeMessages['condensed-carbon'].name,
    description: recipeMessages['condensed-carbon'].description,
    ingredients: [{ itemId: 'carbon', amount: 25 }],
    outputId: 'condensedCarbon',
    outputAmount: 1,
    tier: 1,
    unlockAtTotal: 20,
    icon: 'CC',
  },
  {
    id: 'refined-metal',
    name: recipeMessages['refined-metal'].name,
    description: recipeMessages['refined-metal'].description,
    ingredients: [{ itemId: 'ferrite', amount: 25 }],
    outputId: 'refinedMetal',
    outputAmount: 1,
    tier: 1,
    unlockAtTotal: 20,
    icon: 'RM',
  },
  {
    id: 'oxygen-cells',
    name: recipeMessages['oxygen-cells'].name,
    description: recipeMessages['oxygen-cells'].description,
    ingredients: [{ itemId: 'oxygen', amount: 20 }],
    outputId: 'oxygenCells',
    outputAmount: 1,
    tier: 1,
    unlockAtTotal: 20,
    icon: 'OC',
  },
  {
    id: 'mechanical-parts',
    name: recipeMessages['mechanical-parts'].name,
    description: recipeMessages['mechanical-parts'].description,
    ingredients: [
      { itemId: 'refinedMetal', amount: 3 },
      { itemId: 'condensedCarbon', amount: 2 },
    ],
    outputId: 'mechanicalParts',
    outputAmount: 1,
    tier: 2,
    unlockAtTotal: 120,
    icon: 'MP',
  },
  {
    id: 'basic-circuits',
    name: recipeMessages['basic-circuits'].name,
    description: recipeMessages['basic-circuits'].description,
    ingredients: [
      { itemId: 'oxygenCells', amount: 2 },
      { itemId: 'refinedMetal', amount: 2 },
    ],
    outputId: 'basicCircuits',
    outputAmount: 1,
    tier: 2,
    unlockAtTotal: 150,
    icon: 'BC',
  },
];
