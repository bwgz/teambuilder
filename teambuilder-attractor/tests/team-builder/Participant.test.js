/**
 * @fileoverview Unit tests for the Participant factory.
 *
 * Covers:
 *   - Shape of the returned object (id, name, ability fields present)
 *   - Immutability via Object.freeze
 *   - Acceptance of zero and negative ability values
 *   - Acceptance of floating-point ability values
 */

import { describe, it, expect } from 'vitest';
import { createParticipant } from '../../src/Participant.js';

describe('createParticipant', () => {
  it('returns an object with the correct id, name, and ability', () => {
    const p = createParticipant('p1', 'Alice', 9.5);
    expect(p.id).toBe('p1');
    expect(p.name).toBe('Alice');
    expect(p.ability).toBe(9.5);
  });

  it('freezes the returned object so fields cannot be mutated', () => {
    const p = createParticipant('p2', 'Bob', 5);
    expect(Object.isFrozen(p)).toBe(true);
    expect(() => { p.ability = 0; }).toThrow(TypeError);
  });

  it('accepts ability = 0', () => {
    const p = createParticipant('p3', 'Charlie', 0);
    expect(p.ability).toBe(0);
  });

  it('accepts negative ability values', () => {
    const p = createParticipant('p4', 'Dana', -3.5);
    expect(p.ability).toBe(-3.5);
  });

  it('accepts floating-point ability values', () => {
    const p = createParticipant('p5', 'Eve', 7.77);
    expect(p.ability).toBe(7.77);
  });

  it('two participants with the same name but different ids are distinct', () => {
    const p1 = createParticipant('a', 'Twin', 5);
    const p2 = createParticipant('b', 'Twin', 5);
    expect(p1).not.toBe(p2);
    expect(p1.id).not.toBe(p2.id);
  });
});
