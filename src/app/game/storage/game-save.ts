import {
  ALL_ITEM_IDS,
  PLANETS,
  RESOURCE_IDS,
  SHIPS,
  SPACE_STATION_BLUEPRINTS,
} from '../constants';
import type {
  ExpeditionMission,
  ExpeditionState,
  GameState,
  GeneratedPlanetSeed,
  ItemCost,
  ItemId,
  LogisticsLocation,
  LogisticsLocationKind,
  OwnedShip,
  ResourceId,
  ShipRoute,
  ShipStatus,
  ShipTransit,
} from '../models';
import { createPlanetLocation, isSameLogisticsLocation } from '../models';

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

export const SAVE_VERSION = 10;
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

function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && ALL_ITEM_IDS.includes(value as ItemId);
}

function isResourceId(value: unknown): value is ResourceId {
  return typeof value === 'string' && RESOURCE_IDS.includes(value as ResourceId);
}

function isLogisticsLocationKind(value: unknown): value is LogisticsLocationKind {
  return value === 'planet' || value === 'station';
}

function isShipStatus(value: unknown): value is ShipStatus {
  return value === 'idle' || value === 'outbound' || value === 'returning';
}

function normalizeNonNegativeNumber(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

function normalizeLocation(
  planetId: unknown,
  kind: unknown,
  knownPlanetIds: ReadonlySet<string>,
  stationPlanetIds: ReadonlySet<string>,
): LogisticsLocation | null {
  if (typeof planetId !== 'string' || !knownPlanetIds.has(planetId)) {
    return null;
  }

  const normalizedKind = isLogisticsLocationKind(kind) ? kind : 'planet';
  if (normalizedKind === 'station' && !stationPlanetIds.has(planetId)) {
    return null;
  }

  return {
    planetId,
    kind: normalizedKind,
  };
}

function normalizeTransit(
  value: unknown,
  knownPlanetIds: ReadonlySet<string>,
  stationPlanetIds: ReadonlySet<string>,
): ShipTransit | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const transit = value as Partial<ShipTransit>;
  const from = normalizeLocation(transit.fromPlanetId, transit.fromKind, knownPlanetIds, stationPlanetIds);
  const to = normalizeLocation(transit.toPlanetId, transit.toKind, knownPlanetIds, stationPlanetIds);
  const departAt = normalizeNonNegativeNumber(transit.departAt);
  const arriveAt = normalizeNonNegativeNumber(transit.arriveAt);

  if (!from || !to || isSameLogisticsLocation(from, to) || arriveAt < departAt) {
    return null;
  }

  return {
    fromPlanetId: from.planetId,
    fromKind: from.kind,
    toPlanetId: to.planetId,
    toKind: to.kind,
    departAt,
    arriveAt,
  };
}

function buildKnownPlanetIds(generatedPlanets: GeneratedPlanetSeed[]): string[] {
  return [
    ...PLANETS.map(planet => planet.id),
    ...generatedPlanets.map(planet => planet.id),
  ];
}

function normalizeGeneratedPlanets(value: unknown): GeneratedPlanetSeed[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set(PLANETS.map(planet => planet.id));

  return value.flatMap(entry => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const generatedPlanet = entry as Partial<GeneratedPlanetSeed>;
    if (
      typeof generatedPlanet.id !== 'string'
      || seenIds.has(generatedPlanet.id)
      || !isResourceId(generatedPlanet.primaryResourceId)
    ) {
      return [];
    }

    const sequence = Math.max(1, Math.floor(normalizeNonNegativeNumber(generatedPlanet.sequence)));
    const orbitIndex = Math.max(PLANETS.length, Math.floor(normalizeNonNegativeNumber(generatedPlanet.orbitIndex)));
    const orbitPosition = Math.max(1, Math.floor(normalizeNonNegativeNumber(generatedPlanet.orbitPosition)));
    const supportResourceIds = Array.isArray(generatedPlanet.supportResourceIds)
      ? generatedPlanet.supportResourceIds.filter(isResourceId)
      : [];
    const normalizedSupport = Array.from(new Set(supportResourceIds))
      .filter(resourceId => resourceId !== generatedPlanet.primaryResourceId)
      .slice(0, 2);

    seenIds.add(generatedPlanet.id);
    return [{
      id: generatedPlanet.id,
      sequence,
      primaryResourceId: generatedPlanet.primaryResourceId,
      supportResourceIds: normalizedSupport,
      orbitIndex,
      orbitPosition,
    }];
  });
}

function normalizeItemCosts(value: unknown): ItemCost[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(entry => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const cost = entry as Partial<ItemCost>;
    if (!isItemId(cost.itemId)) {
      return [];
    }

    const amount = Math.max(1, Math.floor(normalizeNonNegativeNumber(cost.amount)));
    return [{ itemId: cost.itemId, amount }];
  });
}

function normalizeExpeditionMission(value: unknown): ExpeditionMission | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const mission = value as Partial<ExpeditionMission>;
  const targetSequence = Math.max(1, Math.floor(normalizeNonNegativeNumber(mission.targetSequence)));
  const departAt = normalizeNonNegativeNumber(mission.departAt);
  const arriveAt = normalizeNonNegativeNumber(mission.arriveAt);
  const fuelRequired = Math.max(1, Math.floor(normalizeNonNegativeNumber(mission.fuelRequired)));

  if (arriveAt < departAt) {
    return null;
  }

  return {
    targetSequence,
    departAt,
    arriveAt,
    fuelRequired,
    launchCost: normalizeItemCosts(mission.launchCost),
  };
}

function normalizeExpeditionState(value: unknown): ExpeditionState {
  if (!value || typeof value !== 'object') {
    return {
      shipBuilt: false,
      engineLevel: 0,
      fuelLevel: 0,
      expeditionsCompleted: 0,
      activeMission: null,
    };
  }

  const expedition = value as Partial<ExpeditionState>;
  return {
    shipBuilt: !!expedition.shipBuilt,
    engineLevel: Math.floor(normalizeNonNegativeNumber(expedition.engineLevel)),
    fuelLevel: Math.floor(normalizeNonNegativeNumber(expedition.fuelLevel)),
    expeditionsCompleted: Math.floor(normalizeNonNegativeNumber(expedition.expeditionsCompleted)),
    activeMission: normalizeExpeditionMission(expedition.activeMission),
  };
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
      currentLocationKind: 'planet',
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
    + (state.generatedPlanets.length * 900)
    + (state.ships.length * 500)
    + (state.shipRoutes.length * 250)
    + (state.spaceStations.length * 750)
    + (state.expedition.expeditionsCompleted * 1_200)
    + (state.expedition.engineLevel * 250)
    + (state.expedition.fuelLevel * 250)
    + (state.expedition.shipBuilt ? 1_500 : 0);
}

function isDefaultLikeState(state: GameState): boolean {
  return state.totalClicks === 0
    && RESOURCE_IDS.every(resourceId => (state.totalMined[resourceId] ?? 0) === 0)
    && state.builtShipPartIds.length === 0
    && state.generatedPlanets.length === 0
    && state.ships.length === 0
    && state.shipRoutes.length === 0
    && state.spaceStations.length === 0
    && !state.expedition.shipBuilt
    && state.expedition.engineLevel === 0
    && state.expedition.fuelLevel === 0
    && state.expedition.expeditionsCompleted === 0
    && !state.expedition.activeMission;
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
    ) as Record<string, Record<ItemId, number>>,
    stationInventories: buildPlanetItemMatrix(
      PLANETS.map(planet => planet.id),
      ALL_ITEM_IDS,
    ) as Record<string, Record<ItemId, number>>,
    generatedPlanets: [],
    expedition: {
      shipBuilt: false,
      engineLevel: 0,
      fuelLevel: 0,
      expeditionsCompleted: 0,
      activeMission: null,
    },
    activeResourceId: 'carbon',
    upgradeLevels: {},
    autoMinerCounts: {},
    builtShipPartIds: [],
    discoveredPlanetIds: [startingPlanet.id],
    totalClicks: 0,
    totalMined: buildNumberRecord(RESOURCE_IDS) as Record<ResourceId, number>,
    currentPlanetId: startingPlanet.id,
    shipLaunched: false,
    ships: [],
    shipRoutes: [],
    spaceStations: [],
    nextShipId: 1,
    nextShipRouteId: 1,
    lastTickAt: Date.now(),
    planetThreats: {},
    combatLog: [],
    combatUnlocked: false,
    deployedGarrisons: [],
    militaryUnlocked: false,
    unitsInTransit: [],
    activeAttacks: [],
    discoveredEnemySystemIds: [],
    offensiveUnlocked: false,
    invasionFleets: [],
    nextInvasionAt: 0,
    attackCooldowns: {},
    militaryBuildingLevels: {},
  };
}

export function mergeSavedStateWithDefaults(saved: LegacySavedState): GameState {
  const defaults = buildDefaultGameState();
  const generatedPlanets = normalizeGeneratedPlanets(saved.generatedPlanets);
  const knownPlanetIds = buildKnownPlanetIds(generatedPlanets);
  const knownPlanetIdSet = new Set(knownPlanetIds);
  const currentPlanetId =
    saved.currentPlanetId && knownPlanetIdSet.has(saved.currentPlanetId)
      ? saved.currentPlanetId
      : defaults.currentPlanetId;

  const planetInventories = buildPlanetItemMatrix(
    knownPlanetIds,
    ALL_ITEM_IDS,
  ) as Record<string, Record<ItemId, number>>;

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

  const seenStationPlanets = new Set<string>();
  const spaceStations = (saved.spaceStations ?? []).flatMap(station => {
    if (
      !knownPlanetIdSet.has(station.planetId)
      || !getSpaceStationBlueprint(station.blueprintId)
      || seenStationPlanets.has(station.planetId)
    ) {
      return [];
    }

    seenStationPlanets.add(station.planetId);
    return [{
      planetId: station.planetId,
      blueprintId: station.blueprintId,
    }];
  });
  const stationPlanetIds = new Set(spaceStations.map(station => station.planetId));
  const stationInventories = buildPlanetItemMatrix(
    knownPlanetIds,
    ALL_ITEM_IDS,
  ) as Record<string, Record<ItemId, number>>;

  Object.entries(saved.stationInventories ?? {}).forEach(([planetId, inventory]) => {
    if (!stationPlanetIds.has(planetId) || !stationInventories[planetId]) {
      return;
    }

    stationInventories[planetId] = {
      ...stationInventories[planetId],
      ...inventory,
    };
  });

  const routes = (saved.shipRoutes ?? []).flatMap(route => {
    const origin = normalizeLocation(route.originPlanetId, route.originKind, knownPlanetIdSet, stationPlanetIds);
    const destination = normalizeLocation(
      route.destinationPlanetId,
      route.destinationKind,
      knownPlanetIdSet,
      stationPlanetIds,
    );

    if (
      !origin
      || !destination
      || isSameLogisticsLocation(origin, destination)
      || typeof route.id !== 'string'
      || typeof route.shipId !== 'string'
      || !isItemId(route.itemId)
    ) {
      return [];
    }

    const normalizedRoute: ShipRoute = {
      id: route.id,
      shipId: route.shipId,
      originPlanetId: origin.planetId,
      originKind: origin.kind,
      destinationPlanetId: destination.planetId,
      destinationKind: destination.kind,
      itemId: route.itemId,
      keepMinimum: Math.max(0, Math.floor(normalizeNonNegativeNumber(route.keepMinimum))),
      enabled: route.enabled ?? true,
    };

    return [normalizedRoute];
  });

  const routeIds = new Set(routes.map(route => route.id));
  const ships = (saved.ships ?? []).flatMap(ship => {
    if (!getShipDefinition(ship.definitionId) || typeof ship.id !== 'string') {
      return [];
    }

    const transit = normalizeTransit(ship.transit, knownPlanetIdSet, stationPlanetIds);
    const dockedLocation = normalizeLocation(
      ship.currentPlanetId,
      ship.currentLocationKind,
      knownPlanetIdSet,
      stationPlanetIds,
    ) ?? createPlanetLocation(currentPlanetId);
    const cargoItemId = isItemId(ship.cargo?.itemId) ? ship.cargo.itemId : null;
    const cargoAmount = cargoItemId ? normalizeNonNegativeNumber(ship.cargo?.amount) : 0;

    const normalizedShip: OwnedShip = {
      id: ship.id,
      definitionId: ship.definitionId,
      routeId: ship.routeId && routeIds.has(ship.routeId) ? ship.routeId : null,
      status: isShipStatus(ship.status) ? ship.status : 'idle',
      currentPlanetId: transit ? null : dockedLocation.planetId,
      currentLocationKind: transit ? null : dockedLocation.kind,
      cargo: {
        itemId: cargoItemId,
        amount: cargoAmount,
      },
      transit,
    };

    return [normalizedShip];
  });

  const discoveredPlanetIds = Array.from(new Set(
    (
      saved.discoveredPlanetIds && saved.discoveredPlanetIds.length > 0
        ? saved.discoveredPlanetIds
        : defaults.discoveredPlanetIds
    ).filter(planetId => knownPlanetIdSet.has(planetId)),
  ));
  generatedPlanets.forEach(planet => {
    if (!discoveredPlanetIds.includes(planet.id)) {
      discoveredPlanetIds.push(planet.id);
    }
  });
  if (!discoveredPlanetIds.includes(defaults.currentPlanetId)) {
    discoveredPlanetIds.unshift(defaults.currentPlanetId);
  }

  const expedition = normalizeExpeditionState(saved.expedition);
  const expeditionsCompleted = Math.max(expedition.expeditionsCompleted, generatedPlanets.length);
  const activeMission = expedition.activeMission && expedition.activeMission.targetSequence > expeditionsCompleted
    ? expedition.activeMission
    : null;

  const merged: GameState = {
    ...defaults,
    ...saved,
    version: SAVE_VERSION,
    planetInventories,
    stationInventories,
    generatedPlanets,
    expedition: {
      ...defaults.expedition,
      ...expedition,
      expeditionsCompleted,
      activeMission,
    },
    totalMined: {
      ...defaults.totalMined,
      ...(saved.totalMined ?? {}),
    } as Record<ResourceId, number>,
    upgradeLevels: saved.upgradeLevels ?? defaults.upgradeLevels,
    autoMinerCounts: saved.autoMinerCounts ?? defaults.autoMinerCounts,
    builtShipPartIds: saved.builtShipPartIds ?? defaults.builtShipPartIds,
    discoveredPlanetIds,
    currentPlanetId,
    ships,
    shipRoutes: routes,
    spaceStations,
    nextShipId: saved.nextShipId ?? Math.max(ships.length + 1, defaults.nextShipId),
    nextShipRouteId: saved.nextShipRouteId ?? Math.max(routes.length + 1, defaults.nextShipRouteId),
    lastTickAt: saved.lastTickAt ?? defaults.lastTickAt,
    planetThreats: saved.planetThreats ?? defaults.planetThreats,
    combatLog: saved.combatLog ?? defaults.combatLog,
    combatUnlocked: saved.combatUnlocked ?? defaults.combatUnlocked,
    deployedGarrisons: saved.deployedGarrisons ?? defaults.deployedGarrisons,
    militaryUnlocked: saved.militaryUnlocked ?? defaults.militaryUnlocked,
    unitsInTransit: (saved.unitsInTransit ?? defaults.unitsInTransit).filter(transit => transit.arriveAt > Date.now()),
    activeAttacks: (saved.activeAttacks ?? defaults.activeAttacks).filter(attack => attack.arriveAt > Date.now()),
    discoveredEnemySystemIds: saved.discoveredEnemySystemIds ?? defaults.discoveredEnemySystemIds,
    offensiveUnlocked: saved.offensiveUnlocked ?? defaults.offensiveUnlocked,
    invasionFleets: saved.invasionFleets ?? defaults.invasionFleets,
    nextInvasionAt: saved.nextInvasionAt ?? defaults.nextInvasionAt,
    attackCooldowns: saved.attackCooldowns ?? defaults.attackCooldowns,
    militaryBuildingLevels: saved.militaryBuildingLevels ?? defaults.militaryBuildingLevels,
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
