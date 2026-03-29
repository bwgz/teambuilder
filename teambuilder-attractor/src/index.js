/**
 * @fileoverview Public barrel export for the team-builder library.
 *
 * Consumers should import exclusively from this module.  Internal helpers
 * (e.g. `validate`, `computeSlotSizes`, distribution functions) are
 * intentionally not re-exported; they are implementation details.
 *
 * @module team-builder
 * @author team-builder
 * @date   2026-03-28
 *
 * @example
 * import {
 *   TeamBuilder,
 *   createTeamBuilder,
 *   Team,
 *   createTeamConfig,
 *   createParticipant,
 *   Mode,
 *   MAX_TEAMS_ABSOLUTE,
 *   MESSAGES,
 * } from 'team-builder';
 */

// ─── Participant ──────────────────────────────────────────────────────────────

/**
 * Factory for creating immutable {@link Participant} value objects.
 *
 * @see module:Participant
 */
export { createParticipant } from './Participant.js';

// ─── Team ─────────────────────────────────────────────────────────────────────

/**
 * Read-only team class returned inside every successful {@link TeamResult}.
 *
 * @see module:Team
 */
export { Team } from './Team.js';

// ─── TeamConfig ───────────────────────────────────────────────────────────────

/**
 * Factory for creating immutable {@link TeamConfig} value objects.
 * Also exports the {@link Mode} enum, {@link MAX_TEAMS_ABSOLUTE} constant,
 * and the {@link MESSAGES} constant object used for all result/error strings.
 *
 * @see module:TeamConfig
 */
export { createTeamConfig, Mode, MAX_TEAMS_ABSOLUTE, MESSAGES } from './TeamConfig.js';

// ─── TeamResult ───────────────────────────────────────────────────────────────

/**
 * Factories for constructing {@link TeamResult} value objects.
 * `createSuccessResult` and `createFailureResult` are exported primarily
 * for use in tests and for consumers who extend the library.
 *
 * @see module:TeamResult
 */
export { createSuccessResult, createFailureResult } from './TeamResult.js';

// ─── TeamBuilder ──────────────────────────────────────────────────────────────

/**
 * The main orchestrator class and its convenience factory function.
 * Use {@link createTeamBuilder} to obtain an instance without `new`, or
 * instantiate {@link TeamBuilder} directly for subclassing.
 *
 * @see module:TeamBuilder
 */
export { TeamBuilder, createTeamBuilder } from './TeamBuilder.js';
