/**
 * TeamBuilder.test.js
 * Integration tests covering all 9 functional requirements from the spec:
 * 1. Accepts participants list
 * 2. Accepts ideal/min/max size options
 * 3. Supports random and fair modes
 * 4. Gracefully handles min > max
 * 5. Gracefully handles ideal outside [min, max]
 * 6. Does not create more than 100 teams
 * 7. Returns list of teams made up of participants
 * 8. Indicates if teams could not be generated (success: false)
 * 9. Indicates if some participants could not be placed (hasUnplaced)
 */

'use strict';

const { TeamBuilder } = require('../src/TeamBuilder');
const { RandomStrategy } = require('../src/strategies/RandomStrategy');
const { FairStrategy } = require('../src/strategies/FairStrategy');
const { Participant } = require('../src/Participant');

/** Helper: create N participants with sequential names and scores */
const makeParticipants = (count) =>
  Array.from({ length: count }, (_, i) => new Participant(`P${i}`, i * 10));

describe('TeamBuilder', () => {
  // Requirement 8: indicate if teams could not be generated
  test('returns failure when participants list is null', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(null);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
    expect(result.teams).toHaveLength(0);
  });

  test('returns failure when participants list is empty', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants([]);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  // Requirement 4: gracefully handle min > max
  test('returns failure when min > max', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(5);
    builder.setMaxSize(3);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/minimum.*maximum|min.*max/i);
  });

  // Requirement 5: gracefully handle ideal outside [min, max]
  test('returns failure when ideal < min', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(1);
    builder.setMinSize(3);
    builder.setMaxSize(5);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  test('returns failure when ideal > max', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(10);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
  });

  // Requirement 7: returns list of teams made up of participants
  test('returns teams containing the original participants', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    const participants = makeParticipants(6);
    builder.setParticipants(participants);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    const names = result.teams.flatMap(t => t.getParticipants().map(p => p.name));
    expect(names.sort()).toEqual(participants.map(p => p.name).sort());
  });

  // Requirement 6: no more than 100 teams
  test('does not create more than 100 teams', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(500));
    builder.setIdealSize(1);
    builder.setMinSize(1);
    builder.setMaxSize(1);
    const result = builder.build();
    expect(result.teams.length).toBeLessThanOrEqual(100);
    expect(result.teams.length).toBe(100);
  });

  // Requirement 9: indicate if some participants could not be placed
  test('reports unplaced participants when constraints prevent full placement', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(7));
    builder.setIdealSize(4);
    builder.setMinSize(4);
    builder.setMaxSize(5);
    const result = builder.build();
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(result.success).toBe(true);
    expect(result.hasUnplaced()).toBe(true);
    expect(result.unplacedParticipants).toHaveLength(2);
    const total = result.teams.reduce((s, t) => s + t.getSize(), 0)
      + result.unplacedParticipants.length;
    expect(total).toBe(7);
  });

  // Requirement 3: supports both modes
  test('works with RandomStrategy', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(2);
  });

  test('works with FairStrategy', () => {
    const builder = new TeamBuilder(new FairStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(2);
  });

  // Requirement 1 + 2: ideal placement when all participants fit
  test('places all participants when count divides evenly by ideal', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(9));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.hasUnplaced()).toBe(false);
    const total = result.teams.reduce((s, t) => s + t.getSize(), 0);
    expect(total).toBe(9);
  });
});
