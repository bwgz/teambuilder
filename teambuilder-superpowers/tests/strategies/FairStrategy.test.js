/**
 * FairStrategy.test.js
 * Tests ability-balanced team formation via snake draft.
 */

'use strict';

const { FairStrategy } = require('../../src/strategies/FairStrategy');
const { Participant } = require('../../src/Participant');

describe('FairStrategy', () => {
  test('places all participants when count divides evenly by ideal', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 6 }, (_, i) =>
      new Participant(`P${i}`, i * 10)
    );
    const { teams, unplaced } = strategy.buildTeams(participants, 2, 2, 3);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0);
    expect(total).toBe(6);
    expect(unplaced).toHaveLength(0);
  });

  test('snake draft assigns the highest-scoring participant to team 0 first', () => {
    const strategy = new FairStrategy();
    const participants = [
      new Participant('Low', 10),
      new Participant('High', 100),
      new Participant('Mid', 50),
      new Participant('Mid2', 40),
    ];
    const { teams } = strategy.buildTeams(participants, 2, 2, 2);
    // After sort desc: [100, 50, 40, 10]
    // Round 0: team0 gets 100, team1 gets 50
    // Round 1: team1 gets 40, team0 gets 10
    expect(teams[0].getParticipants().some(p => p.abilityScore === 100)).toBe(true);
  });

  test('skill sums are balanced across teams', () => {
    const strategy = new FairStrategy();
    const participants = [
      new Participant('A', 100),
      new Participant('B', 90),
      new Participant('C', 80),
      new Participant('D', 70),
      new Participant('E', 60),
      new Participant('F', 50),
    ];
    // Snake: team0=[100,70,60]=230, team1=[90,80,50]=220
    const { teams } = strategy.buildTeams(participants, 3, 2, 4);
    expect(teams).toHaveLength(2);
    const sums = teams.map(t => t.getSkillSum());
    const diff = Math.abs(sums[0] - sums[1]);
    expect(diff).toBeLessThan(50);
  });

  test('accounts for all participants across teams and unplaced', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 7 }, (_, i) =>
      new Participant(`P${i}`, i)
    );
    const { teams, unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0) + unplaced.length;
    expect(total).toBe(7);
  });

  test('returns unplaced participants when constraints prevent full placement', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 7 }, (_, i) =>
      new Participant(`P${i}`, i)
    );
    const { unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(unplaced.length).toBe(2);
  });
});
