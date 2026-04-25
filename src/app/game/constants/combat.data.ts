export const RAID_INTERVAL_BASE_MS = 3_600_000; // 1 hour
export const MAX_INVASION_FLEETS = 2;
export const INVASION_SPAWN_INTERVAL_MS = 12 * 60 * 1000; // 12 min base
export const INVASION_ATTACK_INTERVAL_BASE_MS = 6 * 60 * 1000; // 6 min for tier 1
export const INVASION_FLEET_NAMES = [
  'Marauder Strike Group',
  'Corsair Warband',
  'Void Raider Pack',
  'Hostile Battle Group',
  'Renegade Armada',
  'Scavenger Fleet',
  'Pirate Assault Force',
  'Dark Corsair Squadron',
];
export const RAID_STEAL_BASE_PERCENT = 0.08; // 8% per danger level
export const RAID_STEAL_MIN_PERCENT = 0.02; // 2% floor even with defense
export const RAID_JITTER_MIN = 0.75;
export const RAID_JITTER_MAX = 1.25;
export const MAX_OFFLINE_RAID_CYCLES = 3;
export const COMBAT_LOG_MAX_ENTRIES = 50;
export const COMBAT_UNLOCK_SCORE = 800;
export const DEFENSE_STEAL_REDUCTION_PER_POINT = 0.03;
export const INVASION_STRIKE_CASUALTY_RATE = 0.04;

// ── Faction Anger ─────────────────────────────────────────────────────────────
export const ANGER_PER_PLAYER_ATTACK = 20;
export const ANGER_PER_FLEET_STRIKE = 8;
export const ANGER_DECAY_PER_SECOND = 100 / 750; // fully decays in 12.5 min idle
export const ANGER_MAX = 100;
export const ANGER_ALERT_THRESHOLD = 30;
export const ANGER_ENRAGED_THRESHOLD = 60;

// ── Fleet Spawn Interval Multipliers ─────────────────────────────────────────
export const SPAWN_INTERVAL_ALERT_MULT = 0.75;
export const SPAWN_INTERVAL_ENRAGED_MULT = 0.5;

// ── Smart Targeting ───────────────────────────────────────────────────────────
export const RETALIATION_WINDOW_MS = 5 * 60_000;

// ── Garrison Attrition ────────────────────────────────────────────────────────
export const GARRISON_ATTRITION_MAX_RATE = 0.12;

// ── Threat Escalation per Planet ─────────────────────────────────────────────
export const THREAT_ESCALATION_RAIDS_REQUIRED = 4;
export const THREAT_DEESCALATION_RAIDS_REQUIRED = 6;
export const THREAT_LEVEL_MAX_ABOVE_TIER = 2;
export const THREAT_LEVEL_MIN = 1;

// ── Attack Casualty Scaling ───────────────────────────────────────────────────
export const ATTACK_CASUALTY_RATE_MIN = 0.005;
export const ATTACK_CASUALTY_RATE_MAX = 0.06;
export const ATTACK_OVERKILL_RATIO_THRESHOLD = 3.0;

// ── Loot Overkill ─────────────────────────────────────────────────────────────
export const LOOT_OVERKILL_MAX_MULT = 1.5;
