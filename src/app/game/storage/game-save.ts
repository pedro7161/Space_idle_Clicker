import {
  ALL_ITEM_IDS,
  PLANETS,
  RESOURCE_IDS,
  SHIPS,
  SPACE_STATION_BLUEPRINTS,
} from '../constants';
import type {
  GameState,
  ItemId,
  OwnedShip,
} from '../models';

export type LegacySavedState = Partial<GameState> & {
  inventory?: Record<ItemId, number>;
};

export interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export const SAVE_VERSION = 3;
export const SAVE_KEY_PREFIX = 'space-idle-save-v';
export const CURRENT_SAVE_KEY = `${SAVE_KEY_PREFIX}${SAVE_VERSION}`;
export const SAVE_TRANSFER_PREFIX = 'frontier-miner-save:';

function buildNumberRecord<T extends string>(ids: readonly T[]): Record<T, number> {
  return ids.reduce(
    (record, id) => {
      record[id] = 0;
      return record;
    },
    {} as Record<T, number>,
  );
}

function buildPlanetItemMatrix<T extends string>(
  planetIds: readonly string[],
  itemIds: readonly T[],
): Record<string, Record<T, number>> {
  return planetIds.reduce<Record<string, Record<T, number>>>((matrix, planetId) => {
    matrix[planetId] = buildNumberRecord(itemIds);
    return matrix;
  }, {});
}

function getPlanet(planetId: string) {
  return PLANETS.find(planet => planet.id === planetId);
}

function getShipDefinition(definitionId: string) {
  return SHIPS.find(ship => ship.id === definitionId);
}

function getSpaceStationBlueprint(blueprintId: string) {
  return SPACE_STATION_BLUEPRINTS.find(blueprint => blueprint.id === blueprintId);
}

function createShipInstance(
  definitionId: string,
  planetId: string,
  nextShipId: number,
): { ship: OwnedShip; nextShipId: number } {
  return {
    ship: {
      id: `ship-${nextShipId}`,
      definitionId,
      routeId: null,
      status: 'idle',
      currentPlanetId: planetId,
      cargo: { itemId: null, amount: 0 },
      transit: null,
    },
    nextShipId: nextShipId + 1,
  };
}

function getSaveVersionFromKey(key: string): number | null {
  if (!key.startsWith(SAVE_KEY_PREFIX)) {
    return null;
  }

  const version = Number.parseInt(key.slice(SAVE_KEY_PREFIX.length), 10);
  return Number.isFinite(version) ? version : null;
}

function parseSave(raw: string): LegacySavedState | null {
  try {
    return JSON.parse(raw) as LegacySavedState;
  } catch {
    return null;
  }
}

function getProgressScore(state: GameState): number {
  const minedScore = RESOURCE_IDS.reduce((total, resourceId) => total + (state.totalMined[resourceId] ?? 0), 0);
  return minedScore
    + state.totalClicks
    + (state.builtShipPartIds.length * 100)
    + (state.discoveredPlanetIds.length * 250)
    + (state.ships.length * 500)
    + (state.shipRoutes.length * 250)
    + (state.spaceStations.length * 750);
}

function isDefaultLikeState(state: GameState): boolean {
  return state.totalClicks === 0
    && RESOURCE_IDS.every(resourceId => (state.totalMined[resourceId] ?? 0) === 0)
    && state.builtShipPartIds.length === 0
    && state.ships.length === 0
    && state.shipRoutes.length === 0
    && state.spaceStations.length === 0;
}

function shouldPreferLegacySave(legacyState: GameState, currentState: GameState | null): boolean {
  if (!currentState) {
    return true;
  }

  if (isDefaultLikeState(currentState) && !isDefaultLikeState(legacyState)) {
    return true;
  }

  const legacyProgress = getProgressScore(legacyState);
  const currentProgress = getProgressScore(currentState);
  if (legacyProgress !== currentProgress) {
    return legacyProgress > currentProgress;
  }

  return legacyState.lastTickAt > currentState.lastTickAt;
}

export function buildDefaultGameState(): GameState {
  const startingPlanet = PLANETS.find(planet => planet.unlockedByDefault) ?? PLANETS[0];

  return {
    version: SAVE_VERSION,
    planetInventories: buildPlanetItemMatrix(
      PLANETS.map(planet => planet.id),
      ALL_ITEM_IDS,
    ),
    activeResourceId: 'carbon',
    upgradeLevels: {},
    autoMinerCounts: {},
    builtShipPartIds: [],
    discoveredPlanetIds: [startingPlanet.id],
    totalClicks: 0,
    totalMined: buildNumberRecord(RESOURCE_IDS),
    currentPlanetId: startingPlanet.id,
    shipLaunched: false,
    ships: [],
    shipRoutes: [],
    spaceStations: [],
    nextShipId: 1,
    nextShipRouteId: 1,
    lastTickAt: Date.now(),
  };
}

export function mergeSavedStateWithDefaults(saved: LegacySavedState): GameState {
  const defaults = buildDefaultGameState();
  const currentPlanetId =
    saved.currentPlanetId && getPlanet(saved.currentPlanetId)
      ? saved.currentPlanetId
      : defaults.currentPlanetId;

  const planetInventories = buildPlanetItemMatrix(
    PLANETS.map(planet => planet.id),
    ALL_ITEM_IDS,
  );

  Object.entries(saved.planetInventories ?? {}).forEach(([planetId, inventory]) => {
    if (!planetInventories[planetId]) {
      return;
    }

    planetInventories[planetId] = {
      ...planetInventories[planetId],
      ...inventory,
    };
  });

  if (saved.inventory) {
    planetInventories[currentPlanetId] = {
      ...planetInventories[currentPlanetId],
      ...saved.inventory,
    };
  }

  const routes = (saved.shipRoutes ?? []).filter(route => {
    return !!getPlanet(route.originPlanetId)
      && !!getPlanet(route.destinationPlanetId)
      && route.originPlanetId !== route.destinationPlanetId;
  }).map(route => ({
    ...route,
    keepMinimum: Math.max(0, Math.floor(route.keepMinimum ?? 0)),
    enabled: route.enabled ?? true,
  }));

  const routeIds = new Set(routes.map(route => route.id));
  const spaceStations = (saved.spaceStations ?? []).filter(station => {
    return !!getPlanet(station.planetId)
      && !!getSpaceStationBlueprint(station.blueprintId);
  }).map(station => ({
    planetId: station.planetId,
    blueprintId: station.blueprintId,
  }));
  const ships = (saved.ships ?? []).filter(ship => !!getShipDefinition(ship.definitionId)).map(ship => ({
    id: ship.id,
    definitionId: ship.definitionId,
    routeId: ship.routeId && routeIds.has(ship.routeId) ? ship.routeId : null,
    status: ship.status ?? 'idle',
    currentPlanetId: ship.currentPlanetId && getPlanet(ship.currentPlanetId) ? ship.currentPlanetId : currentPlanetId,
    cargo: {
      itemId: ship.cargo?.itemId ?? null,
      amount: ship.cargo?.amount ?? 0,
    },
    transit: ship.transit && getPlanet(ship.transit.fromPlanetId) && getPlanet(ship.transit.toPlanetId)
      ? { ...ship.transit }
      : null,
  }));

  const merged: GameState = {
    ...defaults,
    ...saved,
    version: SAVE_VERSION,
    planetInventories,
    totalMined: {
      ...defaults.totalMined,
      ...(saved.totalMined ?? {}),
    },
    upgradeLevels: saved.upgradeLevels ?? defaults.upgradeLevels,
    autoMinerCounts: saved.autoMinerCounts ?? defaults.autoMinerCounts,
    builtShipPartIds: saved.builtShipPartIds ?? defaults.builtShipPartIds,
    discoveredPlanetIds:
      saved.discoveredPlanetIds && saved.discoveredPlanetIds.length > 0
        ? saved.discoveredPlanetIds
        : defaults.discoveredPlanetIds,
    currentPlanetId,
    ships,
    shipRoutes: routes,
    spaceStations,
    nextShipId: saved.nextShipId ?? Math.max(ships.length + 1, defaults.nextShipId),
    nextShipRouteId: saved.nextShipRouteId ?? Math.max(routes.length + 1, defaults.nextShipRouteId),
    lastTickAt: saved.lastTickAt ?? defaults.lastTickAt,
  };

  if (merged.shipLaunched && merged.ships.length === 0) {
    const starterShip = createShipInstance('shuttle', merged.currentPlanetId, merged.nextShipId);
    merged.ships = [starterShip.ship];
    merged.nextShipId = starterShip.nextShipId;
  }

  return merged;
}

export function migrateLegacySaveKeys(
  storage: StorageLike = window.localStorage,
): boolean {
  const legacyKeys: Array<{ key: string; version: number }> = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) {
      continue;
    }

    const version = getSaveVersionFromKey(key);
    if (version === null || version >= SAVE_VERSION) {
      continue;
    }

    legacyKeys.push({ key, version });
  }

  legacyKeys.sort((left, right) => right.version - left.version);
  if (legacyKeys.length === 0) {
    return false;
  }

  const currentRaw = storage.getItem(CURRENT_SAVE_KEY);
  const currentSaved = currentRaw ? parseSave(currentRaw) : null;
  const currentState = currentSaved ? mergeSavedStateWithDefaults(currentSaved) : null;

  for (const legacyEntry of legacyKeys) {
    const raw = storage.getItem(legacyEntry.key);
    if (!raw) {
      continue;
    }

    const saved = parseSave(raw);
    if (!saved) {
      continue;
    }

    const legacyState = mergeSavedStateWithDefaults(saved);
    const nextState = shouldPreferLegacySave(legacyState, currentState)
      ? legacyState
      : currentState;

    if (!nextState) {
      continue;
    }

    try {
      storage.setItem(CURRENT_SAVE_KEY, JSON.stringify(nextState));
      legacyKeys.forEach(entry => storage.removeItem(entry.key));
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
