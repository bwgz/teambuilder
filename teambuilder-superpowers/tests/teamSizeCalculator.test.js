/**
 * teamSizeCalculator.test.js
 * Tests the pure function that computes team size distributions.
 */

'use strict';

const { calculateTeamSizes } = require('../src/teamSizeCalculator');

describe('calculateTeamSizes', () => {
  test('returns empty when n is 0', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(0, 3, 2, 4);
    expect(teamSizes).toEqual([]);
    expect(unplacedCount).toBe(0);
  });

  test('creates teams of ideal size when n divides evenly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(9, 3, 2, 4);
    expect(teamSizes).toEqual([3, 3, 3]);
    expect(unplacedCount).toBe(0);
  });

  test('all team sizes are within [min, max] when n does not divide evenly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(10, 3, 2, 4);
    const total = teamSizes.reduce((a, b) => a + b, 0);
    expect(total + unplacedCount).toBe(10);
    teamSizes.forEach(size => {
      expect(size).toBeGreaterThanOrEqual(2);
      expect(size).toBeLessThanOrEqual(4);
    });
  });

  test('caps at 100 teams and leaves overflow as unplaced', () => {
    // ideal=1, min=1, max=1 wants 500 teams but is capped at 100
    const { teamSizes, unplacedCount } = calculateTeamSizes(500, 1, 1, 1);
    expect(teamSizes.length).toBe(100);
    expect(unplacedCount).toBe(400);
  });

  test('places unplaced when constraints prevent full placement', () => {
    // 7 participants, min=4, max=5: minTeams=ceil(7/5)=2, maxTeams=floor(7/4)=1
    // minTeams > maxTeams, so use 1 team of size 5, 2 unplaced
    const { teamSizes, unplacedCount } = calculateTeamSizes(7, 4, 4, 5);
    expect(teamSizes).toEqual([5]);
    expect(unplacedCount).toBe(2);
  });

  test('returns unplacedCount=0 when all participants fit exactly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(12, 4, 3, 5);
    expect(unplacedCount).toBe(0);
    const total = teamSizes.reduce((a, b) => a + b, 0);
    expect(total).toBe(12);
  });
});
