# TeamBuilder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a JavaScript library that divides event participants into balanced teams using pluggable allocation strategies.

**Architecture:** Strategy pattern — `TeamBuilder` accepts a `TeamConfig` and a `TeamBuildStrategy` instance; the strategy's `distribute()` method handles participant allocation; `TeamBuilder.buildTeams()` validates inputs and wraps results in `TeamBuildResult`.

**Tech Stack:** Node.js, ES Modules (`"type": "module"`), Jest 29 with `--experimental-vm-modules` for ESM support.

---

## File Map

| File | Responsibility |
|------|----------------|
| `package.json` | npm config, Jest ESM setup |
| `jest.config.js` | Jest test environment |
| `src/Participant.js` | Data class: id, name, abilityScore |
| `src/Team.js` | Team container: holds participants, exposes size/skillSum |
| `src/TeamConfig.js` | Config with constraint validation |
| `src/TeamBuildResult.js` | Result object returned by buildTeams() |
| `src/strategies/TeamBuildStrategy.js` | Abstract base strategy |
| `src/strategies/RandomStrategy.js` | Fisher-Yates shuffle then round-robin fill |
| `src/strategies/FairnessStrategy.js` | Sort by score then snake draft |
| `src/utils/sizeResolution.js` | Shared algorithm: determine team count |
| `src/TeamBuilder.js` | Orchestrator: validate, delegate, wrap result |
| `test/Participant.test.js` | Tests for Participant |
| `test/Team.test.js` | Tests for Team |
| `test/TeamConfig.test.js` | Tests for TeamConfig validation |
| `test/sizeResolution.test.js` | Tests for size resolution algorithm |
| `test/TeamBuilder.test.js` | Integration tests for both strategies |

---

### Task 1: Project Setup

**Files:**

- Create: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "teambuilder",
  "version": "1.0.0",
  "description": "General-purpose team building library",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

- [ ] **Step 2: Create jest.config.js**

```js
export default {
  testEnvironment: 'node',
};
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Verify Jest runs**

Run: `npm test`

Expected: output contains "No tests found" or "Test Suites: 0 passed".

- [ ] **Step 5: Commit**

```bash
git add package.json jest.config.js package-lock.json
git commit -m "chore: initialize project with ESM and Jest"
```

---

### Task 2: Participant Class

**Files:**

- Create: `src/Participant.js`
- Create: `test/Participant.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/Participant.test.js`:

```js
/**
 * @file Participant.test.js
 * @description Tests for the Participant data class.
 */
import { Participant } from '../src/Participant.js';

describe('Participant', () => {
  test('stores and returns id, name, and abilityScore', () => {
    const p = new Participant('p1', 'Alice', 8.5);
    expect(p.getId()).toBe('p1');
    expect(p.getName()).toBe('Alice');
    expect(p.getAbilityScore()).toBe(8.5);
  });

  test('accepts an abilityScore of 0', () => {
    const p = new Participant('p2', 'Bob', 0);
    expect(p.getAbilityScore()).toBe(0);
  });

  test('accepts a negative abilityScore', () => {
    const p = new Participant('p3', 'Carol', -2);
    expect(p.getAbilityScore()).toBe(-2);
  });

  test('throws if abilityScore is NaN', () => {
    expect(() => new Participant('p4', 'Dave', NaN)).toThrow(
      'abilityScore must be a finite number'
    );
  });

  test('throws if abilityScore is Infinity', () => {
    expect(() => new Participant('p5', 'Eve', Infinity)).toThrow(
      'abilityScore must be a finite number'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=Participant`

Expected: FAIL — `Cannot find module '../src/Participant.js'`

- [ ] **Step 3: Implement Participant**

Create `src/Participant.js`:

```js
/**
 * @file Participant.js
 * @description Data class representing a single event participant.
 * Each participant has an identity and an ability score used for team balancing.
 */

export class Participant {
  #id;
  #name;
  #abilityScore;

  /**
   * @param {string|number} id - Unique identifier for the participant.
   * @param {string} name - Display name of the participant.
   * @param {number} abilityScore - Numeric skill rating; must be a finite number.
   * @throws {Error} If abilityScore is not a finite number.
   */
  constructor(id, name, abilityScore) {
    if (!Number.isFinite(abilityScore)) {
      throw new Error(`abilityScore must be a finite number, got: ${abilityScore}`);
    }
    this.#id = id;
    this.#name = name;
    this.#abilityScore = abilityScore;
  }

  /** @returns {string|number} The participant's unique id. */
  getId() { return this.#id; }

  /** @returns {string} The participant's name. */
  getName() { return this.#name; }

  /** @returns {number} The participant's ability score. */
  getAbilityScore() { return this.#abilityScore; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=Participant`

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/Participant.js test/Participant.test.js
git commit -m "feat: add Participant data class with validation"
```

---

### Task 3: Team Class

**Files:**

- Create: `src/Team.js`
- Create: `test/Team.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/Team.test.js`:

```js
/**
 * @file Team.test.js
 * @description Tests for the Team container class.
 */
import { Team } from '../src/Team.js';
import { Participant } from '../src/Participant.js';

describe('Team', () => {
  let team;

  beforeEach(() => {
    team = new Team();
  });

  test('starts with size 0', () => {
    expect(team.size()).toBe(0);
  });

  test('returns empty array of participants initially', () => {
    expect(team.getParticipants()).toEqual([]);
  });

  test('skillSum is 0 with no participants', () => {
    expect(team.skillSum()).toBe(0);
  });

  test('adds a participant and reflects in size', () => {
    team.addParticipant(new Participant('p1', 'Alice', 5));
    expect(team.size()).toBe(1);
  });

  test('getParticipants returns added participants', () => {
    const alice = new Participant('p1', 'Alice', 5);
    team.addParticipant(alice);
    expect(team.getParticipants()).toEqual([alice]);
  });

  test('getParticipants returns a copy, not the internal array', () => {
    team.addParticipant(new Participant('p1', 'Alice', 5));
    const result = team.getParticipants();
    result.push(new Participant('p2', 'Bob', 3));
    // Internal array should still have only 1 member
    expect(team.size()).toBe(1);
  });

  test('skillSum sums abilityScores of all participants', () => {
    team.addParticipant(new Participant('p1', 'Alice', 5));
    team.addParticipant(new Participant('p2', 'Bob', 3));
    team.addParticipant(new Participant('p3', 'Carol', 7));
    expect(team.skillSum()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=Team.test`

Expected: FAIL — `Cannot find module '../src/Team.js'`

- [ ] **Step 3: Implement Team**

Create `src/Team.js`:

```js
/**
 * @file Team.js
 * @description Represents a single team containing a list of participants.
 * Provides access to team size, participant list, and cumulative skill score.
 */

export class Team {
  #participants;

  constructor() {
    this.#participants = [];
  }

  /**
   * Adds a participant to this team.
   * @param {import('./Participant.js').Participant} participant
   */
  addParticipant(participant) {
    this.#participants.push(participant);
  }

  /** @returns {number} The number of participants on this team. */
  size() {
    return this.#participants.length;
  }

  /**
   * Returns a shallow copy of the participants array.
   * Callers cannot mutate the team's internal list.
   * @returns {import('./Participant.js').Participant[]}
   */
  getParticipants() {
    return [...this.#participants];
  }

  /**
   * Returns the sum of all participants' ability scores.
   * Used to assess overall team strength.
   * @returns {number}
   */
  skillSum() {
    return this.#participants.reduce((sum, p) => sum + p.getAbilityScore(), 0);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=Team.test`

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/Team.js test/Team.test.js
git commit -m "feat: add Team container class"
```

---

### Task 4: TeamConfig Class

**Files:**

- Create: `src/TeamConfig.js`
- Create: `test/TeamConfig.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/TeamConfig.test.js`:

```js
/**
 * @file TeamConfig.test.js
 * @description Tests for TeamConfig validation and accessors.
 */
import { TeamConfig } from '../src/TeamConfig.js';

describe('TeamConfig', () => {
  test('stores valid config and exposes getters', () => {
    const config = new TeamConfig({ ideal: 4, min: 3, max: 5 });
    expect(config.getIdeal()).toBe(4);
    expect(config.getMin()).toBe(3);
    expect(config.getMax()).toBe(5);
    expect(config.getMaxTeams()).toBe(100);
  });

  test('accepts custom maxTeams', () => {
    const config = new TeamConfig({ ideal: 4, min: 3, max: 5, maxTeams: 50 });
    expect(config.getMaxTeams()).toBe(50);
  });

  test('throws if min is greater than max', () => {
    expect(() => new TeamConfig({ ideal: 3, min: 5, max: 3 })).toThrow(
      'min (5) cannot be greater than max (3)'
    );
  });

  test('throws if ideal is less than min', () => {
    expect(() => new TeamConfig({ ideal: 2, min: 3, max: 5 })).toThrow(
      'ideal (2) must be between min (3) and max (5)'
    );
  });

  test('throws if ideal is greater than max', () => {
    expect(() => new TeamConfig({ ideal: 6, min: 3, max: 5 })).toThrow(
      'ideal (6) must be between min (3) and max (5)'
    );
  });

  test('throws if any size is 0 or negative', () => {
    expect(() => new TeamConfig({ ideal: 1, min: 0, max: 3 })).toThrow(
      'Team sizes must be greater than 0'
    );
  });

  test('throws if maxTeams is 0 or negative', () => {
    expect(() => new TeamConfig({ ideal: 3, min: 2, max: 4, maxTeams: 0 })).toThrow(
      'maxTeams must be greater than 0'
    );
  });

  test('allows ideal equal to min', () => {
    const config = new TeamConfig({ ideal: 3, min: 3, max: 5 });
    expect(config.getIdeal()).toBe(3);
  });

  test('allows ideal equal to max', () => {
    const config = new TeamConfig({ ideal: 5, min: 3, max: 5 });
    expect(config.getIdeal()).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=TeamConfig`

Expected: FAIL — `Cannot find module '../src/TeamConfig.js'`

- [ ] **Step 3: Implement TeamConfig**

Create `src/TeamConfig.js`:

```js
/**
 * @file TeamConfig.js
 * @description Configuration for team formation. Validates size constraints
 * at construction time so invalid configs fail fast before any processing occurs.
 */

const DEFAULT_MAX_TEAMS = 100;

export class TeamConfig {
  #ideal;
  #min;
  #max;
  #maxTeams;

  /**
   * @param {object} options
   * @param {number} options.ideal - Target team size.
   * @param {number} options.min - Minimum allowed team size.
   * @param {number} options.max - Maximum allowed team size.
   * @param {number} [options.maxTeams=100] - Maximum number of teams allowed per event.
   * @throws {Error} If any size constraint is violated.
   */
  constructor({ ideal, min, max, maxTeams = DEFAULT_MAX_TEAMS }) {
    if (min <= 0 || max <= 0 || ideal <= 0) {
      throw new Error('Team sizes must be greater than 0');
    }
    if (maxTeams <= 0) {
      throw new Error('maxTeams must be greater than 0');
    }
    if (min > max) {
      throw new Error(`min (${min}) cannot be greater than max (${max})`);
    }
    if (ideal < min || ideal > max) {
      throw new Error(`ideal (${ideal}) must be between min (${min}) and max (${max})`);
    }
    this.#ideal = ideal;
    this.#min = min;
    this.#max = max;
    this.#maxTeams = maxTeams;
  }

  /** @returns {number} The target team size. */
  getIdeal() { return this.#ideal; }

  /** @returns {number} The minimum allowed team size. */
  getMin() { return this.#min; }

  /** @returns {number} The maximum allowed team size. */
  getMax() { return this.#max; }

  /** @returns {number} The maximum number of teams. */
  getMaxTeams() { return this.#maxTeams; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=TeamConfig`

Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/TeamConfig.js test/TeamConfig.test.js
git commit -m "feat: add TeamConfig with constraint validation"
```

---

### Task 5: TeamBuildResult and TeamBuildStrategy Base

**Files:**

- Create: `src/TeamBuildResult.js`
- Create: `src/strategies/TeamBuildStrategy.js`

- [ ] **Step 1: Create TeamBuildResult**

Create `src/TeamBuildResult.js`:

```js
/**
 * @file TeamBuildResult.js
 * @description Encapsulates the outcome of a team building operation.
 * Callers check `success` and `unplacedParticipants` to determine
 * whether all participants were assigned to teams.
 */

export class TeamBuildResult {
  /**
   * @param {object} options
   * @param {boolean} options.success - True if at least one team was formed.
   * @param {import('./Team.js').Team[]} [options.teams=[]] - The formed teams.
   * @param {import('./Participant.js').Participant[]} [options.unplacedParticipants=[]]
   *   Participants that could not be assigned to any team.
   * @param {string} [options.message=''] - Human-readable explanation of the outcome.
   */
  constructor({ success, teams = [], unplacedParticipants = [], message = '' }) {
    this.success = success;
    this.teams = teams;
    this.unplacedParticipants = unplacedParticipants;
    this.message = message;
  }
}
```

- [ ] **Step 2: Create TeamBuildStrategy base class**

Create `src/strategies/TeamBuildStrategy.js`:

```js
/**
 * @file TeamBuildStrategy.js
 * @description Abstract base class for team building strategies.
 * Subclasses must override distribute() to implement their allocation algorithm.
 * This enforces a consistent interface across all strategies so TeamBuilder
 * can use any strategy interchangeably.
 */

export class TeamBuildStrategy {
  /**
   * Distributes participants into teams according to the provided config.
   * Subclasses override this method to implement their allocation algorithm.
   *
   * @param {import('../Participant.js').Participant[]} participants
   *   Validated, non-empty list of participants to distribute.
   * @param {import('../TeamConfig.js').TeamConfig} config
   *   Valid team size configuration.
   * @returns {{ teams: import('../Team.js').Team[], unplacedParticipants: import('../Participant.js').Participant[] }}
   * @throws {Error} Always — subclasses must override this method.
   */
  distribute(participants, config) {
    throw new Error('distribute() must be implemented by a TeamBuildStrategy subclass');
  }
}
```

- [ ] **Step 3: Verify files exist**

Run: `ls src/TeamBuildResult.js src/strategies/TeamBuildStrategy.js`

Expected: both files listed without error.

- [ ] **Step 4: Commit**

```bash
git add src/TeamBuildResult.js src/strategies/TeamBuildStrategy.js
git commit -m "feat: add TeamBuildResult and TeamBuildStrategy base class"
```

---

### Task 6: Size Resolution Utility

**Files:**

- Create: `src/utils/sizeResolution.js`
- Create: `test/sizeResolution.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/sizeResolution.test.js`:

```js
/**
 * @file sizeResolution.test.js
 * @description Tests for the team count resolution algorithm.
 */
import { resolveTeamCount } from '../src/utils/sizeResolution.js';
import { TeamConfig } from '../src/TeamConfig.js';

describe('resolveTeamCount', () => {
  test('divides evenly at ideal size', () => {
    // 12 participants, ideal=4, min=3, max=5 → 3 teams of 4
    const config = new TeamConfig({ ideal: 4, min: 3, max: 5 });
    expect(resolveTeamCount(12, config)).toEqual({ teamCount: 3, unplacedCount: 0 });
  });

  test('uses min/max range when ideal does not divide evenly', () => {
    // 11 participants, ideal=4, min=3, max=5
    // kMin=ceil(11/5)=3, kMax=floor(11/3)=3 → k=3 (3 teams, sizes 4,4,3)
    const config = new TeamConfig({ ideal: 4, min: 3, max: 5 });
    const result = resolveTeamCount(11, config);
    expect(result.unplacedCount).toBe(0);
    // All 11 fit: teamCount*min <= 11 <= teamCount*max
    expect(result.teamCount * config.getMin()).toBeLessThanOrEqual(11);
    expect(result.teamCount * config.getMax()).toBeGreaterThanOrEqual(11);
  });

  test('respects maxTeams cap and returns unplaced when cap exceeded', () => {
    // 5 participants, ideal=1, min=1, max=1, maxTeams=3
    // kMin=5, kMax=min(5,3)=3 → kMin>kMax → fallback: floor(5/1)=5 capped to 3, unplaced=2
    const config = new TeamConfig({ ideal: 1, min: 1, max: 1, maxTeams: 3 });
    expect(resolveTeamCount(5, config)).toEqual({ teamCount: 3, unplacedCount: 2 });
  });

  test('returns unplacedCount > 0 when no valid team count fits everyone', () => {
    // 13 participants, ideal=5, min=4, max=5, maxTeams=2
    // kMin=ceil(13/5)=3, kMax=min(floor(13/4),2)=min(3,2)=2 → kMin>kMax
    // Fallback: floor(13/5)=2 teams of 5, unplaced=3
    const config = new TeamConfig({ ideal: 5, min: 4, max: 5, maxTeams: 2 });
    expect(resolveTeamCount(13, config)).toEqual({ teamCount: 2, unplacedCount: 3 });
  });

  test('forms one team when all participants fit in a single team', () => {
    // 3 participants, ideal=4, min=2, max=5 → 1 team of 3 (within min/max)
    const config = new TeamConfig({ ideal: 4, min: 2, max: 5 });
    expect(resolveTeamCount(3, config)).toEqual({ teamCount: 1, unplacedCount: 0 });
  });

  test('picks team count closest to n/ideal when multiple valid values exist', () => {
    // 12 participants, ideal=4, min=3, max=6
    // kMin=ceil(12/6)=2, kMax=floor(12/3)=4
    // target=12/4=3; k=3 is closest → 3 teams of 4
    const config = new TeamConfig({ ideal: 4, min: 3, max: 6 });
    expect(resolveTeamCount(12, config)).toEqual({ teamCount: 3, unplacedCount: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=sizeResolution`

Expected: FAIL — `Cannot find module '../src/utils/sizeResolution.js'`

- [ ] **Step 3: Implement resolveTeamCount**

Create `src/utils/sizeResolution.js`:

```js
/**
 * @file sizeResolution.js
 * @description Shared algorithm for determining how many teams to form
 * given a participant count and team size constraints.
 *
 * The algorithm finds the number of teams k such that every team can have
 * between min and max members (ceil(n/max) <= k <= floor(n/min)), choosing
 * the k closest to n/ideal. If no valid k exists within the maxTeams cap,
 * it forms as many ideal-sized teams as possible and reports the remainder
 * as unplaced.
 */

/**
 * Determines the optimal number of teams for n participants.
 *
 * @param {number} n - Total number of participants to place.
 * @param {import('../TeamConfig.js').TeamConfig} config - Validated team config.
 * @returns {{ teamCount: number, unplacedCount: number }}
 *   teamCount: number of teams to create.
 *   unplacedCount: participants that could not be assigned (0 when everyone fits).
 */
export function resolveTeamCount(n, config) {
  const ideal = config.getIdeal();
  const min = config.getMin();
  const max = config.getMax();
  const maxTeams = config.getMaxTeams();

  // kMin: smallest k where each team has <= max members
  const kMin = Math.ceil(n / max);
  // kMax: largest k (capped at maxTeams) where each team has >= min members
  const kMax = Math.min(Math.floor(n / min), maxTeams);

  if (kMin > kMax) {
    // No k can accommodate everyone — form as many ideal-sized teams as possible
    const teamCount = Math.min(Math.floor(n / ideal), maxTeams);
    const placed = teamCount * ideal;
    return { teamCount, unplacedCount: n - placed };
  }

  // Among valid k values [kMin, kMax], pick the one closest to the ideal ratio n/ideal
  const target = n / ideal;
  let bestK = kMin;
  let bestDist = Math.abs(kMin - target);

  for (let k = kMin + 1; k <= kMax; k++) {
    const dist = Math.abs(k - target);
    if (dist < bestDist) {
      bestDist = dist;
      bestK = k;
    }
  }

  return { teamCount: bestK, unplacedCount: 0 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=sizeResolution`

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sizeResolution.js test/sizeResolution.test.js
git commit -m "feat: add team size resolution algorithm"
```

---

### Task 7: RandomStrategy

**Files:**

- Create: `src/strategies/RandomStrategy.js`

- [ ] **Step 1: Implement RandomStrategy**

Create `src/strategies/RandomStrategy.js`:

```js
/**
 * @file RandomStrategy.js
 * @description Team building strategy that assigns participants randomly.
 * Uses the Fisher-Yates shuffle to randomize order, then distributes
 * participants round-robin across teams for even sizing.
 */

import { TeamBuildStrategy } from './TeamBuildStrategy.js';
import { Team } from '../Team.js';
import { resolveTeamCount } from '../utils/sizeResolution.js';

export class RandomStrategy extends TeamBuildStrategy {
  /**
   * Shuffles participants randomly and assigns them to teams round-robin.
   *
   * @param {import('../Participant.js').Participant[]} participants
   * @param {import('../TeamConfig.js').TeamConfig} config
   * @returns {{ teams: Team[], unplacedParticipants: import('../Participant.js').Participant[] }}
   */
  distribute(participants, config) {
    const shuffled = fisherYatesShuffle([...participants]);
    const { teamCount, unplacedCount } = resolveTeamCount(shuffled.length, config);

    // Participants that cannot be placed are taken from the end of the shuffled list
    const placed = shuffled.slice(0, shuffled.length - unplacedCount);
    const unplacedParticipants = shuffled.slice(shuffled.length - unplacedCount);

    // Distribute placed participants round-robin across teams for even sizing
    const teams = Array.from({ length: teamCount }, () => new Team());
    placed.forEach((participant, index) => {
      teams[index % teamCount].addParticipant(participant);
    });

    return { teams, unplacedParticipants };
  }
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * Each element has an equal probability of ending up at any position.
 *
 * @param {Array} arr - Array to shuffle (mutated in place).
 * @returns {Array} The same array, now shuffled.
 */
function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/strategies/RandomStrategy.js`

Expected: file listed without error.

- [ ] **Step 3: Commit**

```bash
git add src/strategies/RandomStrategy.js
git commit -m "feat: add RandomStrategy using Fisher-Yates shuffle"
```

---

### Task 8: FairnessStrategy

**Files:**

- Create: `src/strategies/FairnessStrategy.js`

- [ ] **Step 1: Implement FairnessStrategy**

Create `src/strategies/FairnessStrategy.js`:

```js
/**
 * @file FairnessStrategy.js
 * @description Team building strategy that maximizes skill balance across teams.
 *
 * Algorithm:
 * 1. Sort participants descending by abilityScore.
 * 2. Snake-draft them into teams: assign in order T0, T1, ..., TN-1, TN-1, ..., T1, T0,
 *    then repeat. This ensures high scorers and low scorers are spread evenly,
 *    producing team skillSum values that are as equal as possible.
 */

import { TeamBuildStrategy } from './TeamBuildStrategy.js';
import { Team } from '../Team.js';
import { resolveTeamCount } from '../utils/sizeResolution.js';

export class FairnessStrategy extends TeamBuildStrategy {
  /**
   * Sorts participants by ability score and snake-drafts them into teams.
   *
   * @param {import('../Participant.js').Participant[]} participants
   * @param {import('../TeamConfig.js').TeamConfig} config
   * @returns {{ teams: Team[], unplacedParticipants: import('../Participant.js').Participant[] }}
   */
  distribute(participants, config) {
    // Sort highest to lowest so the snake draft balances totals
    const sorted = [...participants].sort(
      (a, b) => b.getAbilityScore() - a.getAbilityScore()
    );

    const { teamCount, unplacedCount } = resolveTeamCount(sorted.length, config);

    // Low-scoring participants at the end are the ones left unplaced
    const placed = sorted.slice(0, sorted.length - unplacedCount);
    const unplacedParticipants = sorted.slice(sorted.length - unplacedCount);

    const teams = Array.from({ length: teamCount }, () => new Team());

    // Snake draft: cycle through T0..TN-1 forward, then TN-1..T0 backward, repeat.
    // For teamCount=3, the pattern is: 0,1,2, 2,1,0, 0,1,2, ...
    // cycle length = 2 * teamCount; within each cycle:
    //   positions 0..teamCount-1 map to team index = position
    //   positions teamCount..2*teamCount-1 map to team index = 2*teamCount-1-position
    const cycle = 2 * teamCount;
    placed.forEach((participant, i) => {
      const pos = i % cycle;
      const teamIndex = pos < teamCount ? pos : (2 * teamCount - 1 - pos);
      teams[teamIndex].addParticipant(participant);
    });

    return { teams, unplacedParticipants };
  }
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/strategies/FairnessStrategy.js`

Expected: file listed without error.

- [ ] **Step 3: Commit**

```bash
git add src/strategies/FairnessStrategy.js
git commit -m "feat: add FairnessStrategy using snake draft"
```

---

### Task 9: TeamBuilder and Integration Tests

**Files:**

- Create: `src/TeamBuilder.js`
- Create: `test/TeamBuilder.test.js`

- [ ] **Step 1: Write failing tests**

Create `test/TeamBuilder.test.js`:

```js
/**
 * @file TeamBuilder.test.js
 * @description Integration tests for TeamBuilder with both strategies.
 * Covers team formation, edge cases, and all error conditions from the spec.
 */
import { TeamBuilder } from '../src/TeamBuilder.js';
import { TeamConfig } from '../src/TeamConfig.js';
import { Participant } from '../src/Participant.js';
import { RandomStrategy } from '../src/strategies/RandomStrategy.js';
import { FairnessStrategy } from '../src/strategies/FairnessStrategy.js';

/** Creates n participants with ability scores 1..n */
function makeParticipants(n) {
  return Array.from({ length: n }, (_, i) =>
    new Participant(`p${i}`, `Person ${i}`, i + 1)
  );
}

/** Computes population standard deviation of an array of numbers */
function stdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );
}

describe('TeamBuilder — RandomStrategy', () => {
  const config = new TeamConfig({ ideal: 4, min: 3, max: 5 });
  const builder = new TeamBuilder(config, new RandomStrategy());

  test('returns success=true and correct team count for even split', () => {
    const result = builder.buildTeams(makeParticipants(12));
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(3);
    expect(result.unplacedParticipants).toHaveLength(0);
  });

  test('all teams have member counts within [min, max]', () => {
    const result = builder.buildTeams(makeParticipants(11));
    expect(result.success).toBe(true);
    for (const team of result.teams) {
      expect(team.size()).toBeGreaterThanOrEqual(3);
      expect(team.size()).toBeLessThanOrEqual(5);
    }
  });

  test('total participants across teams and unplaced equals input count', () => {
    const participants = makeParticipants(11);
    const result = builder.buildTeams(participants);
    const total = result.teams.reduce((sum, t) => sum + t.size(), 0)
      + result.unplacedParticipants.length;
    expect(total).toBe(11);
  });

  test('returns success=false for null participants', () => {
    const result = builder.buildTeams(null);
    expect(result.success).toBe(false);
    expect(result.teams).toHaveLength(0);
    expect(result.message).toBeTruthy();
  });

  test('returns success=false for empty participant list', () => {
    const result = builder.buildTeams([]);
    expect(result.success).toBe(false);
  });

  test('returns success=false when participant count is less than min', () => {
    // min=3, providing only 2 participants
    const result = builder.buildTeams(makeParticipants(2));
    expect(result.success).toBe(false);
    expect(result.message).toContain('fewer than the minimum');
  });

  test('does not create more than maxTeams teams', () => {
    const capConfig = new TeamConfig({ ideal: 1, min: 1, max: 1, maxTeams: 3 });
    const result = new TeamBuilder(capConfig, new RandomStrategy()).buildTeams(makeParticipants(10));
    expect(result.teams.length).toBeLessThanOrEqual(3);
  });

  test('reports unplaced participants when cap is hit', () => {
    // maxTeams=3, max=1: can only place 3 of 5 participants
    const capConfig = new TeamConfig({ ideal: 1, min: 1, max: 1, maxTeams: 3 });
    const result = new TeamBuilder(capConfig, new RandomStrategy()).buildTeams(makeParticipants(5));
    expect(result.success).toBe(true);
    expect(result.unplacedParticipants).toHaveLength(2);
  });

  test('result message is non-empty string', () => {
    const result = builder.buildTeams(makeParticipants(8));
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});

describe('TeamBuilder — FairnessStrategy', () => {
  test('produces equal skill sums for perfectly divisible input', () => {
    // 6 participants scored 6,5,4,3,2,1 with ideal=2 → 3 teams of 2
    // Snake: T0=6, T1=5, T2=4, T2=3, T1=2, T0=1
    // T0: 6+1=7, T1: 5+2=7, T2: 4+3=7 — all equal
    const participants = [6, 5, 4, 3, 2, 1].map((s, i) =>
      new Participant(`p${i}`, `P${i}`, s)
    );
    const config = new TeamConfig({ ideal: 2, min: 2, max: 2 });
    const result = new TeamBuilder(config, new FairnessStrategy()).buildTeams(participants);
    expect(result.success).toBe(true);
    const sums = result.teams.map(t => t.skillSum());
    // All sums should be 7
    expect(new Set(sums).size).toBe(1);
    expect(sums[0]).toBe(7);
  });

  test('produces lower skill sum std dev than naive sequential assignment', () => {
    // 9 participants scored 9..1, ideal=3, 3 teams
    // Fairness snake: T0:9+4+3=16, T1:8+5+2=15, T2:7+6+1=14 → stdDev ≈ 0.82
    // Naive sequential (T0:9+8+7, T1:6+5+4, T2:3+2+1) → stdDev ≈ 7.35
    const participants = [9, 8, 7, 6, 5, 4, 3, 2, 1].map((s, i) =>
      new Participant(`p${i}`, `P${i}`, s)
    );
    const config = new TeamConfig({ ideal: 3, min: 3, max: 3 });
    const fairResult = new TeamBuilder(config, new FairnessStrategy()).buildTeams(participants);
    const fairStdDev = stdDev(fairResult.teams.map(t => t.skillSum()));
    // Fairness produces standard deviation < 2 (much better than naive ≈7.35)
    expect(fairStdDev).toBeLessThan(2);
  });

  test('all teams have member counts within [min, max]', () => {
    const config = new TeamConfig({ ideal: 4, min: 3, max: 5 });
    const result = new TeamBuilder(config, new FairnessStrategy()).buildTeams(makeParticipants(11));
    for (const team of result.teams) {
      expect(team.size()).toBeGreaterThanOrEqual(3);
      expect(team.size()).toBeLessThanOrEqual(5);
    }
  });

  test('total participants conserved across teams and unplaced', () => {
    // 13 participants, maxTeams=2, max=5: 2 teams of 5, 3 unplaced
    const config = new TeamConfig({ ideal: 5, min: 4, max: 5, maxTeams: 2 });
    const result = new TeamBuilder(config, new FairnessStrategy()).buildTeams(makeParticipants(13));
    const total = result.teams.reduce((sum, t) => sum + t.size(), 0)
      + result.unplacedParticipants.length;
    expect(total).toBe(13);
  });
});

describe('TeamBuilder — Team interface compliance', () => {
  test('each team exposes size(), getParticipants(), and skillSum()', () => {
    const config = new TeamConfig({ ideal: 2, min: 2, max: 2 });
    const result = new TeamBuilder(config, new FairnessStrategy()).buildTeams(makeParticipants(4));
    expect(result.success).toBe(true);
    for (const team of result.teams) {
      expect(typeof team.size()).toBe('number');
      expect(Array.isArray(team.getParticipants())).toBe(true);
      expect(typeof team.skillSum()).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=TeamBuilder`

Expected: FAIL — `Cannot find module '../src/TeamBuilder.js'`

- [ ] **Step 3: Implement TeamBuilder**

Create `src/TeamBuilder.js`:

```js
/**
 * @file TeamBuilder.js
 * @description Orchestrates team formation by validating inputs and delegating
 * to a pluggable strategy. Always returns a TeamBuildResult — never throws.
 * Validation failures (null/empty list, too few participants) return
 * success=false. Partial placements return success=true with unplacedParticipants.
 */

import { TeamBuildResult } from './TeamBuildResult.js';

export class TeamBuilder {
  #config;
  #strategy;

  /**
   * @param {import('./TeamConfig.js').TeamConfig} config - Validated team configuration.
   * @param {import('./strategies/TeamBuildStrategy.js').TeamBuildStrategy} strategy
   *   The algorithm to use for distributing participants into teams.
   */
  constructor(config, strategy) {
    this.#config = config;
    this.#strategy = strategy;
  }

  /**
   * Divides participants into teams using the configured strategy.
   * Always returns a TeamBuildResult — never throws.
   *
   * Returns success=false when:
   *   - participants is null or empty
   *   - participant count is less than the configured minimum team size
   *
   * Returns success=true with non-empty unplacedParticipants when the
   * participant count exceeds what can be placed within the maxTeams cap.
   *
   * @param {import('./Participant.js').Participant[]|null} participants
   * @returns {TeamBuildResult}
   */
  buildTeams(participants) {
    // Validate: participants must be a non-empty array
    if (!participants || participants.length === 0) {
      return new TeamBuildResult({
        success: false,
        message: 'Participant list must be non-empty.',
      });
    }

    // Validate: enough participants to form at least one team
    if (participants.length < this.#config.getMin()) {
      return new TeamBuildResult({
        success: false,
        message:
          `Cannot form a team: ${participants.length} participant(s) is fewer than ` +
          `the minimum team size of ${this.#config.getMin()}.`,
      });
    }

    // Delegate to strategy — it handles size resolution and returns teams + unplaced
    const { teams, unplacedParticipants } = this.#strategy.distribute(
      participants,
      this.#config
    );

    const hasUnplaced = unplacedParticipants.length > 0;
    return new TeamBuildResult({
      success: true,
      teams,
      unplacedParticipants,
      message: hasUnplaced
        ? `Teams formed, but ${unplacedParticipants.length} participant(s) could not be placed.`
        : `Successfully formed ${teams.length} team(s).`,
    });
  }
}
```

- [ ] **Step 4: Run all tests to verify they pass**

Run: `npm test`

Expected: PASS — all test suites, no failures.

- [ ] **Step 5: Commit**

```bash
git add src/TeamBuilder.js test/TeamBuilder.test.js
git commit -m "feat: add TeamBuilder orchestrator and integration tests"
```
