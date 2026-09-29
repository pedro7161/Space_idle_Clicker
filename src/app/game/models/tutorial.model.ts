export interface TutorialState {
  version: number;
  completedStepIds: string[];
  dismissed: boolean;
}

export type TutorialStepId =
  | 'tut_start_mine'
  | 'tut_mine_enough'
  | 'tut_open_upgrades'
  | 'tut_buy_first_upgrade'
  | 'tut_ships_intro'
  | 'tut_military_intro';
