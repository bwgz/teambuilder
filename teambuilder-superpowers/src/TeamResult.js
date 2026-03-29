/**
 * TeamResult.js
 * Encapsulates the outcome of a team generation attempt.
 * Returned by TeamBuilder.build() in all cases — success or failure.
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

class TeamResult {
  /**
   * @param {boolean} success - False if teams could not be generated at all.
   * @param {Team[]} teams - The generated teams; empty array when success is false.
   * @param {Participant[]} unplacedParticipants - Participants who could not be assigned to any team.
   * @param {string|null} errorMessage - Human-readable reason for failure; null when success is true.
   */
  constructor(success, teams, unplacedParticipants, errorMessage) {
    this.success = success;
    this.teams = teams;
    this.unplacedParticipants = unplacedParticipants;
    this.errorMessage = errorMessage;
    Object.freeze(this);
  }

  /**
   * Convenience method — returns true if any participants could not be placed.
   * A result can be successful yet still have unplaced participants when
   * constraints make it impossible to accommodate everyone.
   * @returns {boolean}
   */
  hasUnplaced() {
    return this.unplacedParticipants.length > 0;
  }
}

module.exports = { TeamResult };
