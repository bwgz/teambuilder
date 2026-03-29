/**
 * Participant.js
 * Represents a single participant in a team-building event.
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

class Participant {
  /**
   * Creates a Participant.
   * @param {string} name - The participant's display name.
   * @param {number} abilityScore - Numeric skill rating used for fair team balancing.
   */
  constructor(name, abilityScore) {
    this.name = name;
    this.abilityScore = abilityScore;
    Object.freeze(this);
  }
}

module.exports = { Participant };
