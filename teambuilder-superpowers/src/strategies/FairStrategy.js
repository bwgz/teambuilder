/**
 * FairStrategy.js
 * Team formation strategy that balances ability scores across teams using a snake draft.
 * Participants are sorted by abilityScore descending, then distributed in a
 * zigzag pattern so high and low scorers are spread evenly.
 *
 * Snake order example for 3 teams:
 *   Round 0: team 0, 1, 2
 *   Round 1: team 2, 1, 0
 *   Round 2: team 0, 1, 2 ...
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

const { Team } = require('../Team');
const { calculateTeamSizes } = require('../teamSizeCalculator');

class FairStrategy {
  /**
   * Builds teams by distributing participants using a snake draft ordered by abilityScore.
   * @param {Participant[]} participants - The full participant list.
   * @param {number} idealSize - Preferred team size.
   * @param {number} minSize - Minimum allowed team size.
   * @param {number} maxSize - Maximum allowed team size.
   * @returns {{ teams: Team[], unplaced: Participant[] }}
   */
  buildTeams(participants, idealSize, minSize, maxSize) {
    // Sort descending so highest scorers are distributed first
    const sorted = [...participants].sort((a, b) => b.abilityScore - a.abilityScore);

    const { teamSizes, unplacedCount } = calculateTeamSizes(
      sorted.length, idealSize, minSize, maxSize
    );

    const cutoff = sorted.length - unplacedCount;
    const toPlace = sorted.slice(0, cutoff);
    // Lowest scorers are left unplaced when constraints prevent full placement
    const unplaced = sorted.slice(cutoff);

    const numTeams = teamSizes.length;
    if (numTeams === 0) {
      return { teams: [], unplaced: sorted };
    }

    const teams = Array.from({ length: numTeams }, () => new Team());

    // Snake draft: alternate direction each round to balance ability scores
    for (let i = 0; i < toPlace.length; i++) {
      const roundNum = Math.floor(i / numTeams);
      const posInRound = i % numTeams;
      const teamIndex = roundNum % 2 === 0
        ? posInRound
        : numTeams - 1 - posInRound;
      teams[teamIndex].addParticipant(toPlace[i]);
    }

    return { teams, unplaced };
  }
}

module.exports = { FairStrategy };
