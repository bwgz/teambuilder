/**
 * @fileoverview Participant factory and related constants.
 *
 * A Participant is an immutable value record representing a single person
 * who may be assigned to a team.  Direct object literals satisfying the
 * {@link Participant} shape are also acceptable wherever a Participant is
 * expected; the {@link createParticipant} factory is provided as a
 * convenience and for input normalisation.
 *
 * @author team-builder
 * @date   2026-03-28
 */

// ─── Type definitions (JSDoc only — no runtime type system) ──────────────────

/**
 * An immutable value record representing a single person who may be assigned
 * to a team.
 *
 * All three fields are required.  Objects returned by {@link createParticipant}
 * are sealed with `Object.freeze` and therefore cannot be mutated after
 * creation.  Plain object literals that match this shape are also accepted
 * wherever a `Participant` is expected.
 *
 * @typedef {object} Participant
 * @property {string} id      - Unique identifier for the participant.
 *   Must be non-empty and distinct from every other participant's `id` within
 *   the same distribution run.
 * @property {string} name    - Human-readable display name.  Does not need to
 *   be unique.
 * @property {number} ability - Numeric skill/ability score (any finite float;
 *   0 and negative values are valid).  Used by the FAIR strategy to rank
 *   participants before snake-drafting.
 */

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a new, frozen {@link Participant} object.
 *
 * The returned object is sealed with `Object.freeze` so that callers cannot
 * accidentally mutate it after creation.  Passing the result to
 * {@link Team}'s constructor is therefore safe — the Team stores a shallow
 * copy of the roster array, and the individual Participant objects themselves
 * are already immutable.
 *
 * @param {string} id      - Unique identifier for the participant.
 * @param {string} name    - Human-readable display name.
 * @param {number} ability - Numeric skill/ability score.
 * @returns {Participant} A new, frozen Participant value object.
 *
 * @example
 * const p = createParticipant('p1', 'Alice', 9.5);
 * // → { id: 'p1', name: 'Alice', ability: 9.5 }
 *
 * @example
 * // Attempting to mutate the frozen object throws in strict mode
 * p.ability = 0; // TypeError: Cannot assign to read only property
 */
export function createParticipant(id, name, ability) {
  return Object.freeze({ id, name, ability });
}
