/**
 * @fileoverview Team class — a read-only view of a formed team.
 *
 * A Team holds an immutable snapshot of the {@link Participant} roster
 * assigned to it during distribution.  All mutating operations are
 * intentionally absent; the internal roster is stored as a private copy so
 * external references cannot affect it.
 *
 * @author team-builder
 * @date   2026-03-28
 */

/** @typedef {import('./Participant.js').Participant} Participant */

// ─── Class ────────────────────────────────────────────────────────────────────

/**
 * Immutable, read-only representation of a single formed team.
 *
 * Implements the `ITeam` interface described in the spec:
 *
 * | Method            | Returns                       | Description                          |
 * |-------------------|-------------------------------|--------------------------------------|
 * | `getMemberCount`  | `number`                      | Number of participants on this team. |
 * | `getParticipants` | `ReadonlyArray<Participant>`  | Frozen copy of the roster.           |
 * | `getAbilitySum`   | `number`                      | Sum of all participants' ability.    |
 *
 * **Immutability guarantees**
 * - The constructor makes a defensive shallow copy of the supplied array, so
 *   pushing to or splicing the original array after construction has no effect.
 * - `getParticipants()` returns a _second_, frozen copy, so callers cannot
 *   modify the team's internal state through the returned reference either.
 * - Individual {@link Participant} objects are already frozen by
 *   {@link createParticipant}, providing end-to-end immutability.
 *
 * @example
 * import { createParticipant } from './Participant.js';
 * import { Team } from './Team.js';
 *
 * const p1 = createParticipant('1', 'Alice', 10);
 * const p2 = createParticipant('2', 'Bob',   5);
 * const team = new Team([p1, p2]);
 *
 * team.getMemberCount();   // → 2
 * team.getAbilitySum();    // → 15
 * team.getParticipants();  // → [{ id:'1', … }, { id:'2', … }]
 */
export class Team {
  // ─── Private state ──────────────────────────────────────────────────────────

  /**
   * Private defensive copy of the roster.
   *
   * Stored as a plain `Array` so that internal arithmetic (reduce, length)
   * works without any wrapper overhead.  Never exposed directly — callers
   * always receive a fresh frozen copy from {@link getParticipants}.
   *
   * @type {Participant[]}
   */
  #participants;

  // ─── Construction ────────────────────────────────────────────────────────────

  /**
   * Constructs a new Team from the given roster.
   *
   * A shallow defensive copy of `participants` is made immediately so that
   * any subsequent mutation of the original array (e.g. a `push` or `splice`
   * by the caller) has no effect on this Team.  The individual
   * {@link Participant} objects are _not_ deep-cloned because they are already
   * frozen by convention.
   *
   * @param {Participant[]} participants - The participants assigned to this
   *   team.  May be empty (e.g. an unfilled slot), but must not be `null` or
   *   `undefined`.
   * @returns {void}
   *
   * @example
   * const team = new Team([]);          // valid — zero-member team
   * const team = new Team([p1, p2]);    // two-member team
   */
  constructor(participants) {
    // Defensive shallow copy — mutations to the caller's array won't affect us
    this.#participants = [...participants];
  }

  // ─── Public accessors ────────────────────────────────────────────────────────

  /**
   * Returns the number of participants currently on this team.
   *
   * Delegates directly to `Array.length` on the internal roster copy.
   *
   * @returns {number} A non-negative integer representing the member count.
   *   Returns `0` for an empty team.
   *
   * @example
   * new Team([]).getMemberCount();          // → 0
   * new Team([p1, p2, p3]).getMemberCount(); // → 3
   */
  getMemberCount() {
    return this.#participants.length;
  }

  /**
   * Returns a frozen, shallow copy of the participants roster.
   *
   * A _new_ array is created on every call and then frozen via
   * `Object.freeze`, so callers cannot push, pop, or splice it.  Because a
   * fresh copy is returned each time, multiple callers holding different
   * references do not interfere with each other or with the Team's internal
   * state.
   *
   * Individual {@link Participant} objects within the array are not re-frozen
   * here because they are already frozen by {@link createParticipant}.
   *
   * @returns {ReadonlyArray<Participant>} A frozen array of participants.
   *   Attempts to mutate it (e.g. `push`, index assignment) will throw a
   *   `TypeError` in strict mode.
   *
   * @example
   * const members = team.getParticipants();
   * members.push(extraParticipant); // TypeError — array is frozen
   *
   * @example
   * // Safe to iterate or destructure
   * const [first, ...rest] = team.getParticipants();
   */
  getParticipants() {
    // Spread into a new array then freeze — callers can read but not mutate
    return Object.freeze([...this.#participants]);
  }

  /**
   * Returns the sum of all participants' `ability` scores.
   *
   * Uses `Array.prototype.reduce` with an initial accumulator of `0`, so an
   * empty team correctly returns `0` rather than `undefined`.  Handles
   * negative and floating-point ability values without special-casing.
   *
   * @returns {number} The sum of `ability` values across all team members.
   *   Returns `0` for an empty team.
   *
   * @example
   * const team = new Team([
   *   { id: '1', name: 'A', ability: 10 },
   *   { id: '2', name: 'B', ability: 5  },
   * ]);
   * team.getAbilitySum(); // → 15
   *
   * @example
   * // Negative and floating-point values
   * const team = new Team([
   *   { id: '3', name: 'C', ability: -2.5 },
   *   { id: '4', name: 'D', ability:  7.5 },
   * ]);
   * team.getAbilitySum(); // → 5
   *
   * @example
   * new Team([]).getAbilitySum(); // → 0
   */
  getAbilitySum() {
    // Seed accumulator with 0 so an empty team returns 0, not undefined
    return this.#participants.reduce((sum, p) => sum + p.ability, 0);
  }
}
