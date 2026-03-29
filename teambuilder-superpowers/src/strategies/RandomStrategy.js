/**
 * RandomStrategy.js
 * Team formation strategy that assigns participants to teams in random order.
 * Uses a Fisher-Yates shuffle so every ordering is equally likely.
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

const { Team } = require('../Team');
const { calculateTeamSizes } = require('../teamSizeCalculator');

class RandomStrategy {
  /**
   * Builds teams by shuffling participants and filling teams sequentially.
   * @param {Participant[]} participants - The full participant list.
   * @param {number} idealSize - Preferred team size.
   * @param {number} minSize - Minimum allowed team size.
   * @param {number} maxSize - Maximum allowed team size.
   * @returns {{ teams: Team[], unplaced: Participant[] }}
   */
  buildTeams(participants, idealSize, minSize, maxSize) {
    const shuffled = this._shuffle([...participants]);
    return this._assignToTeams(shuffled, idealSize, minSize, maxSize);
  }

  /**
   * Fisher-Yates in-place shuffle.
   * @param {Participant[]} arr
   * @returns {Participant[]}
   */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Splits an ordered participant list into Team objects using the calculated sizes.
   * @param {Participant[]} participants - Already-shuffled list.
   * @param {number} idealSize
   * @param {number} minSize
   * @param {number} maxSize
   * @returns {{ teams: Team[], unplaced: Participant[] }}
   */
  _assignToTeams(participants, idealSize, minSize, maxSize) {
    const { teamSizes, unplacedCount } = calculateTeamSizes(
      participants.length, idealSize, minSize, maxSize
    );

    const cutoff = participants.length - unplacedCount;
    const toPlace = participants.slice(0, cutoff);
    const unplaced = participants.slice(cutoff);

    const teams = [];
    let idx = 0;
    for (const size of teamSizes) {
      const team = new Team();
      for (let i = 0; i < size; i++) {
        team.addParticipant(toPlace[idx++]);
      }
      teams.push(team);
    }

    return { teams, unplaced };
  }
}

module.exports = { RandomStrategy };
