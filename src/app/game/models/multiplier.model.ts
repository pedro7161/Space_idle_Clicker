export type MultiplierType = 'click' | 'auto' | 'global';

export interface Multiplier {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  effect: number;
  type: MultiplierType;
  purchased: boolean;
  icon: string;
  unlockCost: number;
}
