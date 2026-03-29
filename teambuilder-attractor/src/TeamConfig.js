/**
 * @fileoverview TeamConfig factory, Mode enum, and related constants.
 *
 * A TeamConfig is an immutable value record that controls how
 * {@link TeamBuilder} distributes participants.  All constraint validation
 * (C1–C4) is handled later in the builder pipeline; this module is
 * intentionally free of validation logic and only concerns itself with
 * structure and defaults.
 *
 * @author team-builder
 * @date   2026-03-28
 */

// ─── Mode enum ────────────────────────────────────────────────────────────────

/**
 * Distribution mode controlling how participants are assigned to teams.
 *
 * This object is frozen and intended to be used like a TypeScript `enum`.
 * Only the two values defined here are valid for `TeamConfig.mode`; passing
 * any other string results in undefined behaviour.
 *
 * | Value    | Algorithm | Description                                                          |
 * |----------|-----------|----------------------------------------------------------------------|
 * | `RANDOM` | B         | Fisher-Yates shuffle → sequential bucket fill.                       |
 * | `FAIR`   | C         | Descending-ability sort → snake-draft across teams for balanced sums.|
 *
 * @readonly
 * @enum {string}
 *
 * @property {string} RANDOM - Participants are assigned to teams after a
 *   Fisher-Yates shuffle, producing a uniformly random distribution.
 * @property {string} FAIR   - Participants are sorted descending by `ability`
 *   and then snake-drafted across teams, producing balanced ability totals.
 *
 * @example
 * import { Mode } from './TeamConfig.js';
 * Mode.RANDOM; // → 'RANDOM'
 * Mode.FAIR;   // → 'FAIR'
 */
export const Mode = Object.freeze({
  RANDOM: 'RANDOM',
  FAIR:   'FAIR',
});

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Absolute upper limit on the number of teams that can ever be formed in a
 * single `buildTeams` call.
 *
 * `config.maxTeams` is silently clamped to this value before use:
 * `effectiveCap = Math.min(config.maxTeams, MAX_TEAMS_ABSOLUTE)`.
 * Participants that cannot be placed within this cap are returned in
 * `TeamResult.unplaced`.
 *
 * @type {number}
 */
export const MAX_TEAMS_ABSOLUTE = 100;

/**
 * Canonical message strings used by validation and result construction.
 *
 * All human-readable strings that the library may produce are centralised
 * here so that tests can assert against these constants rather than bare
 * string literals.  A single wording change therefore propagates to every
 * test automatically.
 *
 * | Key                   | When emitted                                          |
 * |-----------------------|-------------------------------------------------------|
 * | `MIN_GREATER_THAN_MAX`| `config.minSize > config.maxSize` (C1)                |
 * | `IDEAL_OUT_OF_RANGE`  | `idealSize` outside `[minSize, maxSize]` (C2)         |
 * | `NO_PARTICIPANTS`     | participants null / undefined / empty (C3)            |
 * | `NOT_ENOUGH`          | `participants.length < config.minSize` (C4)           |
 * | `SUCCESS`             | All participants placed successfully                   |
 * | `SUCCESS_WITH_UNPLACED`| At least one participant could not be placed          |
 *
 * @readonly
 * @enum {string}
 *
 * @property {string} MIN_GREATER_THAN_MAX  - Returned when `config.minSize > config.maxSize` (constraint C1).
 * @property {string} IDEAL_OUT_OF_RANGE    - Returned when `idealSize` falls outside `[minSize, maxSize]` (constraint C2).
 * @property {string} NO_PARTICIPANTS       - Returned when participants array is null / undefined / empty (constraint C3).
 * @property {string} NOT_ENOUGH            - Returned when participant count is less than `minSize` (constraint C4).
 * @property {string} SUCCESS               - Returned on full success with no unplaced participants.
 * @property {string} SUCCESS_WITH_UNPLACED - Returned on success when one or more participants could not be placed.
 */
export const MESSAGES = Object.freeze({
  MIN_GREATER_THAN_MAX:  'Minimum size cannot be greater than maximum size',
  IDEAL_OUT_OF_RANGE:    'Ideal size must be between minimum and maximum size',
  NO_PARTICIPANTS:       'No participants provided',
  NOT_ENOUGH:            'Not enough participants to form a single team',
  SUCCESS:               'Teams formed successfully',
  SUCCESS_WITH_UNPLACED: 'Teams formed with unplaced participants',
});

// ─── Type definitions (JSDoc only) ───────────────────────────────────────────

/**
 * An immutable configuration record that controls how {@link TeamBuilder}
 * sizes and distributes teams.
 *
 * Objects returned by {@link createTeamConfig} are sealed with
 * `Object.freeze`.  Plain object literals matching this shape are also
 * accepted wherever a `TeamConfig` is expected.
 *
 * ### Constraint relationships
 * The builder enforces the following ordering between the size fields:
 * ```
 * minSize ≤ idealSize ≤ maxSize
 * ```
 * Violating this ordering causes `buildTeams` to return a failure result
 * with an explanatory message rather than throwing.
 *
 * @typedef {object} TeamConfig
 * @property {number}           idealSize - Preferred number of participants per
 *   team.  The sizer algorithm targets this size first, growing or shrinking
 *   teams toward `[minSize, maxSize]` only when necessary.
 * @property {number}           minSize   - Minimum acceptable team size.  No
 *   team in the result will have fewer members than this value.
 * @property {number}           maxSize   - Maximum acceptable team size.  No
 *   team in the result will have more members than this value.
 * @property {number}           maxTeams  - Maximum number of teams to form.
 *   The effective cap used internally is
 *   `Math.min(maxTeams, MAX_TEAMS_ABSOLUTE)`.
 * @property {Mode[keyof Mode]} mode      - Distribution mode (`Mode.RANDOM`
 *   or `Mode.FAIR`).
 */

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a new, frozen {@link TeamConfig} object.
 *
 * The returned object is sealed with `Object.freeze` to prevent accidental
 * mutation after creation.  No constraint validation is performed here — that
 * is the responsibility of the builder pipeline (see `validate` inside
 * `TeamBuilder.js`).
 *
 * @param {object}           opts
 * @param {number}           opts.idealSize - Preferred number of participants
 *   per team.  Must satisfy `minSize ≤ idealSize ≤ maxSize` for a successful
 *   build (validated lazily by the builder, not here).
 * @param {number}           opts.minSize   - Minimum acceptable team size.
 * @param {number}           opts.maxSize   - Maximum acceptable team size.
 * @param {number}           opts.maxTeams  - Maximum number of teams to form.
 *   Values above {@link MAX_TEAMS_ABSOLUTE} are silently clamped by the
 *   builder; this factory stores whatever is supplied.
 * @param {Mode[keyof Mode]} opts.mode      - Distribution mode
 *   (`Mode.RANDOM` or `Mode.FAIR`).
 * @returns {TeamConfig} A new, frozen TeamConfig value object.
 *
 * @example
 * import { createTeamConfig, Mode } from './TeamConfig.js';
 *
 * const cfg = createTeamConfig({
 *   idealSize: 4,
 *   minSize:   3,
 *   maxSize:   5,
 *   maxTeams:  10,
 *   mode:      Mode.FAIR,
 * });
 * // cfg is frozen; cfg.idealSize === 4, cfg.mode === 'FAIR'
 *
 * @example
 * // Attempting to mutate throws in strict mode
 * cfg.idealSize = 99; // TypeError: Cannot assign to read only property
 */
export function createTeamConfig({ idealSize, minSize, maxSize, maxTeams, mode }) {
  return Object.freeze({ idealSize, minSize, maxSize, maxTeams, mode });
}
