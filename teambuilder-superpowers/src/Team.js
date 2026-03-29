/**
 * Team.js
 * Represents a group of participants assigned to the same team.
 * Encapsulates the participant list — external code reads through
 * getParticipants() to prevent direct mutation.
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

class Team {
  constructor() {
    // Private participant list — access via public methods only
    this._participants = [];
  }

  /**
   * Adds a participant to this team.
   * @param {Participant} participant
   */
  addParticipant(participant) {
    this._participants.push(participant);
  }

  /**
   * Returns the number of members on this team.
   * @returns {number}
   */
  getSize() {
    return this._participants.length;
  }

  /**
   * Returns a copy of the participants array.
   * Callers cannot mutate the team's internal state through this reference.
   * @returns {Participant[]}
   */
  getParticipants() {
    return [...this._participants];
  }

  /**
   * Returns the sum of all participants' abilityScore values.
   * Used to evaluate how balanced a team is.
   * @returns {number}
   */
  getSkillSum() {
    return this._participants.reduce((sum, p) => sum + p.abilityScore, 0);
  }
}

module.exports = { Team };
