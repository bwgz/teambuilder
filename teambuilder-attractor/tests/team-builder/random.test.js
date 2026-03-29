/**
 * @fileoverview Unit tests for the RANDOM distribution strategy.
 *
 * Tests verify:
 *   - All participants are placed (or accounted for in unplaced)
 *   - Correct number of teams is produced
 *   - No participant appears in more than one team
 *   - Team sizes satisfy the min/max bounds
 *   - Distribution is non-deterministic across multiple runs (probabilistic)
 */

import { describe, it, expect } from 'vitest';
import { TeamBuilder } from '../../src/TeamBuilder.js';
import { Mode } from '../../src/TeamConfig.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const builder = new TeamBuilder();

const participants = (n) =>
  Array.from({ length: n }, (_, i) =>
    createParticipant(`p${i}`, `Person${i}`, i),
  );

const randomCfg = (idealSize, minSize, maxSize, maxTeams = 10) => ({
  idealSize,
  minSize,
  maxSize,
  maxTeams,
  mode: Mode.RANDOM,
});

// ── Placement ─────────────────────────────────────────────────────────────────

describe('RANDOM — all participants placed', () => {
  it('12 participants, ideal=4 → 12 placed, 0 unplaced', () => {
    const r = builder.buildTeams(participants(12), randomCfg(4, 4, 4));
    const placed = r.teams.reduce((s, t) => s + t.getMemberCount(), 0);
    expect(placed).toBe(12);
    expect(r.unplaced).toHaveLength(0);
  });

  it('9 participants, ideal=3 → 9 placed, 0 unplaced', () => {
    const r = builder.buildTeams(participants(9), randomCfg(3, 3, 3));
    const placed = r.teams.reduce((s, t) => s + t.getMemberCount(), 0);
    expect(placed).toBe(9);
    expect(r.unplaced).toHaveLength(0);
  });
});

// ── Team count ────────────────────────────────────────────────────────────────

describe('RANDOM — correct team count', () => {
  it('12 participants, ideal=4 → 3 teams', () => {
    const r = builder.buildTeams(participants(12), randomCfg(4, 4, 4));
    expect(r.teams).toHaveLength(3);
  });

  it('6 participants, ideal=3 → 2 teams', () => {
    const r = builder.buildTeams(participants(6), randomCfg(3, 3, 3));
    expect(r.teams).toHaveLength(2);
  });
});

// ── No duplicates ─────────────────────────────────────────────────────────────

describe('RANDOM — no participant appears twice', () => {
  it('each participant id is unique across all teams', () => {
    const r = builder.buildTeams(participants(12), randomCfg(4, 3, 5));
    const ids = [];
    r.teams.forEach(t => t.getParticipants().forEach(p => ids.push(p.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Size bounds ───────────────────────────────────────────────────────────────

describe('RANDOM — team sizes within bounds', () => {
  it('14 participants, ideal=4, min=3, max=5 → all teams in [3,5]', () => {
    const r = builder.buildTeams(participants(14), randomCfg(4, 3, 5));
    r.teams.forEach(t => {
      expect(t.getMemberCount()).toBeGreaterThanOrEqual(3);
      expect(t.getMemberCount()).toBeLessThanOrEqual(5);
    });
  });
});

// ── Non-determinism ───────────────────────────────────────────────────────────

describe('RANDOM — non-deterministic ordering', () => {
  it('running buildTeams 10 times produces at least 2 different orderings', () => {
    const input = participants(12);
    const fingerprints = new Set();
    for (let i = 0; i < 10; i++) {
      const r = builder.buildTeams(input, randomCfg(4, 4, 4));
      const fp = r.teams
        .flatMap(t => t.getParticipants().map(p => p.id))
        .join(',');
      fingerprints.add(fp);
    }
    // With 12! orderings it would be astronomically unlikely to get the same
    // order 10 times in a row, so at least 2 distinct orderings is expected.
    expect(fingerprints.size).toBeGreaterThan(1);
  });
});

// ── Input not mutated ─────────────────────────────────────────────────────────

describe('RANDOM — input array is not mutated', () => {
  it('participants array order is unchanged after buildTeams', () => {
    const input = participants(6);
    const originalIds = input.map(p => p.id);
    builder.buildTeams(input, randomCfg(3, 3, 3));
    input.forEach((p, i) => expect(p.id).toBe(originalIds[i]));
  });
});
