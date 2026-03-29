/**
 * @fileoverview Integration / scenario tests for TeamBuilder.buildTeams.
 *
 * These tests exercise the full pipeline from raw inputs through to a
 * fully-populated TeamResult, matching the scenario table in the
 * implementation plan:
 *
 *   even_split_random       — 12 participants, ideal=4, RANDOM
 *   uneven_split            — 14 participants, min=3, max=5, RANDOM
 *   fair_balanced           — 6 participants, ability [10..5], ideal=3, FAIR
 *   invalid_min_max         — minSize=5, maxSize=3 → failure
 *   invalid_ideal           — idealSize=6, min=2, max=4 → failure
 *   max_teams_cap           — 1000 participants → 100 teams, 800 unplaced
 *   empty_participants      — empty list → failure
 *   not_enough_participants — 2 participants, minSize=3 → failure
 *
 * Plus additional cross-cutting assertions (no duplicates, createTeamBuilder
 * factory, result immutability).
 */

import { describe, it, expect } from 'vitest';
import { TeamBuilder, createTeamBuilder } from '../../src/TeamBuilder.js';
import { Mode, MESSAGES } from '../../src/TeamConfig.js';
import { createParticipant } from '../../src/Participant.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const builder = new TeamBuilder();

const p = (id, name, ability) => createParticipant(id, name, ability);

/** Builds n participants with sequential ids and ability = i. */
const participants = (n) =>
  Array.from({ length: n }, (_, i) =>
    createParticipant(`p${i}`, `Person${i}`, i),
  );

/** Collects all placed participant ids from a result. */
function placedIds(result) {
  const ids = [];
  result.teams.forEach(t => t.getParticipants().forEach(p => ids.push(p.id)));
  return ids;
}

// ── Scenario: even_split_random ───────────────────────────────────────────────

describe('Scenario: even_split_random', () => {
  it('12 participants, ideal=4, RANDOM → 3 teams, 0 unplaced, success=true', () => {
    const r = builder.buildTeams(
      participants(12),
      { idealSize: 4, minSize: 4, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(3);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => expect(t.getMemberCount()).toBe(4));
  });

  it('message is SUCCESS when all participants are placed', () => {
    const r = builder.buildTeams(
      participants(12),
      { idealSize: 4, minSize: 4, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.message).toBe(MESSAGES.SUCCESS);
  });
});

// ── Scenario: uneven_split ────────────────────────────────────────────────────

describe('Scenario: uneven_split', () => {
  it('14 participants, ideal=4, min=3, max=5, RANDOM → all placed, valid sizes', () => {
    const r = builder.buildTeams(
      participants(14),
      { idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(true);
    expect(r.unplaced).toHaveLength(0);
    r.teams.forEach(t => {
      expect(t.getMemberCount()).toBeGreaterThanOrEqual(3);
      expect(t.getMemberCount()).toBeLessThanOrEqual(5);
    });
  });

  it('placed + unplaced === 14', () => {
    const r = builder.buildTeams(
      participants(14),
      { idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM },
    );
    const placed = r.teams.reduce((s, t) => s + t.getMemberCount(), 0);
    expect(placed + r.unplaced.length).toBe(14);
  });
});

// ── Scenario: fair_balanced ───────────────────────────────────────────────────

describe('Scenario: fair_balanced', () => {
  // 6 participants with abilities [10, 9, 8, 7, 6, 5], ideal=3, 2 teams.
  // Expected snake-draft:
  //   Round 0 (even, L→R): 10→t0, 9→t1
  //   Round 1 (odd,  R→L):  8→t1, 7→t0
  //   Round 2 (even, L→R):  6→t0, 5→t1
  // t0=[10,7,6]=23  t1=[9,8,5]=22

  const fairParticipants = [
    p('p1', 'Alice',   10),
    p('p2', 'Bob',      9),
    p('p3', 'Charlie',  8),
    p('p4', 'Dana',     7),
    p('p5', 'Eve',      6),
    p('p6', 'Frank',    5),
  ];

  const fairConfig = { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10, mode: Mode.FAIR };

  it('produces 2 teams with 3 members each', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(2);
    r.teams.forEach(t => expect(t.getMemberCount()).toBe(3));
  });

  it('ability sums differ by at most 1', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    const sums = r.teams.map(t => t.getAbilitySum());
    expect(Math.max(...sums) - Math.min(...sums)).toBeLessThanOrEqual(1);
  });

  it('exact ability sums are 23 and 22', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    const sums = r.teams.map(t => t.getAbilitySum()).sort((a, b) => b - a);
    expect(sums[0]).toBe(23);
    expect(sums[1]).toBe(22);
  });

  it('team 0 contains Alice (ability=10) — first pick of round 0', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    const t0 = r.teams[0].getParticipants();
    expect(t0.some(m => m.id === 'p1')).toBe(true);
  });

  it('team 1 contains Bob (ability=9) — second pick of round 0', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    const t1 = r.teams[1].getParticipants();
    expect(t1.some(m => m.id === 'p2')).toBe(true);
  });

  it('all 6 participant ids are present exactly once', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    const ids = placedIds(r);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });

  it('no unplaced participants', () => {
    const r = builder.buildTeams(fairParticipants, fairConfig);
    expect(r.unplaced).toHaveLength(0);
  });
});

// ── Scenario: invalid_min_max ─────────────────────────────────────────────────

describe('Scenario: invalid_min_max', () => {
  it('minSize=5, maxSize=3 → success=false', () => {
    const r = builder.buildTeams(
      participants(10),
      { idealSize: 4, minSize: 5, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(false);
  });

  it('message matches MESSAGES.MIN_GREATER_THAN_MAX exactly', () => {
    const r = builder.buildTeams(
      participants(10),
      { idealSize: 4, minSize: 5, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.message).toBe(MESSAGES.MIN_GREATER_THAN_MAX);
  });

  it('teams and unplaced are empty on validation failure', () => {
    const r = builder.buildTeams(
      participants(10),
      { idealSize: 4, minSize: 5, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.teams).toHaveLength(0);
    expect(r.unplaced).toHaveLength(0);
  });
});

// ── Scenario: invalid_ideal ───────────────────────────────────────────────────

describe('Scenario: invalid_ideal', () => {
  it('idealSize=6, min=2, max=4 → success=false', () => {
    const r = builder.buildTeams(
      participants(10),
      { idealSize: 6, minSize: 2, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(false);
  });

  it('message matches MESSAGES.IDEAL_OUT_OF_RANGE exactly', () => {
    const r = builder.buildTeams(
      participants(10),
      { idealSize: 6, minSize: 2, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.message).toBe(MESSAGES.IDEAL_OUT_OF_RANGE);
  });
});

// ── Scenario: max_teams_cap ───────────────────────────────────────────────────

describe('Scenario: max_teams_cap', () => {
  it('1000 participants, ideal=2 → exactly 100 teams', () => {
    const r = builder.buildTeams(
      participants(1000),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM },
    );
    expect(r.teams).toHaveLength(100);
  });

  it('1000 participants, ideal=2 → 800 unplaced', () => {
    const r = builder.buildTeams(
      participants(1000),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM },
    );
    expect(r.unplaced).toHaveLength(800);
  });

  it('placed + unplaced = 1000', () => {
    const r = builder.buildTeams(
      participants(1000),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM },
    );
    const placed = r.teams.reduce((s, t) => s + t.getMemberCount(), 0);
    expect(placed + r.unplaced.length).toBe(1000);
  });

  it('success=true despite unplaced participants', () => {
    const r = builder.buildTeams(
      participants(1000),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(true);
  });

  it('message is SUCCESS_WITH_UNPLACED', () => {
    const r = builder.buildTeams(
      participants(1000),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM },
    );
    expect(r.message).toBe(MESSAGES.SUCCESS_WITH_UNPLACED);
  });
});

// ── Scenario: empty_participants ──────────────────────────────────────────────

describe('Scenario: empty_participants', () => {
  it('empty array → success=false', () => {
    const r = builder.buildTeams(
      [],
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NO_PARTICIPANTS);
  });

  it('null → success=false', () => {
    const r = builder.buildTeams(
      null,
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(false);
  });
});

// ── Scenario: not_enough_participants ─────────────────────────────────────────

describe('Scenario: not_enough_participants', () => {
  it('2 participants, minSize=3 → success=false', () => {
    const r = builder.buildTeams(
      participants(2),
      { idealSize: 3, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM },
    );
    expect(r.success).toBe(false);
    expect(r.message).toBe(MESSAGES.NOT_ENOUGH);
  });
});

// ── Cross-cutting: no duplicate participant ids ───────────────────────────────

describe('Cross-cutting: no duplicate participant ids in successful results', () => {
  it('RANDOM: each placed participant id appears exactly once', () => {
    const r = builder.buildTeams(
      participants(15),
      { idealSize: 5, minSize: 4, maxSize: 6, maxTeams: 10, mode: Mode.RANDOM },
    );
    const ids = placedIds(r);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('FAIR: each placed participant id appears exactly once', () => {
    const r = builder.buildTeams(
      participants(15),
      { idealSize: 5, minSize: 4, maxSize: 6, maxTeams: 10, mode: Mode.FAIR },
    );
    const ids = placedIds(r);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a participant cannot appear in both a team and unplaced', () => {
    // Hard cap forces some participants to be unplaced
    const r = builder.buildTeams(
      participants(205),
      { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 100, mode: Mode.RANDOM },
    );
    const placedSet  = new Set(placedIds(r));
    const unplacedSet = new Set(r.unplaced.map(p => p.id));
    const overlap = [...placedSet].filter(id => unplacedSet.has(id));
    expect(overlap).toHaveLength(0);
  });
});

// ── Cross-cutting: createTeamBuilder factory ──────────────────────────────────

describe('createTeamBuilder factory', () => {
  it('returns a TeamBuilder instance', () => {
    const b = createTeamBuilder();
    expect(b).toBeInstanceOf(TeamBuilder);
  });

  it('the returned builder can run buildTeams successfully', () => {
    const b = createTeamBuilder();
    const r = b.buildTeams(
      participants(6),
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.FAIR },
    );
    expect(r.success).toBe(true);
    expect(r.teams).toHaveLength(2);
  });
});

// ── Cross-cutting: TeamResult immutability ────────────────────────────────────

describe('Cross-cutting: returned TeamResult is frozen', () => {
  it('success result is frozen at the top level', () => {
    const r = builder.buildTeams(
      participants(6),
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.RANDOM },
    );
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('teams array is frozen on success result', () => {
    const r = builder.buildTeams(
      participants(6),
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.RANDOM },
    );
    expect(Object.isFrozen(r.teams)).toBe(true);
  });

  it('unplaced array is frozen on success result', () => {
    const r = builder.buildTeams(
      participants(6),
      { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.RANDOM },
    );
    expect(Object.isFrozen(r.unplaced)).toBe(true);
  });

  it('failure result is frozen', () => {
    const r = builder.buildTeams([], {
      idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 5, mode: Mode.RANDOM,
    });
    expect(Object.isFrozen(r)).toBe(true);
  });
});

// ── Cross-cutting: FAIR verify participant ids ────────────────────────────────

describe('Cross-cutting: FAIR teams contain the correct participants (verify IDs)', () => {
  it('every input id appears in the output exactly once (6 participants)', () => {
    const input = [
      p('a1', 'Alice',   10),
      p('a2', 'Bob',      9),
      p('a3', 'Charlie',  8),
      p('a4', 'Dana',     7),
      p('a5', 'Eve',      6),
      p('a6', 'Frank',    5),
    ];
    const r = builder.buildTeams(input, {
      idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10, mode: Mode.FAIR,
    });
    const outputIds = new Set(placedIds(r));
    expect(outputIds.size).toBe(6);
    input.forEach(p => expect(outputIds.has(p.id)).toBe(true));
  });
});
