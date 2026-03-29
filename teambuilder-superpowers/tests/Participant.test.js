/**
 * Participant.test.js
 * Tests for the Participant data class — verifies name and abilityScore storage.
 */
'use strict';

const { Participant } = require('../src/Participant');

describe('Participant', () => {
  test('stores name and abilityScore', () => {
    const p = new Participant('Alice', 85);
    expect(p.name).toBe('Alice');
    expect(p.abilityScore).toBe(85);
  });

  test('accepts a score of 0', () => {
    const p = new Participant('Bob', 0);
    expect(p.abilityScore).toBe(0);
  });

  test('accepts a negative score', () => {
    const p = new Participant('Carol', -10);
    expect(p.abilityScore).toBe(-10);
  });
});
