# Programming Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a JavaScript team-building library that divides participants into balanced or random teams within configurable size constraints.

**Architecture:** Strategy pattern — `TeamBuilder` validates inputs and delegates to either `RandomStrategy` (Fisher-Yates shuffle) or `FairStrategy` (snake draft by ability score). A shared `teamSizeCalculator` pure function handles the team-size math used by both strategies. All results are returned as `TeamResult` objects; no exceptions are thrown for bad inputs.

**Tech Stack:** Node.js, CommonJS modules (`require`/`module.exports`), Jest 29

---

## File Map

| File | Responsibility |
| --- | --- |
| `example-02/package.json` | npm config, Jest setup |
| `example-02/src/Participant.js` | Data class: name + abilityScore |
| `example-02/src/Team.js` | Data class: participant list with getSize/getParticipants/getSkillSum |
| `example-02/src/TeamResult.js` | Result object: success, teams, unplaced, errorMessage |
| `example-02/src/teamSizeCalculator.js` | Pure function: computes team size distribution given N, ideal, min, max |
| `example-02/src/strategies/RandomStrategy.js` | Shuffles participants, delegates sizing to calculator |
| `example-02/src/strategies/FairStrategy.js` | Snake-drafts by abilityScore, delegates sizing to calculator |
| `example-02/src/TeamBuilder.js` | Validates inputs, calls strategy, returns TeamResult |
| `example-02/tests/Participant.test.js` | Unit tests for Participant |
| `example-02/tests/Team.test.js` | Unit tests for Team |
| `example-02/tests/TeamResult.test.js` | Unit tests for TeamResult |
| `example-02/tests/teamSizeCalculator.test.js` | Unit tests for size calculation logic |
| `example-02/tests/strategies/RandomStrategy.test.js` | Unit tests for RandomStrategy |
| `example-02/tests/strategies/FairStrategy.test.js` | Unit tests for FairStrategy |
| `example-02/tests/TeamBuilder.test.js` | Integration tests for all 9 spec requirements |

---

## Task 1: Project Setup

**Files:**

- Create: `example-02/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "teambuilder",
  "version": "1.0.0",
  "description": "Team building application - Programming Assessment",
  "main": "src/TeamBuilder.js",
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "testMatch": ["**/tests/**/*.test.js"]
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run from `example-02/`:
```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 3: Create folder structure**

```bash
mkdir -p example-02/src/strategies
mkdir -p example-02/tests/strategies
```

- [ ] **Step 4: Verify Jest runs (no tests yet)**

```bash
cd example-02 && npx jest
```

Expected output contains: `No tests found`

- [ ] **Step 5: Commit**

```bash
git add example-02/package.json example-02/package-lock.json
git commit -m "chore: initialize example-02 project with Jest"
```

---

## Task 2: Participant Class

**Files:**

- Create: `example-02/src/Participant.js`
- Create: `example-02/tests/Participant.test.js`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/Participant.test.js`:

```js
'use strict';

const { Participant } = require('../src/Participant');

describe('Participant', () => {
  test('stores name and abilityScore', () => {
    const p = new Participant('Alice', 85);
    expect(p.name).toBe('Alice');
    expect(p.abilityScore).toBe(85);
  });

  test('accepts a score of 0', () => {
    const p = new Participant('Bob', 0);
    expect(p.abilityScore).toBe(0);
  });

  test('accepts a negative score', () => {
    const p = new Participant('Carol', -10);
    expect(p.abilityScore).toBe(-10);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/Participant.test.js
```

Expected: FAIL — `Cannot find module '../src/Participant'`

- [ ] **Step 3: Implement Participant**

Create `example-02/src/Participant.js`:

```js
/**
 * Participant.js
 * Represents a single participant in a team-building event.
 *
 * @author [your name]
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
  }
}

module.exports = { Participant };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/Participant.test.js
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/Participant.js example-02/tests/Participant.test.js
git commit -m "feat: add Participant class with name and abilityScore"
```

---

## Task 3: Team Class

**Files:**

- Create: `example-02/src/Team.js`
- Create: `example-02/tests/Team.test.js`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/Team.test.js`:

```js
/**
 * Team.test.js
 * Tests for the Team class — verifies size, skill sum, and encapsulation of participants.
 */

'use strict';

const { Team } = require('../src/Team');
const { Participant } = require('../src/Participant');

describe('Team', () => {
  test('starts empty with size 0 and skill sum 0', () => {
    const team = new Team();
    expect(team.getSize()).toBe(0);
    expect(team.getParticipants()).toEqual([]);
    expect(team.getSkillSum()).toBe(0);
  });

  test('getSize returns the number of added participants', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));
    team.addParticipant(new Participant('Bob', 60));
    expect(team.getSize()).toBe(2);
  });

  test('getSkillSum sums the abilityScore of all members', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));
    team.addParticipant(new Participant('Bob', 60));
    expect(team.getSkillSum()).toBe(140);
  });

  test('getParticipants returns a copy, not the internal array', () => {
    const team = new Team();
    team.addParticipant(new Participant('Alice', 80));

    // Mutating the returned array must not affect the team's internal state
    const participants = team.getParticipants();
    participants.push(new Participant('Intruder', 999));

    expect(team.getSize()).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/Team.test.js
```

Expected: FAIL — `Cannot find module '../src/Team'`

- [ ] **Step 3: Implement Team**

Create `example-02/src/Team.js`:

```js
/**
 * Team.js
 * Represents a group of participants assigned to the same team.
 * Encapsulates the participant list — external code reads through
 * getParticipants() to prevent direct mutation.
 *
 * @author [your name]
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/Team.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/Team.js example-02/tests/Team.test.js
git commit -m "feat: add Team class with encapsulated participant list"
```

---

## Task 4: TeamResult Class

**Files:**

- Create: `example-02/src/TeamResult.js`
- Create: `example-02/tests/TeamResult.test.js`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/TeamResult.test.js`:

```js
/**
 * TeamResult.test.js
 * Tests the result object returned by TeamBuilder.build().
 */

'use strict';

const { TeamResult } = require('../src/TeamResult');
const { Participant } = require('../src/Participant');

describe('TeamResult', () => {
  test('success result has success:true and null errorMessage', () => {
    const result = new TeamResult(true, [], [], null);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBeNull();
  });

  test('failure result has success:false and a non-empty errorMessage', () => {
    const result = new TeamResult(false, [], [], 'Something went wrong');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Something went wrong');
  });

  test('hasUnplaced returns false when unplacedParticipants is empty', () => {
    const result = new TeamResult(true, [], [], null);
    expect(result.hasUnplaced()).toBe(false);
  });

  test('hasUnplaced returns true when there are unplaced participants', () => {
    const unplaced = [new Participant('Alice', 80)];
    const result = new TeamResult(true, [], unplaced, null);
    expect(result.hasUnplaced()).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/TeamResult.test.js
```

Expected: FAIL — `Cannot find module '../src/TeamResult'`

- [ ] **Step 3: Implement TeamResult**

Create `example-02/src/TeamResult.js`:

```js
/**
 * TeamResult.js
 * Encapsulates the outcome of a team generation attempt.
 * Returned by TeamBuilder.build() in all cases — success or failure.
 *
 * @author [your name]
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/TeamResult.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/TeamResult.js example-02/tests/TeamResult.test.js
git commit -m "feat: add TeamResult class to encapsulate build outcomes"
```

---

## Task 5: Team Size Calculator

**Files:**

- Create: `example-02/src/teamSizeCalculator.js`
- Create: `example-02/tests/teamSizeCalculator.test.js`

This pure function is the core sizing logic shared by both strategies. It takes N participants and returns how many members each team should have, plus how many participants cannot be placed.

**Algorithm:**

1. Compute valid `numTeams` range: `minTeams = ceil(N/max)`, `maxTeams = min(100, floor(N/min))`
2. If `minTeams > maxTeams`: no configuration fits everyone. Use `maxTeams` teams, fill each to `max`, leave remainder as unplaced.
3. Otherwise: clamp `round(N/ideal)` to `[minTeams, maxTeams]` to get `targetTeams`. Divide N across `targetTeams` — `extras` teams get `baseSize+1`, the rest get `baseSize`.

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/teamSizeCalculator.test.js`:

```js
/**
 * teamSizeCalculator.test.js
 * Tests the pure function that computes team size distributions.
 */

'use strict';

const { calculateTeamSizes } = require('../src/teamSizeCalculator');

describe('calculateTeamSizes', () => {
  test('returns empty when n is 0', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(0, 3, 2, 4);
    expect(teamSizes).toEqual([]);
    expect(unplacedCount).toBe(0);
  });

  test('creates teams of ideal size when n divides evenly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(9, 3, 2, 4);
    expect(teamSizes).toEqual([3, 3, 3]);
    expect(unplacedCount).toBe(0);
  });

  test('all team sizes are within [min, max] when n does not divide evenly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(10, 3, 2, 4);
    const total = teamSizes.reduce((a, b) => a + b, 0);
    expect(total + unplacedCount).toBe(10);
    teamSizes.forEach(size => {
      expect(size).toBeGreaterThanOrEqual(2);
      expect(size).toBeLessThanOrEqual(4);
    });
  });

  test('caps at 100 teams and leaves overflow as unplaced', () => {
    // ideal=1, min=1, max=1 wants 500 teams but is capped at 100
    const { teamSizes, unplacedCount } = calculateTeamSizes(500, 1, 1, 1);
    expect(teamSizes.length).toBe(100);
    expect(unplacedCount).toBe(400);
  });

  test('places unplaced when constraints prevent full placement', () => {
    // 7 participants, min=4, max=5: minTeams=ceil(7/5)=2, maxTeams=floor(7/4)=1
    // minTeams > maxTeams, so use 1 team of size 5, 2 unplaced
    const { teamSizes, unplacedCount } = calculateTeamSizes(7, 4, 4, 5);
    expect(teamSizes).toEqual([5]);
    expect(unplacedCount).toBe(2);
  });

  test('returns unplacedCount=0 when all participants fit exactly', () => {
    const { teamSizes, unplacedCount } = calculateTeamSizes(12, 4, 3, 5);
    expect(unplacedCount).toBe(0);
    const total = teamSizes.reduce((a, b) => a + b, 0);
    expect(total).toBe(12);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/teamSizeCalculator.test.js
```

Expected: FAIL — `Cannot find module '../src/teamSizeCalculator'`

- [ ] **Step 3: Implement teamSizeCalculator**

Create `example-02/src/teamSizeCalculator.js`:

```js
/**
 * teamSizeCalculator.js
 * Pure function that computes the number of members per team and how many
 * participants cannot be placed, given total count and size constraints.
 * Shared by RandomStrategy and FairStrategy to avoid duplication.
 *
 * @author [your name]
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/teamSizeCalculator.test.js
```

Expected: PASS — 6 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/teamSizeCalculator.js example-02/tests/teamSizeCalculator.test.js
git commit -m "feat: add teamSizeCalculator for shared team size distribution logic"
```

---

## Task 6: RandomStrategy

**Files:**

- Create: `example-02/src/strategies/RandomStrategy.js`
- Create: `example-02/tests/strategies/RandomStrategy.test.js`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/strategies/RandomStrategy.test.js`:

```js
/**
 * RandomStrategy.test.js
 * Tests random team formation — verifies placement, sizes, and unplaced handling.
 */

'use strict';

const { RandomStrategy } = require('../../src/strategies/RandomStrategy');
const { Participant } = require('../../src/Participant');

/** Helper: create N participants with increasing abilityScore */
const makeParticipants = (count) =>
  Array.from({ length: count }, (_, i) => new Participant(`P${i}`, i * 10));

describe('RandomStrategy', () => {
  test('places all participants when count divides evenly by ideal', () => {
    const strategy = new RandomStrategy();
    const { teams, unplaced } = strategy.buildTeams(makeParticipants(9), 3, 2, 4);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0);
    expect(total).toBe(9);
    expect(unplaced).toHaveLength(0);
    expect(teams).toHaveLength(3);
  });

  test('all team sizes stay within [min, max]', () => {
    const strategy = new RandomStrategy();
    const { teams } = strategy.buildTeams(makeParticipants(11), 4, 3, 5);
    teams.forEach(team => {
      expect(team.getSize()).toBeGreaterThanOrEqual(3);
      expect(team.getSize()).toBeLessThanOrEqual(5);
    });
  });

  test('accounts for all participants across teams and unplaced', () => {
    const strategy = new RandomStrategy();
    const participants = makeParticipants(7);
    const { teams, unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0) + unplaced.length;
    expect(total).toBe(7);
  });

  test('returns unplaced participants when constraints prevent full placement', () => {
    const strategy = new RandomStrategy();
    const { unplaced } = strategy.buildTeams(makeParticipants(7), 4, 4, 5);
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(unplaced.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/strategies/RandomStrategy.test.js
```

Expected: FAIL — `Cannot find module '../../src/strategies/RandomStrategy'`

- [ ] **Step 3: Implement RandomStrategy**

Create `example-02/src/strategies/RandomStrategy.js`:

```js
/**
 * RandomStrategy.js
 * Team formation strategy that assigns participants to teams in random order.
 * Uses a Fisher-Yates shuffle so every ordering is equally likely.
 *
 * @author [your name]
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/strategies/RandomStrategy.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/strategies/RandomStrategy.js example-02/tests/strategies/RandomStrategy.test.js
git commit -m "feat: add RandomStrategy using Fisher-Yates shuffle"
```

---

## Task 7: FairStrategy

**Files:**

- Create: `example-02/src/strategies/FairStrategy.js`
- Create: `example-02/tests/strategies/FairStrategy.test.js`

Snake draft order: sort participants descending by `abilityScore`, then assign indices like:
- Round 0 (even): teams 0, 1, 2, … numTeams-1
- Round 1 (odd): teams numTeams-1, … 1, 0
- Round 2 (even): teams 0, 1, 2, … etc.

Formula: `roundNum = floor(i / numTeams)`, `posInRound = i % numTeams`, `teamIndex = (roundNum % 2 === 0) ? posInRound : numTeams - 1 - posInRound`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/strategies/FairStrategy.test.js`:

```js
/**
 * FairStrategy.test.js
 * Tests ability-balanced team formation via snake draft.
 */

'use strict';

const { FairStrategy } = require('../../src/strategies/FairStrategy');
const { Participant } = require('../../src/Participant');

describe('FairStrategy', () => {
  test('places all participants when count divides evenly by ideal', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 6 }, (_, i) =>
      new Participant(`P${i}`, i * 10)
    );
    const { teams, unplaced } = strategy.buildTeams(participants, 2, 2, 3);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0);
    expect(total).toBe(6);
    expect(unplaced).toHaveLength(0);
  });

  test('snake draft assigns the highest-scoring participant to team 0 first', () => {
    const strategy = new FairStrategy();
    const participants = [
      new Participant('Low', 10),
      new Participant('High', 100),
      new Participant('Mid', 50),
      new Participant('Mid2', 40),
    ];
    const { teams } = strategy.buildTeams(participants, 2, 2, 2);
    // After sort desc: [100, 50, 40, 10]
    // Round 0: team0 gets 100, team1 gets 50
    // Round 1: team1 gets 40, team0 gets 10
    expect(teams[0].getParticipants().some(p => p.abilityScore === 100)).toBe(true);
  });

  test('skill sums are balanced across teams', () => {
    const strategy = new FairStrategy();
    const participants = [
      new Participant('A', 100),
      new Participant('B', 90),
      new Participant('C', 80),
      new Participant('D', 70),
      new Participant('E', 60),
      new Participant('F', 50),
    ];
    // Snake: team0=[100,70,60]=230, team1=[90,80,50]=220
    const { teams } = strategy.buildTeams(participants, 3, 2, 4);
    expect(teams).toHaveLength(2);
    const sums = teams.map(t => t.getSkillSum());
    const diff = Math.abs(sums[0] - sums[1]);
    expect(diff).toBeLessThan(50);
  });

  test('accounts for all participants across teams and unplaced', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 7 }, (_, i) =>
      new Participant(`P${i}`, i)
    );
    const { teams, unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    const total = teams.reduce((sum, t) => sum + t.getSize(), 0) + unplaced.length;
    expect(total).toBe(7);
  });

  test('returns unplaced participants when constraints prevent full placement', () => {
    const strategy = new FairStrategy();
    const participants = Array.from({ length: 7 }, (_, i) =>
      new Participant(`P${i}`, i)
    );
    const { unplaced } = strategy.buildTeams(participants, 4, 4, 5);
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(unplaced.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/strategies/FairStrategy.test.js
```

Expected: FAIL — `Cannot find module '../../src/strategies/FairStrategy'`

- [ ] **Step 3: Implement FairStrategy**

Create `example-02/src/strategies/FairStrategy.js`:

```js
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
 * @author [your name]
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/strategies/FairStrategy.test.js
```

Expected: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add example-02/src/strategies/FairStrategy.js example-02/tests/strategies/FairStrategy.test.js
git commit -m "feat: add FairStrategy using snake draft by abilityScore"
```

---

## Task 8: TeamBuilder

**Files:**

- Create: `example-02/src/TeamBuilder.js`
- Create: `example-02/tests/TeamBuilder.test.js`

- [ ] **Step 1: Write the failing tests**

Create `example-02/tests/TeamBuilder.test.js`:

```js
/**
 * TeamBuilder.test.js
 * Integration tests covering all 9 functional requirements from the spec:
 * 1. Accepts participants list
 * 2. Accepts ideal/min/max size options
 * 3. Supports random and fair modes
 * 4. Gracefully handles min > max
 * 5. Gracefully handles ideal outside [min, max]
 * 6. Does not create more than 100 teams
 * 7. Returns list of teams made up of participants
 * 8. Indicates if teams could not be generated (success: false)
 * 9. Indicates if some participants could not be placed (hasUnplaced)
 */

'use strict';

const { TeamBuilder } = require('../src/TeamBuilder');
const { RandomStrategy } = require('../src/strategies/RandomStrategy');
const { FairStrategy } = require('../src/strategies/FairStrategy');
const { Participant } = require('../src/Participant');

/** Helper: create N participants with sequential names and scores */
const makeParticipants = (count) =>
  Array.from({ length: count }, (_, i) => new Participant(`P${i}`, i * 10));

describe('TeamBuilder', () => {
  // Requirement 8: indicate if teams could not be generated
  test('returns failure when participants list is null', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(null);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
    expect(result.teams).toHaveLength(0);
  });

  test('returns failure when participants list is empty', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants([]);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  // Requirement 4: gracefully handle min > max
  test('returns failure when min > max', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(5);
    builder.setMaxSize(3);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/minimum.*maximum|min.*max/i);
  });

  // Requirement 5: gracefully handle ideal outside [min, max]
  test('returns failure when ideal < min', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(1);
    builder.setMinSize(3);
    builder.setMaxSize(5);
    const result = builder.build();
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  test('returns failure when ideal > max', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(10);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(false);
  });

  // Requirement 7: returns list of teams made up of participants
  test('returns teams containing the original participants', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    const participants = makeParticipants(6);
    builder.setParticipants(participants);
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    const names = result.teams.flatMap(t => t.getParticipants().map(p => p.name));
    expect(names.sort()).toEqual(participants.map(p => p.name).sort());
  });

  // Requirement 6: no more than 100 teams
  test('does not create more than 100 teams', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(500));
    builder.setIdealSize(1);
    builder.setMinSize(1);
    builder.setMaxSize(1);
    const result = builder.build();
    expect(result.teams.length).toBeLessThanOrEqual(100);
    expect(result.teams.length).toBe(100);
  });

  // Requirement 9: indicate if some participants could not be placed
  test('reports unplaced participants when constraints prevent full placement', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(7));
    builder.setIdealSize(4);
    builder.setMinSize(4);
    builder.setMaxSize(5);
    const result = builder.build();
    // 7 participants, min=4, max=5: 1 team of 5, 2 unplaced
    expect(result.success).toBe(true);
    expect(result.hasUnplaced()).toBe(true);
    expect(result.unplacedParticipants).toHaveLength(2);
    const total = result.teams.reduce((s, t) => s + t.getSize(), 0)
      + result.unplacedParticipants.length;
    expect(total).toBe(7);
  });

  // Requirement 3: supports both modes
  test('works with RandomStrategy', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(2);
  });

  test('works with FairStrategy', () => {
    const builder = new TeamBuilder(new FairStrategy());
    builder.setParticipants(makeParticipants(6));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(2);
  });

  // Requirement 1 + 2: ideal placement when all participants fit
  test('places all participants when count divides evenly by ideal', () => {
    const builder = new TeamBuilder(new RandomStrategy());
    builder.setParticipants(makeParticipants(9));
    builder.setIdealSize(3);
    builder.setMinSize(2);
    builder.setMaxSize(4);
    const result = builder.build();
    expect(result.success).toBe(true);
    expect(result.hasUnplaced()).toBe(false);
    const total = result.teams.reduce((s, t) => s + t.getSize(), 0);
    expect(total).toBe(9);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd example-02 && npx jest tests/TeamBuilder.test.js
```

Expected: FAIL — `Cannot find module '../src/TeamBuilder'`

- [ ] **Step 3: Implement TeamBuilder**

Create `example-02/src/TeamBuilder.js`:

```js
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
 * @author [your name]
 * @date 2026-03-27
 */

'use strict';

const { TeamResult } = require('./TeamResult');

const MAX_TEAMS = 100;

class TeamBuilder {
  /**
   * @param {RandomStrategy|FairStrategy} strategy - The team formation strategy to use.
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd example-02 && npx jest tests/TeamBuilder.test.js
```

Expected: PASS — 11 tests passed

- [ ] **Step 5: Run the full test suite**

```bash
cd example-02 && npx jest
```

Expected: PASS — all tests across all files pass

- [ ] **Step 6: Commit**

```bash
git add example-02/src/TeamBuilder.js example-02/tests/TeamBuilder.test.js
git commit -m "feat: add TeamBuilder with validation and strategy delegation"
```
