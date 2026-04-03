export interface Automation {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  resourcesPerSecond: number;
  count: number;
  costScaling: number;
  icon: string;
  unlockCost: number;
}
