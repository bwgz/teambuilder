/**
 * @fileoverview Unit tests for TeamConfig factory, Mode enum, and MESSAGES constants.
 *
 * Covers:
 *   - Mode values are the expected strings
 *   - Mode object is frozen (no accidental mutation)
 *   - MAX_TEAMS_ABSOLUTE equals 100
 *   - MESSAGES contains all required keys with correct wording
 *   - createTeamConfig stores all provided fields
 *   - createTeamConfig returns a frozen object
 */

import { describe, it, expect } from 'vitest';
import {
  Mode,
  MAX_TEAMS_ABSOLUTE,
  MESSAGES,
  createTeamConfig,
} from '../../src/TeamConfig.js';

// ── Mode ──────────────────────────────────────────────────────────────────────

describe('Mode', () => {
  it('Mode.RANDOM equals the string "RANDOM"', () => {
    expect(Mode.RANDOM).toBe('RANDOM');
  });

  it('Mode.FAIR equals the string "FAIR"', () => {
    expect(Mode.FAIR).toBe('FAIR');
  });

  it('Mode object is frozen', () => {
    expect(Object.isFrozen(Mode)).toBe(true);
  });
});

// ── MAX_TEAMS_ABSOLUTE ────────────────────────────────────────────────────────

describe('MAX_TEAMS_ABSOLUTE', () => {
  it('equals 100', () => {
    expect(MAX_TEAMS_ABSOLUTE).toBe(100);
  });
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────

describe('MESSAGES', () => {
  it('contains the MIN_GREATER_THAN_MAX message', () => {
    expect(MESSAGES.MIN_GREATER_THAN_MAX).toBe(
      'Minimum size cannot be greater than maximum size',
    );
  });

  it('contains the IDEAL_OUT_OF_RANGE message', () => {
    expect(MESSAGES.IDEAL_OUT_OF_RANGE).toBe(
      'Ideal size must be between minimum and maximum size',
    );
  });

  it('contains the NO_PARTICIPANTS message', () => {
    expect(MESSAGES.NO_PARTICIPANTS).toBe('No participants provided');
  });

  it('contains the NOT_ENOUGH message', () => {
    expect(MESSAGES.NOT_ENOUGH).toBe(
      'Not enough participants to form a single team',
    );
  });

  it('contains the SUCCESS message', () => {
    expect(MESSAGES.SUCCESS).toBe('Teams formed successfully');
  });

  it('contains the SUCCESS_WITH_UNPLACED message', () => {
    expect(MESSAGES.SUCCESS_WITH_UNPLACED).toBe(
      'Teams formed with unplaced participants',
    );
  });

  it('MESSAGES object is frozen', () => {
    expect(Object.isFrozen(MESSAGES)).toBe(true);
  });
});

// ── createTeamConfig ──────────────────────────────────────────────────────────

describe('createTeamConfig', () => {
  it('stores all provided fields correctly', () => {
    const cfg = createTeamConfig({
      idealSize: 4,
      minSize:   3,
      maxSize:   5,
      maxTeams:  10,
      mode:      Mode.FAIR,
    });
    expect(cfg.idealSize).toBe(4);
    expect(cfg.minSize).toBe(3);
    expect(cfg.maxSize).toBe(5);
    expect(cfg.maxTeams).toBe(10);
    expect(cfg.mode).toBe(Mode.FAIR);
  });

  it('returns a frozen object', () => {
    const cfg = createTeamConfig({
      idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.RANDOM,
    });
    expect(Object.isFrozen(cfg)).toBe(true);
    expect(() => { cfg.idealSize = 99; }).toThrow(TypeError);
  });

  it('stores Mode.RANDOM without modification', () => {
    const cfg = createTeamConfig({
      idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 5, mode: Mode.RANDOM,
    });
    expect(cfg.mode).toBe(Mode.RANDOM);
  });
});
