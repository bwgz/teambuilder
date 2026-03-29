/**
 * @fileoverview Unit tests for the internal `validate` function, exercised
 * indirectly through TeamBuilder.buildTeams to verify the full C1–C4 guard
 * chain.
 *
 * Each constraint is tested in isolation as well as the happy-path where all
 * guards pass.  Message strings are asserted against the MESSAGES constants
 * so that any future wording change propagates automatically.
 */

import { describe, it, expect } from 'vitest';
import { TeamBuilder } from '../../src/TeamBuilder.js';
import { Mode, MESSAGES } from '../../src/TeamConfig.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const builder = new TeamBuilder();

/** Returns a minimal valid config with the given overrides. */
const cfg = (overrides = {}) => ({
  idealSize: 3,
  minSize:   2,
  maxSize:   4,
  maxTeams:  10,
  mode:      Mode.RANDOM,
  ...overrides,
});

/** Builds an array of n participants, all with ability 5. */
const participants = (n) =>
  Array.from({ length: n }, (_, i) =>
    createParticipant(`p${i}`, `Person${i}`, 5),
  );

// ── C1 — minSize > maxSize ────────────────────────────────────────────────────

describe('Constraint C1: minSize > maxSize', () => {
  it('returns success=false when minSize > maxSize', () => {
    const r = builder.buildTeams(participants(5), cfg({ minSize: 5, maxSize: 3 }));
    expect(r.success).toBe(false);
  });

  it('returns the canonical MIN_GREATER_THAN_MAX message', () => {
    const r = builder.buildTeams(participants(5), cfg({ minSize: 5, maxSize: 3 }));
    expect(r.message).toBe(MESSAGES.MIN_GREATER_THAN_MAX);
  });

  it('returns empty teams and unplaced on C1 failure', () => {
    const r = builder.buildTeams(participants(5), cfg({ minSize: 5, maxSize: 3 }));
    expect(r.teams).toHaveLength(0);
    expect(r.unplaced).toHaveLength(0);
  });

  it('does NOT fail when minSize === maxSize (boundary)', () => {
    const r = builder.buildTeams(
      participants(4),
      cfg({ idealSize: 2, minSize: 2, maxSize: 2 }),
    );
    expect(r.success).toBe(true);
  });
});

// ── C2 — idealSize outside [minSize, maxSize] ─────────────────────────────────

describe('Constraint C2: idealSize outside [minSize, maxSize]', () => {
  it('returns success=false when idealSize < minSize', () => {
    const r = builder.buildTeams(
      participants(5),
      cfg({ idealSize: 1, minSize: 2, maxSize: 4 }),
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.IDEAL_OUT_OF_RANGE);
  });

  it('returns success=false when idealSize > maxSize', () => {
    const r = builder.buildTeams(
      participants(5),
      cfg({ idealSize: 6, minSize: 2, maxSize: 4 }),
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.IDEAL_OUT_OF_RANGE);
  });

  it('does NOT fail when idealSize === minSize (boundary)', () => {
    const r = builder.buildTeams(
      participants(4),
      cfg({ idealSize: 2, minSize: 2, maxSize: 4 }),
    );
    expect(r.success).toBe(true);
  });

  it('does NOT fail when idealSize === maxSize (boundary)', () => {
    const r = builder.buildTeams(
      participants(4),
      cfg({ idealSize: 4, minSize: 2, maxSize: 4 }),
    );
    expect(r.success).toBe(true);
  });

  it('C2 is checked AFTER C1 — when both fail, message is C1', () => {
    // minSize=5 > maxSize=3 (C1), idealSize=1 (C2) — C1 fires first
    const r = builder.buildTeams(
      participants(5),
      cfg({ idealSize: 1, minSize: 5, maxSize: 3 }),
    );
    expect(r.message).toBe(MESSAGES.MIN_GREATER_THAN_MAX);
  });
});

// ── C3 — no participants ──────────────────────────────────────────────────────

describe('Constraint C3: null / undefined / empty participants', () => {
  it('returns success=false for null participants', () => {
    const r = builder.buildTeams(null, cfg());
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NO_PARTICIPANTS);
  });

  it('returns success=false for undefined participants', () => {
    const r = builder.buildTeams(undefined, cfg());
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NO_PARTICIPANTS);
  });

  it('returns success=false for an empty array', () => {
    const r = builder.buildTeams([], cfg());
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NO_PARTICIPANTS);
  });
});

// ── C4 — not enough participants ──────────────────────────────────────────────

describe('Constraint C4: participants.length < minSize', () => {
  it('returns success=false when 2 participants but minSize=3', () => {
    const r = builder.buildTeams(
      participants(2),
      cfg({ idealSize: 3, minSize: 3, maxSize: 4 }),
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NOT_ENOUGH);
  });

  it('returns success=false for 1 participant when minSize=2', () => {
    const r = builder.buildTeams(
      participants(1),
      cfg({ idealSize: 2, minSize: 2, maxSize: 3 }),
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NOT_ENOUGH);
  });

  it('does NOT fail when participants.length === minSize (exact boundary)', () => {
    const r = builder.buildTeams(
      participants(2),
      cfg({ idealSize: 2, minSize: 2, maxSize: 3 }),
    );
    expect(r.success).toBe(true);
  });
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe('Validation happy path', () => {
  it('returns success=true when all constraints pass', () => {
    const r = builder.buildTeams(
      participants(6),
      cfg({ idealSize: 3, minSize: 2, maxSize: 4 }),
    );
    expect(r.success).toBe(true);
  });
});
