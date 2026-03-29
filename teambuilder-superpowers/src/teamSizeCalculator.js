/**
 * teamSizeCalculator.js
 * Pure function that computes the number of members per team and how many
 * participants cannot be placed, given total count and size constraints.
 * Shared by RandomStrategy and FairStrategy to avoid duplication.
 *
 * @author TeamBuilder
 * @date 2026-03-27
 */

'use strict';

const MAX_TEAMS = 100;

/**
 * Calculates team size distribution for N participants.
 *
 * @param {number} n - Total number of participants to distribute.
 * @param {number} ideal - Preferred team size.
 * @param {number} min - Minimum allowed team size.
 * @param {number} max - Maximum allowed team size.
 * @returns {{ teamSizes: number[], unplacedCount: number }}
 *   teamSizes: array of sizes for each team that will be created.
 *   unplacedCount: number of participants that could not be assigned.
 */
function calculateTeamSizes(n, ideal, min, max) {
  if (n === 0) {
    return { teamSizes: [], unplacedCount: 0 };
  }

  // Minimum teams needed so no team exceeds max
  const minTeams = Math.ceil(n / max);
  // Maximum teams allowed so no team falls below min (also capped at 100)
  const maxTeams = Math.min(MAX_TEAMS, Math.floor(n / min));

  if (minTeams > maxTeams) {
    // Cannot place all participants within [min, max] constraints.
    // Use as many teams as possible and leave the rest unplaced.
    const numTeams = maxTeams;
    if (numTeams === 0) {
      return { teamSizes: [], unplacedCount: n };
    }

    // Start each team at min, then fill up toward max until participants run out
    const sizes = Array(numTeams).fill(min);
    let remaining = n - numTeams * min;

    for (let i = 0; i < numTeams && remaining > 0; i++) {
      const canAdd = max - min;
      const add = Math.min(canAdd, remaining);
      sizes[i] += add;
      remaining -= add;
    }

    return { teamSizes: sizes, unplacedCount: remaining };
  }

  // Pick the number of teams closest to round(n/ideal), within the valid range
  const targetTeams = Math.max(minTeams, Math.min(maxTeams, Math.round(n / ideal)));
  const baseSize = Math.floor(n / targetTeams);
  const extras = n % targetTeams;

  // extras teams get one extra member to account for the remainder
  const teamSizes = Array.from({ length: targetTeams }, (_, i) =>
    i < extras ? baseSize + 1 : baseSize
  );

  return { teamSizes, unplacedCount: 0 };
}

module.exports = { calculateTeamSizes };
