/**
 * TeamResult.test.js
 * Tests the result object returned by TeamBuilder.build().
 */

'use strict';

const { TeamResult } = require('../src/TeamResult');
const { Participant } = require('../src/Participant');

describe('TeamResult', () => {
  test('success result has success:true and null errorMessage', () => {
    const result = new TeamResult(true, [], [], null);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBeNull();
  });

  test('failure result has success:false and a non-empty errorMessage', () => {
    const result = new TeamResult(false, [], [], 'Something went wrong');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Something went wrong');
  });

  test('hasUnplaced returns false when unplacedParticipants is empty', () => {
    const result = new TeamResult(true, [], [], null);
    expect(result.hasUnplaced()).toBe(false);
  });

  test('hasUnplaced returns true when there are unplaced participants', () => {
    const unplaced = [new Participant('Alice', 80)];
    const result = new TeamResult(true, [], unplaced, null);
    expect(result.hasUnplaced()).toBe(true);
  });
});
