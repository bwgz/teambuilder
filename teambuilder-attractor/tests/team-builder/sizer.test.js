/**
 * @fileoverview Tests for the slot-sizing algorithm (Algorithm A), exercised
 * via TeamBuilder.buildTeams so we can inspect the resulting team counts and
 * sizes without exposing the private `computeSlotSizes` helper.
 *
 * Each scenario verifies:
 *   - The correct number of teams is produced
 *   - Every team satisfies minSize ≤ size ≤ maxSize
 *   - The sum of all team sizes plus unplaced equals the total participant count
 *   - Hard-cap behaviour at MAX_TEAMS_ABSOLUTE = 100
 */

import { describe, it, expect } from 'vitest';
import { TeamBuilder } from '../../src/TeamBuilder.js';
import { Mode, MESSAGES } from '../../src/TeamConfig.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const builder = new TeamBuilder();

const participants = (n) =>
  Array.from({ length: n }, (_, i) =>
    createParticipant(`p${i}`, `Person${i}`, i),
  );

const cfg = (overrides) => ({
  idealSize: 4,
  minSize:   3,
  maxSize:   5,
  maxTeams:  50,
  mode:      Mode.RANDOM,
  ...overrides,
});

/** Checks that every team in `result` satisfies the size bounds. */
function expectValidSizes(result, min, max) {
  for (const team of result.teams) {
    const size = team.getMemberCount();
    expect(size).toBeGreaterThanOrEqual(min);
    expect(size).toBeLessThanOrEqual(max);
  }
}

/** Checks conservation: placed + unplaced === totalParticipants */
function expectConservation(result, total) {
  const placed = result.teams.reduce((s, t) => s + t.getMemberCount(), 0);
  expect(placed + result.unplaced.length).toBe(total);
}

// ── Even splits ───────────────────────────────────────────────────────────────

describe('Algorithm A — even split', () => {
  it('12 participants, ideal=4 → 3 teams of 4, 0 unplaced', () => {
    const r = builder.buildTeams(
      participants(12),
      cfg({ idealSize: 4, minSize: 4, maxSize: 4, maxTeams: 10 }),
    );
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(3);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => expect(t.getMemberCount()).toBe(4));
  });

  it('9 participants, ideal=3 → 3 teams of 3, 0 unplaced', () => {
    const r = builder.buildTeams(
      participants(9),
      cfg({ idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10 }),
    );
    expect(r.teams).toHaveLength(3);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => expect(t.getMemberCount()).toBe(3));
  });
});

// ── Uneven splits absorbed by growing teams ───────────────────────────────────

describe('Algorithm A — uneven split (growth absorption)', () => {
  it('14 participants, ideal=4, max=5 → 3 teams, 0 unplaced, sizes in [4,5]', () => {
    // floor(14/4)=3 teams; 14-3*4=2 remainder → 2 teams get 5, 1 gets 4
    const r = builder.buildTeams(
      participants(14),
      cfg({ idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10 }),
    );
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(3);
    expect(r.unplaced).toHaveLength(0);
    expectValidSizes(r, 3, 5);
    expectConservation(r, 14);
  });

  it('10 participants, ideal=3, min=2, max=4 → all placed, sizes in [2,4]', () => {
    const r = builder.buildTeams(
      participants(10),
      cfg({ idealSize: 3, minSize: 2, maxSize: 4, maxTeams: 10 }),
    );
    expect(r.success).toBe(true);
    expect(r.unplaced).toHaveLength(0);
    expectValidSizes(r, 2, 4);
    expectConservation(r, 10);
  });
});

// ── Extra team needed ─────────────────────────────────────────────────────────

describe('Algorithm A — extra team needed', () => {
  it('13 participants, ideal=4, min=3, max=4 → 4 teams, 0 unplaced', () => {
    // floor(13/4)=3, 3*4=12 < 13 → can't fit; ceil(13/4)=4 teams
    const r = builder.buildTeams(
      participants(13),
      cfg({ idealSize: 4, minSize: 3, maxSize: 4, maxTeams: 10 }),
    );
    expect(r.success).toBe(true);
    expect(r.unplaced).toHaveLength(0);
    expectValidSizes(r, 3, 4);
    expectConservation(r, 13);
    // 4 teams totalling 13: one team of 1 would violate minSize=3,
    // so the sizer must produce [4,3,3,3] or [4,4,3,2] etc — all ≥ 3
    expect(r.teams).toHaveLength(4);
  });
});

// ── Single team ───────────────────────────────────────────────────────────────

describe('Algorithm A — single team', () => {
  it('5 participants, ideal=5, min=3, max=6 → exactly 1 team', () => {
    const r = builder.buildTeams(
      participants(5),
      cfg({ idealSize: 5, minSize: 3, maxSize: 6, maxTeams: 10 }),
    );
    expect(r.teams).toHaveLength(1);
    expect(r.teams[0].getMemberCount()).toBe(5);
    expect(r.unplaced).toHaveLength(0);
  });

  it('exactly minSize participants → 1 team', () => {
    const r = builder.buildTeams(
      participants(3),
      cfg({ idealSize: 3, minSize: 3, maxSize: 5, maxTeams: 10 }),
    );
    expect(r.teams).toHaveLength(1);
    expect(r.unplaced).toHaveLength(0);
  });
});

// ── Hard cap ─────────────────────────────────────────────────────────────────

describe('Algorithm A — hard cap at MAX_TEAMS_ABSOLUTE (100)', () => {
  it('1000 participants, ideal=2, maxTeams=200 → exactly 100 teams, 800 unplaced', () => {
    const r = builder.buildTeams(
      participants(1000),
      cfg({ idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200 }),
    );
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(100);
    expect(r.unplaced).toHaveLength(800);
    expectConservation(r, 1000);
  });

  it('200 participants, ideal=2, maxTeams=100 → exactly 100 teams, 0 unplaced', () => {
    const r = builder.buildTeams(
      participants(200),
      cfg({ idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 100 }),
    );
    expect(r.teams).toHaveLength(100);
    expect(r.unplaced).toHaveLength(0);
  });

  it('201 participants, ideal=2, maxTeams=100 → 100 teams, 1 unplaced', () => {
    const r = builder.buildTeams(
      participants(201),
      cfg({ idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 100 }),
    );
    expect(r.teams).toHaveLength(100);
    expect(r.unplaced).toHaveLength(1);
    expectConservation(r, 201);
  });

  it('message is SUCCESS_WITH_UNPLACED when hard cap produces unplaced participants', () => {
    const r = builder.buildTeams(
      participants(1000),
      cfg({ idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200 }),
    );
    expect(r.message).toBe(MESSAGES.SUCCESS_WITH_UNPLACED);
  });
});
