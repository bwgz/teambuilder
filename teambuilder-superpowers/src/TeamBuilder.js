/**
 * TeamBuilder.js
 * Orchestrates team formation. Validates all inputs before delegating to
 * the injected strategy. Returns a TeamResult in all cases — never throws
 * for invalid inputs, so callers can always inspect the outcome.
 *
 * Usage:
 *   const builder = new TeamBuilder(new FairStrategy());
 *   builder.setParticipants(participants);
 *   builder.setIdealSize(4);
 *   builder.setMinSize(3);
 *   builder.setMaxSize(5);
 *   const result = builder.build();
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

const { TeamResult } = require('./TeamResult');

class TeamBuilder {
  /**
   * @param {{ buildTeams: Function }} strategy - Any object implementing buildTeams(participants, idealSize, minSize, maxSize).
   */
  constructor(strategy) {
    this._strategy = strategy;
    this._participants = null;
    this._idealSize = null;
    this._minSize = null;
    this._maxSize = null;
  }

  /** @param {Participant[]} participants */
  setParticipants(participants) {
    this._participants = participants;
  }

  /** @param {number} ideal - Preferred number of members per team. */
  setIdealSize(ideal) {
    this._idealSize = ideal;
  }

  /** @param {number} min - Minimum allowed members per team. */
  setMinSize(min) {
    this._minSize = min;
  }

  /** @param {number} max - Maximum allowed members per team. */
  setMaxSize(max) {
    this._maxSize = max;
  }

  /**
   * Validates inputs and builds teams using the configured strategy.
   * All invalid inputs produce a TeamResult with success:false and a
   * descriptive errorMessage — no exceptions are thrown.
   * @returns {TeamResult}
   */
  build() {
    // Validate: participant list must be non-empty
    if (!this._participants || this._participants.length === 0) {
      return new TeamResult(false, [], [], 'Participant list must not be empty.');
    }

    // Validate: team sizes must be at least 1
    if (this._minSize < 1 || this._maxSize < 1) {
      return new TeamResult(false, [], [], 'Minimum and maximum size must be at least 1.');
    }

    // Validate: min cannot exceed max
    if (this._minSize > this._maxSize) {
      return new TeamResult(
        false, [], [],
        'Minimum size cannot be greater than maximum size.'
      );
    }

    // Validate: ideal must be within [min, max]
    if (this._idealSize < this._minSize || this._idealSize > this._maxSize) {
      return new TeamResult(
        false, [], [],
        'Ideal size must be between minimum and maximum size (inclusive).'
      );
    }

    // Delegate team formation to the injected strategy
    const { teams, unplaced } = this._strategy.buildTeams(
      this._participants,
      this._idealSize,
      this._minSize,
      this._maxSize
    );

    // If the strategy could not form any team at all, report total failure
    if (teams.length === 0) {
      return new TeamResult(
        false, [], this._participants,
        'Teams could not be generated with the given constraints.'
      );
    }

    return new TeamResult(true, teams, unplaced, null);
  }
}

module.exports = { TeamBuilder };
