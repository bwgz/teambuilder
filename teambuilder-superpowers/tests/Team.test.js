/**
 * Team.test.js
 * Tests for the Team class — verifies size, skill sum, and encapsulation of participants.
 */

'use strict';

const { Team } = require('../src/Team');
const { Participant } = require('../src/Participant');

describe('Team', () => {
  test('starts empty with size 0 and skill sum 0', () => {
    const team = new Team();
    expect(team.getSize()).toBe(0);
    expect(team.getParticipants()).toEqual([]);
    expect(team.getSkillSum()).toBe(0);
  });

  test('getSize returns the number of added participants', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));
    team.addParticipant(new Participant('Bob', 60));
    expect(team.getSize()).toBe(2);
  });

  test('getSkillSum sums the abilityScore of all members', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));
    team.addParticipant(new Participant('Bob', 60));
    expect(team.getSkillSum()).toBe(140);
  });

  test('getParticipants returns a copy, not the internal array', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));

    // Mutating the returned array must not affect the team's internal state
    const participants = team.getParticipants();
    participants.push(new Participant('Intruder', 999));

    expect(team.getSize()).toBe(1);
  });
});
