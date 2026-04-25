import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameService } from './game.service';
import type { GameState, ResourceUpgrade, TutorialStepId } from '../models';

export interface TutorialStep {
  id: TutorialStepId;
  anchorId: string;
  title: string;
  body: string;
  requiresAck: boolean;
  showWhen: (state: GameState) => boolean;
  completeWhen: (state: GameState) => boolean;
}

const TUTORIAL_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class TutorialService {
  readonly activeStep$ = new BehaviorSubject<TutorialStep | null>(null);

  private shipsWorkspaceOpened = false;
  private readonly steps: TutorialStep[];

  constructor(private game: GameService) {
    this.steps = this.buildSteps();

    this.game.state$.subscribe(state => {
      this.reconcile(state);
    });
  }

  next(): void {
    const step = this.activeStep$.value;
    if (!step) return;
    this.completeStep(step.id);
    this.reconcile(this.game.getState());
  }

  skip(): void {
    this.game.dismissTutorial(true);
    this.activeStep$.next(null);
  }

  restart(): void {
    this.shipsWorkspaceOpened = false;
    this.game.restartTutorial();
    this.reconcile(this.game.getState());
  }

  disable(): void {
    this.game.dismissTutorial(true);
    this.activeStep$.next(null);
  }

  notifyShipsWorkspaceOpened(): void {
    this.shipsWorkspaceOpened = true;
    this.reconcile(this.game.getState());
  }

  private reconcile(state: GameState): void {
    if (!state.tutorial || state.tutorial.version !== TUTORIAL_VERSION) {
      return;
    }

    if (state.tutorial.dismissed) {
      this.activeStep$.next(null);
      return;
    }

    const current = this.activeStep$.value;
    if (current && !this.isStepCompleted(state, current.id) && current.completeWhen(state)) {
      this.completeStep(current.id);
    }

    const next = this.steps.find(step => !this.isStepCompleted(state, step.id) && step.showWhen(state)) ?? null;
    this.activeStep$.next(next);
  }

  private completeStep(stepId: TutorialStepId): void {
    this.game.completeTutorialStep(stepId);
  }

  private isStepCompleted(state: GameState, stepId: TutorialStepId): boolean {
    return state.tutorial.completedStepIds.includes(stepId);
  }

  private buildSteps(): TutorialStep[] {
    return [
      {
        id: 'tut_start_mine',
        anchorId: 'mine-area',
        title: 'Mine your first resource',
        body: 'Click planet surface to mine your active resource.',
        requiresAck: false,
        showWhen: state => state.totalClicks === 0,
        completeWhen: state => state.totalClicks >= 1,
      },
      {
        id: 'tut_mine_enough',
        anchorId: 'mine-area',
        title: 'Keep mining',
        body: 'Mine until you can afford your first upgrade. Watch the Upgrades tab for when costs turn affordable.',
        requiresAck: false,
        showWhen: state =>
          state.totalClicks >= 1
          && !this.canAffordAnyUpgradeOnPlanet(state)
          && Object.keys(state.upgradeLevels).length === 0,
        completeWhen: state => this.canAffordAnyUpgradeOnPlanet(state),
      },
      {
        id: 'tut_open_upgrades',
        anchorId: 'tab-upgrades',
        title: 'Open upgrades',
        body: 'You can now afford an upgrade! Tap the Upgrades tab at the top of the screen, then press Next.',
        requiresAck: true,
        showWhen: state =>
          this.canAffordAnyUpgradeOnPlanet(state)
          && Object.keys(state.upgradeLevels).length === 0,
        completeWhen: () => false,
      },
      {
        id: 'tut_buy_first_upgrade',
        anchorId: 'upgrade-buy',
        title: 'Buy your first upgrade',
        body: 'Buy any upgrade for your current planet.',
        requiresAck: false,
        showWhen: state => state.totalClicks >= 1 && this.hasVisibleUpgradeForCurrentPlanet(state),
        completeWhen: state => this.hasBoughtAnyUpgradeOnPlanet(state.currentPlanetId, state),
      },
      {
        id: 'tut_ships_intro',
        anchorId: 'ships-toggle',
        title: 'Ships unlocked',
        body: 'Ships let you travel and automate routes. Open the Ships workspace to continue.',
        requiresAck: false,
        showWhen: state => state.ships.length > 0,
        completeWhen: () => this.shipsWorkspaceOpened,
      },
      {
        id: 'tut_military_intro',
        anchorId: 'tab-military',
        title: 'Military unlocked',
        body: 'Defend planets by deploying units to garrisons. Deploy a unit to continue.',
        requiresAck: false,
        showWhen: state => state.combatUnlocked,
        completeWhen: state =>
          state.deployedGarrisons.length > 0
          || state.unitsInTransit.some(transit => transit.kind === 'deploy'),
      },
    ];
  }

  private hasBoughtAnyUpgradeOnPlanet(planetId: string, state: GameState): boolean {
    const prefix = `${planetId}:`;
    return Object.entries(state.upgradeLevels).some(([key, level]) => key.startsWith(prefix) && level > 0);
  }

  private hasVisibleUpgradeForCurrentPlanet(state: GameState): boolean {
    const planetId = state.currentPlanetId;
    const planetUpgrades = this.game.upgrades.filter((upgrade: ResourceUpgrade) => {
      return this.game.isUpgradeVisible(upgrade)
        && this.game.isResourceAvailableOnPlanet(planetId, upgrade.resourceId);
    });
    return planetUpgrades.length > 0;
  }

  private canAffordAnyUpgradeOnPlanet(state: GameState): boolean {
    const planetId = state.currentPlanetId;
    return this.game.upgrades.some((upgrade: ResourceUpgrade) => {
      if (!this.game.isUpgradeVisible(upgrade)) return false;
      if (!this.game.isResourceAvailableOnPlanet(planetId, upgrade.resourceId)) return false;
      const cost = this.game.getUpgradeCost(upgrade, planetId);
      return this.game.canAfford(cost, planetId);
    });
  }
}
