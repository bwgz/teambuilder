/**
 * @fileoverview Unit tests for the FAIR (snake-draft) distribution strategy.
 *
 * Tests verify:
 *   - Sort order: participants are sorted descending by ability before drafting
 *   - Snake-draft direction: even rounds go left→right, odd rounds right→left
 *   - Exact bucket assignments for small, well-known inputs
 *   - Ability balance: resulting teams have similar ability sums
 *   - Conservation: no participant is lost or duplicated
 *   - Edge cases: single team, single participant per team, equal abilities,
 *     negative abilities, floating-point abilities
 */

import { describe, it, expect } from 'vitest';
import { TeamBuilder } from '../../src/TeamBuilder.js';
import { Mode } from '../../src/TeamConfig.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const builder = new TeamBuilder();

/** Builds a participant with the given ability; id is derived from index. */
const p = (ability, idx) =>
  createParticipant(`p${idx}`, `Person${idx}`, ability);

/** Builds an ordered participant list from an ability array. */
const ps = (abilities) => abilities.map((a, i) => p(a, i));

const fairCfg = (idealSize, minSize, maxSize, maxTeams = 10) => ({
  idealSize,
  minSize,
  maxSize,
  maxTeams,
  mode: Mode.FAIR,
});

/** Returns all participant ids across all teams and unplaced. */
function allIds(result) {
  const ids = [];
  result.teams.forEach(t => t.getParticipants().forEach(p => ids.push(p.id)));
  result.unplaced.forEach(p => ids.push(p.id));
  return ids;
}

// ── Sort order ────────────────────────────────────────────────────────────────

describe('FAIR — descending sort by ability', () => {
  it('the highest-ability participant ends up in a team (not unplaced)', () => {
    const participants = ps([3, 10, 1, 7, 5, 2]);   // deliberately unsorted
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    expect(r.success).toBe(true);
    // Highest ability is 10; it should be placed in team 0 (first pick of round 0)
    const t0Members = r.teams[0].getParticipants();
    expect(t0Members.some(m => m.ability === 10)).toBe(true);
  });

  it('the second-highest ability participant goes to team 1 (round-0 pick 1)', () => {
    // 6 participants across 2 teams: sorted [10,9,8,7,6,5]
    // Round 0 (even, L→R): 10→t0, 9→t1
    const participants = ps([5, 6, 7, 8, 9, 10]);   // unsorted input
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    const t1Members = r.teams[1].getParticipants();
    expect(t1Members.some(m => m.ability === 9)).toBe(true);
  });
});

// ── Exact snake-draft assignments ─────────────────────────────────────────────

describe('FAIR — exact snake-draft bucket assignments', () => {
  it('6 participants, 2 teams of 3 → correct per-team membership and sums', () => {
    // Sorted: [10, 9, 8, 7, 6, 5]
    // Round 0 (even, L→R):  10→t0, 9→t1
    // Round 1 (odd,  R→L):   8→t1, 7→t0
    // Round 2 (even, L→R):   6→t0, 5→t1
    // t0: [10, 7, 6]  sum=23
    // t1: [9,  8, 5]  sum=22
    const participants = ps([10, 9, 8, 7, 6, 5]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));

    expect(r.teams).toHaveLength(2);
    expect(r.unplaced).toHaveLength(0);

    const sums = r.teams.map(t => t.getAbilitySum()).sort((a, b) => b - a);
    expect(sums[0]).toBe(23);
    expect(sums[1]).toBe(22);
  });

  it('9 participants, 3 teams of 3 → correct sums', () => {
    // Sorted: [9, 8, 7, 6, 5, 4, 3, 2, 1]
    // Round 0 (even, L→R):  9→t0, 8→t1, 7→t2
    // Round 1 (odd,  R→L):  6→t2, 5→t1, 4→t0
    // Round 2 (even, L→R):  3→t0, 2→t1, 1→t2
    // t0: [9,4,3]=16, t1: [8,5,2]=15, t2: [7,6,1]=14
    const participants = ps([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));

    const sums = r.teams.map(t => t.getAbilitySum()).sort((a, b) => b - a);
    expect(sums[0]).toBe(16);
    expect(sums[1]).toBe(15);
    expect(sums[2]).toBe(14);
  });

  it('16 participants, 4 teams of 4 → all team sums are equal (34)', () => {
    // Sorted: [16,15,14,13, 12,11,10,9, 8,7,6,5, 4,3,2,1]
    // Round 0 (even): 16→t0, 15→t1, 14→t2, 13→t3
    // Round 1 (odd):  12→t3, 11→t2, 10→t1,  9→t0
    // Round 2 (even):  8→t0,  7→t1,  6→t2,  5→t3
    // Round 3 (odd):   4→t3,  3→t2,  2→t1,  1→t0
    // t0: [16,9,8,1]=34  t1: [15,10,7,2]=34  t2: [14,11,6,3]=34  t3: [13,12,5,4]=34
    const participants = ps(Array.from({ length: 16 }, (_, i) => 16 - i));
    const r = builder.buildTeams(participants, fairCfg(4, 4, 4));

    expect(r.teams).toHaveLength(4);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => expect(t.getAbilitySum()).toBe(34));
  });
});

// ── Ability balance ───────────────────────────────────────────────────────────

describe('FAIR — ability balance', () => {
  it('team ability sums differ by at most 1 for perfectly even inputs', () => {
    // Any even N with equal-step abilities should produce almost-equal sums
    const participants = ps([8, 7, 6, 5, 4, 3, 2, 1]);
    const r = builder.buildTeams(participants, fairCfg(4, 4, 4));
    const sums = r.teams.map(t => t.getAbilitySum());
    const maxSum = Math.max(...sums);
    const minSum = Math.min(...sums);
    expect(maxSum - minSum).toBeLessThanOrEqual(1);
  });

  it('FAIR is more balanced than a deliberately ordered RANDOM run', () => {
    // 8 participants sorted by ability. If assigned sequentially (not snake-drafted)
    // teams would have very different sums: [8,7,6,5] vs [4,3,2,1] = 26 vs 10.
    // FAIR should produce sums much closer together.
    const participants = ps([8, 7, 6, 5, 4, 3, 2, 1]);
    const r = builder.buildTeams(participants, fairCfg(4, 4, 4));
    const sums = r.teams.map(t => t.getAbilitySum());
    const maxSum = Math.max(...sums);
    const minSum = Math.min(...sums);
    // Both teams should have sums near 18 (36/2); certainly not 26 vs 10
    expect(maxSum).toBeLessThan(22);
    expect(minSum).toBeGreaterThan(14);
  });

  it('3 teams with 12 participants → sums are within 2 of each other', () => {
    const participants = ps(Array.from({ length: 12 }, (_, i) => 12 - i));
    const r = builder.buildTeams(participants, fairCfg(4, 4, 4));
    const sums = r.teams.map(t => t.getAbilitySum());
    const maxSum = Math.max(...sums);
    const minSum = Math.min(...sums);
    expect(maxSum - minSum).toBeLessThanOrEqual(2);
  });
});

// ── Conservation ──────────────────────────────────────────────────────────────

describe('FAIR — conservation (no participant lost or duplicated)', () => {
  it('6 participants, 2 teams → all 6 ids appear exactly once', () => {
    const participants = ps([10, 9, 8, 7, 6, 5]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    const ids = allIds(r);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });

  it('9 participants, 3 teams → all 9 ids appear exactly once', () => {
    const participants = ps([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    const ids = allIds(r);
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
  });

  it('7 participants with max=4, min=3 → 6 placed + 1 unplaced, no duplicates', () => {
    // sizer: floor(7/3)=2 teams; sizes=[4,3]; bucket1 has 4 items but slot is 3
    // → fairExcess=[1 participant], unplaced=[that participant]
    const participants = ps([10, 9, 8, 7, 6, 5, 4]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 4));
    const ids = allIds(r);
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
    expect(r.unplaced).toHaveLength(1);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('FAIR — edge cases', () => {
  it('single team — all participants go to team 0', () => {
    const participants = ps([5, 3, 1]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    expect(r.teams).toHaveLength(1);
    expect(r.teams[0].getMemberCount()).toBe(3);
    // All 3 abilities present
    const abilities = r.teams[0].getParticipants().map(p => p.ability).sort((a,b)=>b-a);
    expect(abilities).toEqual([5, 3, 1]);
  });

  it('1 participant per team (2 teams, 2 participants)', () => {
    const participants = ps([10, 5]);
    const r = builder.buildTeams(participants, fairCfg(1, 1, 1));
    expect(r.teams).toHaveLength(2);
    // Higher ability goes to team 0 (round 0, pos 0 → bucket 0)
    const t0 = r.teams[0].getParticipants()[0];
    const t1 = r.teams[1].getParticipants()[0];
    expect(t0.ability).toBe(10);
    expect(t1.ability).toBe(5);
  });

  it('all participants have equal ability — all placed, teams balanced by size', () => {
    const participants = ps([5, 5, 5, 5, 5, 5]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    expect(r.success).toBe(true);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => {
      expect(t.getMemberCount()).toBe(3);
      expect(t.getAbilitySum()).toBe(15);
    });
  });

  it('all participants have ability 0 — sums are 0', () => {
    const participants = ps([0, 0, 0, 0, 0, 0]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    r.teams.forEach(t => expect(t.getAbilitySum()).toBe(0));
  });

  it('negative abilities — sort descending still works (least negative first)', () => {
    // sorted desc: [-1, -2, -3, -4, -5, -6]
    // Round 0: -1→t0, -2→t1; Round 1: -3→t1, -4→t0; Round 2: -5→t0, -6→t1
    // t0: [-1,-4,-5]=-10  t1: [-2,-3,-6]=-11
    const participants = ps([-1, -2, -3, -4, -5, -6]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    const sums = r.teams.map(t => t.getAbilitySum()).sort((a, b) => b - a);
    expect(sums[0]).toBe(-10);
    expect(sums[1]).toBe(-11);
  });

  it('floating-point abilities — participants placed correctly', () => {
    const participants = ps([1.5, 2.5, 3.5, 4.5, 5.5, 6.5]);
    const r = builder.buildTeams(participants, fairCfg(3, 3, 3));
    expect(r.success).toBe(true);
    expect(r.unplaced).toHaveLength(0);
    const totalAbility = r.teams.reduce((s, t) => s + t.getAbilitySum(), 0);
    expect(totalAbility).toBeCloseTo(24, 10);   // 1.5+2.5+3.5+4.5+5.5+6.5 = 24
  });
});

// ── Input is not mutated ──────────────────────────────────────────────────────

describe('FAIR — input array is not mutated', () => {
  it('participants array order is unchanged after buildTeams', () => {
    const originalAbilities = [3, 10, 1, 7, 5, 2];
    const participants = ps(originalAbilities);
    builder.buildTeams(participants, fairCfg(3, 3, 3));
    // Original order must be preserved
    participants.forEach((p, i) => {
      expect(p.ability).toBe(originalAbilities[i]);
    });
  });
});
