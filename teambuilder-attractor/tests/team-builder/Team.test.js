/**
 * @fileoverview Unit tests for the Team class (ITeam interface).
 *
 * Covers:
 *   - getMemberCount on empty and non-empty teams
 *   - getParticipants returns a frozen copy (not the internal reference)
 *   - getAbilitySum on empty, positive, negative, and mixed-float rosters
 *   - Constructor defensive copy (mutation of the source array does not affect the team)
 */

import { describe, it, expect } from 'vitest';
import { Team } from '../../src/Team.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const p = (id, ability) => createParticipant(id, `P${id}`, ability);

// ── getMemberCount ────────────────────────────────────────────────────────────

describe('Team.getMemberCount', () => {
  it('returns 0 for an empty team', () => {
    expect(new Team([]).getMemberCount()).toBe(0);
  });

  it('returns 1 for a single-member team', () => {
    expect(new Team([p('1', 10)]).getMemberCount()).toBe(1);
  });

  it('returns the correct count for a multi-member team', () => {
    const team = new Team([p('1', 10), p('2', 8), p('3', 6)]);
    expect(team.getMemberCount()).toBe(3);
  });
});

// ── getParticipants ───────────────────────────────────────────────────────────

describe('Team.getParticipants', () => {
  it('returns all participants that were provided to the constructor', () => {
    const members = [p('1', 10), p('2', 5)];
    const team = new Team(members);
    const result = team.getParticipants();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('returns a frozen array — push throws TypeError', () => {
    const team = new Team([p('1', 10)]);
    const result = team.getParticipants();
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => result.push(p('2', 5))).toThrow(TypeError);
  });

  it('returns a copy — mutating the returned array does not change team internals', () => {
    const team = new Team([p('1', 10), p('2', 5)]);
    // getParticipants() is frozen, so we verify via two independent calls
    const first  = team.getParticipants();
    const second = team.getParticipants();
    // Both should show the same contents and member count
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    // They should be different array references (new copy per call)
    expect(first).not.toBe(second);
  });

  it('constructor makes a defensive copy — mutating the source array does not affect the team', () => {
    const members = [p('1', 10), p('2', 5)];
    const team = new Team(members);
    members.push(p('3', 3));                   // mutate source
    expect(team.getMemberCount()).toBe(2);      // team unaffected
  });

  it('returns an empty frozen array for an empty team', () => {
    const team = new Team([]);
    const result = team.getParticipants();
    expect(result).toHaveLength(0);
    expect(Object.isFrozen(result)).toBe(true);
  });
});

// ── getAbilitySum ─────────────────────────────────────────────────────────────

describe('Team.getAbilitySum', () => {
  it('returns 0 for an empty team', () => {
    expect(new Team([]).getAbilitySum()).toBe(0);
  });

  it('returns the single member ability for a one-member team', () => {
    expect(new Team([p('1', 7)]).getAbilitySum()).toBe(7);
  });

  it('sums integer abilities correctly', () => {
    const team = new Team([p('1', 10), p('2', 5)]);
    expect(team.getAbilitySum()).toBe(15);
  });

  it('handles negative ability values', () => {
    const team = new Team([p('1', -2.5), p('2', 7.5)]);
    expect(team.getAbilitySum()).toBeCloseTo(5, 10);
  });

  it('handles all-zero abilities', () => {
    const team = new Team([p('1', 0), p('2', 0), p('3', 0)]);
    expect(team.getAbilitySum()).toBe(0);
  });

  it('handles all-negative abilities', () => {
    const team = new Team([p('1', -1), p('2', -2), p('3', -3)]);
    expect(team.getAbilitySum()).toBe(-6);
  });

  it('handles floating-point abilities', () => {
    const team = new Team([p('1', 1.1), p('2', 2.2), p('3', 3.3)]);
    expect(team.getAbilitySum()).toBeCloseTo(6.6, 10);
  });
});
