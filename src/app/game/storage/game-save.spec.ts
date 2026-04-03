import type { GameState } from '../models';
import {
  buildDefaultGameState,
  CURRENT_SAVE_KEY,
  migrateLegacySaveKeys,
  SAVE_VERSION,
  type StorageLike,
} from './game-save';

function createLegacySave(progress: number): string {
  return JSON.stringify({
    version: SAVE_VERSION - 1,
    currentPlanetId: 'solara',
    discoveredPlanetIds: ['solara'],
    totalClicks: progress,
    totalMined: {
      carbon: progress,
    },
    inventory: {
      carbon: progress,
    },
    lastTickAt: progress,
  });
}

function createMemoryStorage(
  initialEntries: Record<string, string>,
  options: { failOnSet?: boolean } = {},
): StorageLike {
  const entries = new Map(Object.entries(initialEntries));

  return {
    get length() {
      return entries.size;
    },
    getItem(key: string) {
      return entries.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      if (options.failOnSet) {
        throw new Error('setItem failed');
      }

      entries.set(key, value);
    },
  };
}

describe('game save migration', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => localStorage.clear());

  it('should migrate the newest legacy save into the current key and remove old keys', () => {
    localStorage.setItem('space-idle-save-v1', createLegacySave(4));
    localStorage.setItem('space-idle-save-v2', createLegacySave(9));

    expect(migrateLegacySaveKeys(localStorage)).toBeTrue();

    const saved = JSON.parse(localStorage.getItem(CURRENT_SAVE_KEY)!) as GameState;
    expect(saved.version).toBe(SAVE_VERSION);
    expect(saved.totalClicks).toBe(9);
    expect(saved.planetInventories['solara']['carbon']).toBe(9);
    expect(localStorage.getItem('space-idle-save-v1')).toBeNull();
    expect(localStorage.getItem('space-idle-save-v2')).toBeNull();
  });

  it('should replace a default-like current save with legacy progress', () => {
    localStorage.setItem(CURRENT_SAVE_KEY, JSON.stringify(buildDefaultGameState()));
    localStorage.setItem('space-idle-save-v2', createLegacySave(12));

    expect(migrateLegacySaveKeys(localStorage)).toBeTrue();

    const saved = JSON.parse(localStorage.getItem(CURRENT_SAVE_KEY)!) as GameState;
    expect(saved.totalClicks).toBe(12);
    expect(saved.planetInventories['solara']['carbon']).toBe(12);
    expect(localStorage.getItem('space-idle-save-v2')).toBeNull();
  });

  it('should keep a more advanced current save when it already has more progress', () => {
    const current = buildDefaultGameState();
    current.totalClicks = 25;
    current.totalMined['carbon'] = 25;
    current.planetInventories['solara']['carbon'] = 25;

    localStorage.setItem(CURRENT_SAVE_KEY, JSON.stringify(current));
    localStorage.setItem('space-idle-save-v2', createLegacySave(6));

    expect(migrateLegacySaveKeys(localStorage)).toBeTrue();

    const saved = JSON.parse(localStorage.getItem(CURRENT_SAVE_KEY)!) as GameState;
    expect(saved.totalClicks).toBe(25);
    expect(saved.planetInventories['solara']['carbon']).toBe(25);
    expect(localStorage.getItem('space-idle-save-v2')).toBeNull();
  });

  it('should not delete the legacy save if writing the current save fails', () => {
    const storage = createMemoryStorage({
      'space-idle-save-v2': createLegacySave(8),
    }, {
      failOnSet: true,
    });

    expect(migrateLegacySaveKeys(storage)).toBeFalse();
    expect(storage.getItem(CURRENT_SAVE_KEY)).toBeNull();
    expect(storage.getItem('space-idle-save-v2')).not.toBeNull();
  });
});
