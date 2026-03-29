/**
 * RandomStrategy.test.js
 * Tests random team formation — verifies placement, sizes, and unplaced handling.
 */

'use strict';

const { RandomStrategy } = require('../../src/strategies/RandomStrategy');
const { Participant } = require('../../src/Participant');

/** Helper: create N participants with increasing abilityScore */
const makeParticipants = (count) =>
  Array.from({ length: count }, (_, i) => new Participant(`P${i}`, i * 10));

describe('RandomStrategy', () => {
  test('places all participants when count divides evenly by ideal', () => {
    const strategy = new RandomStrategy();
    const { teams, unplaced } = strategy.buildTeams(makeParticipants(9), 3, 2, 4);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0);
    expect(total).toBe(9);
    expect(unplaced).toHaveLength(0);
    expect(teams).toHaveLength(3);
  });

  test('all team sizes stay within [min, max]', () => {
    const strategy = new RandomStrategy();
    const { teams } = strategy.buildTeams(makeParticipants(11), 4, 3, 5);
    teams.forEach(team => {
      expect(team.getSize()).toBeGreaterThanOrEqual(3);
      expect(team.getSize()).toBeLessThanOrEqual(5);
    });
  });

  test('accounts for all participants across teams and unplaced', () => {
    const strategy = new RandomStrategy();
    const participants = makeParticipants(7);
    const { teams, unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0) + unplaced.length;
    expect(total).toBe(7);
  });

  test('returns unplaced participants when constraints prevent full placement', () => {
    const strategy = new RandomStrategy();
    const { unplaced } = strategy.buildTeams(makeParticipants(7), 4, 4, 5);
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(unplaced.length).toBe(2);
  });
});
