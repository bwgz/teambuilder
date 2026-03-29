/**
 * @fileoverview Unit tests for the TeamResult factories.
 *
 * Covers:
 *   - createSuccessResult produces correct shape and values
 *   - createFailureResult produces correct shape and values
 *   - Both results are frozen (top-level object, teams array, unplaced array)
 *   - createSuccessResult makes a defensive copy of teams and unplaced arrays
 */

import { describe, it, expect } from 'vitest';
import { createSuccessResult, createFailureResult } from '../../src/TeamResult.js';
import { Team } from '../../src/Team.js';
import { createParticipant } from '../../src/Participant.js';
import { MESSAGES } from '../../src/TeamConfig.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const p = (id, ability) => createParticipant(id, `P${id}`, ability);
const makeTeam = (...abilities) =>
  new Team(abilities.map((a, i) => p(String(i), a)));

// ── createSuccessResult ───────────────────────────────────────────────────────

describe('createSuccessResult', () => {
  it('sets success to true', () => {
    const r = createSuccessResult([], [], MESSAGES.SUCCESS);
    expect(r.success).toBe(true);
  });

  it('stores teams correctly', () => {
    const t1 = makeTeam(10, 5);
    const t2 = makeTeam(8, 3);
    const r  = createSuccessResult([t1, t2], [], MESSAGES.SUCCESS);
    expect(r.teams).toHaveLength(2);
    expect(r.teams[0]).toBe(t1);
    expect(r.teams[1]).toBe(t2);
  });

  it('stores unplaced correctly', () => {
    const participant = p('x', 7);
    const r = createSuccessResult([], [participant], MESSAGES.SUCCESS_WITH_UNPLACED);
    expect(r.unplaced).toHaveLength(1);
    expect(r.unplaced[0]).toBe(participant);
  });

  it('stores the message', () => {
    const r = createSuccessResult([], [], MESSAGES.SUCCESS);
    expect(r.message).toBe(MESSAGES.SUCCESS);
  });

  it('returns a frozen object — top-level fields cannot be reassigned', () => {
    const r = createSuccessResult([], [], MESSAGES.SUCCESS);
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => { r.success = false; }).toThrow(TypeError);
  });

  it('teams array is frozen — push throws', () => {
    const r = createSuccessResult([], [], MESSAGES.SUCCESS);
    expect(Object.isFrozen(r.teams)).toBe(true);
    expect(() => r.teams.push(makeTeam(1))).toThrow(TypeError);
  });

  it('unplaced array is frozen — push throws', () => {
    const r = createSuccessResult([], [], MESSAGES.SUCCESS);
    expect(Object.isFrozen(r.unplaced)).toBe(true);
    expect(() => r.unplaced.push(p('y', 1))).toThrow(TypeError);
  });

  it('makes defensive copies — mutating the source arrays after creation has no effect', () => {
    const teams    = [makeTeam(5)];
    const unplaced = [p('z', 3)];
    const r        = createSuccessResult(teams, unplaced, MESSAGES.SUCCESS);

    teams.push(makeTeam(1));        // mutate source teams array
    unplaced.push(p('w', 2));       // mutate source unplaced array

    expect(r.teams).toHaveLength(1);
    expect(r.unplaced).toHaveLength(1);
  });
});

// ── createFailureResult ───────────────────────────────────────────────────────

describe('createFailureResult', () => {
  it('sets success to false', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(r.success).toBe(false);
  });

  it('teams is an empty array', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(r.teams).toHaveLength(0);
  });

  it('unplaced is an empty array', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(r.unplaced).toHaveLength(0);
  });

  it('stores the message', () => {
    const r = createFailureResult(MESSAGES.NOT_ENOUGH);
    expect(r.message).toBe(MESSAGES.NOT_ENOUGH);
  });

  it('returns a frozen object', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => { r.success = true; }).toThrow(TypeError);
  });

  it('teams array is frozen', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(Object.isFrozen(r.teams)).toBe(true);
  });

  it('unplaced array is frozen', () => {
    const r = createFailureResult(MESSAGES.NO_PARTICIPANTS);
    expect(Object.isFrozen(r.unplaced)).toBe(true);
  });
});
