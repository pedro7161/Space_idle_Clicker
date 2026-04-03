export interface Tool {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  resourcesPerClick: number;
  level: number;
  maxLevel: number;
  costScaling: number;
  icon: string;
}
