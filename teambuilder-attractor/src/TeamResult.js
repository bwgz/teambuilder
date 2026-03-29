/**
 * @fileoverview TeamResult factories.
 *
 * A TeamResult is an immutable value object returned by
 * {@link TeamBuilder#buildTeams} that describes the outcome of a
 * distribution run.  Consumers inspect `success` first, then read `teams`
 * and `unplaced` to retrieve the formed teams and any participants that
 * could not be placed within the configured constraints.
 *
 * Two factory functions are provided rather than a class constructor to make
 * the success/failure distinction explicit at the call site and to ensure
 * the returned objects are always correctly shaped and frozen.
 *
 * @author team-builder
 * @date   2026-03-28
 */

/**
 * @typedef {import('./Team.js').Team}               Team
 * @typedef {import('./Participant.js').Participant}  Participant
 */

// ─── Type definition (JSDoc only) ────────────────────────────────────────────

/**
 * An immutable value object describing the outcome of a
 * {@link TeamBuilder#buildTeams} call.
 *
 * Objects of this type are produced exclusively by {@link createSuccessResult}
 * and {@link createFailureResult} and are sealed with `Object.freeze`.
 *
 * ### Interpreting the result
 *
 * ```
 * if (result.success) {
 *   // result.teams contains 1-N Team instances
 *   // result.unplaced may contain participants that hit the hard cap
 * } else {
 *   // result.message describes the validation failure
 *   // result.teams and result.unplaced are both empty
 * }
 * ```
 *
 * | Scenario                            | `success` | `teams`       | `unplaced`       |
 * |-------------------------------------|-----------|---------------|------------------|
 * | Validation error (C1–C4)            | `false`   | `[]`          | `[]`             |
 * | All participants placed             | `true`    | non-empty     | `[]`             |
 * | Hard-cap (100 teams) causes overflow| `true`    | 100 teams max | overflow list    |
 *
 * @typedef {object} TeamResult
 * @property {boolean}               success  - `true` if at least one team was
 *   successfully formed; `false` if a fatal validation error prevented any
 *   team from being created.
 * @property {ReadonlyArray<Team>}   teams    - Ordered array of formed
 *   {@link Team} instances.  Always an empty frozen array when `success` is
 *   `false`.
 * @property {ReadonlyArray<Participant>} unplaced - Participants that could
 *   not be assigned to any team (e.g. due to the 100-team hard cap).  Always
 *   an empty frozen array when `success` is `false`.
 * @property {string}                message  - Human-readable description of
 *   the result.  On failure this is one of the {@link MESSAGES} error strings.
 *   On success it is either `MESSAGES.SUCCESS` or
 *   `MESSAGES.SUCCESS_WITH_UNPLACED`.
 */

// ─── Factories ────────────────────────────────────────────────────────────────

/**
 * Creates a frozen {@link TeamResult} representing a **successful**
 * distribution run.
 *
 * Both `teams` and `unplaced` are frozen before being stored on the result
 * object, so callers cannot push to or splice them.  Individual {@link Team}
 * instances and {@link Participant} objects within those arrays are already
 * immutable by their own construction.
 *
 * @param {Team[]}        teams    - Formed teams.  May be empty only in the
 *   edge case where `maxTeams` is `0` and all participants became unplaced;
 *   `success` remains `true` in that scenario because no validation error
 *   occurred.
 * @param {Participant[]} unplaced - Participants that could not be placed.
 *   Pass an empty array `[]` when all participants were successfully assigned.
 * @param {string}        message  - Human-readable success message.  Should
 *   be `MESSAGES.SUCCESS` when `unplaced` is empty, or
 *   `MESSAGES.SUCCESS_WITH_UNPLACED` otherwise.
 * @returns {TeamResult} A frozen TeamResult with `success: true`.
 *
 * @example
 * import { createSuccessResult }   from './TeamResult.js';
 * import { MESSAGES }              from './TeamConfig.js';
 *
 * const result = createSuccessResult([team1, team2], [], MESSAGES.SUCCESS);
 * result.success;          // → true
 * result.teams.length;     // → 2
 * result.unplaced.length;  // → 0
 * result.message;          // → 'Teams formed successfully'
 *
 * @example
 * // With unplaced participants (e.g. hard-cap overflow)
 * const result = createSuccessResult(
 *   teams,
 *   overflowParticipants,
 *   MESSAGES.SUCCESS_WITH_UNPLACED,
 * );
 * result.success;  // → true
 * result.unplaced; // → [...overflowParticipants]
 */
export function createSuccessResult(teams, unplaced, message) {
  // Spread into new arrays before freezing so the caller's originals
  // are not frozen as a side-effect
  return Object.freeze({
    success:  true,
    teams:    Object.freeze([...teams]),
    unplaced: Object.freeze([...unplaced]),
    message,
  });
}

/**
 * Creates a frozen {@link TeamResult} representing a **failed** distribution
 * run.
 *
 * Failed results always carry empty frozen `teams` and `unplaced` arrays.
 * The only meaningful fields are `success: false` and `message`.  This
 * factory exists to make the intent crystal-clear at every call site inside
 * the builder and to avoid subtle bugs where a failure result accidentally
 * carries stale team data.
 *
 * @param {string} message - Human-readable error message explaining why the
 *   distribution could not proceed.  Should be one of the canonical
 *   {@link MESSAGES} strings (e.g. `MESSAGES.NO_PARTICIPANTS`).
 * @returns {TeamResult} A frozen TeamResult with `success: false`, empty
 *   `teams` and `unplaced`, and the provided `message`.
 *
 * @example
 * import { createFailureResult } from './TeamResult.js';
 * import { MESSAGES }            from './TeamConfig.js';
 *
 * const result = createFailureResult(MESSAGES.NO_PARTICIPANTS);
 * result.success;         // → false
 * result.message;         // → 'No participants provided'
 * result.teams.length;    // → 0
 * result.unplaced.length; // → 0
 *
 * @example
 * // Attempting to mutate throws — the result is fully frozen
 * result.success = true;       // TypeError: Cannot assign to read only property
 * result.teams.push(someTeam); // TypeError: Cannot add property to frozen array
 */
export function createFailureResult(message) {
  // Always return empty arrays for teams/unplaced on failure — no stale data
  return Object.freeze({
    success:  false,
    teams:    Object.freeze([]),
    unplaced: Object.freeze([]),
    message,
  });
}
