# Programming Assessment — JavaScript Implementation Design

**Date:** 2026-03-27
**Language:** JavaScript (Node.js, CommonJS modules)
**Test Framework:** Jest
**Location:** `example-02/`

---

## Overview

Implement the team-building logic from the course Programming Assessment using JavaScript. The system takes a list of participants and divides them into teams using either a random or ability-fair formation strategy. No GUI or CLI — purely a programmatic interface.

---

## File Structure

```text
example-02/
  src/
    Participant.js
    Team.js
    TeamResult.js
    strategies/
      RandomStrategy.js
      FairStrategy.js
    TeamBuilder.js
  tests/
    Participant.test.js
    Team.test.js
    TeamResult.test.js
    strategies/
      RandomStrategy.test.js
      FairStrategy.test.js
    TeamBuilder.test.js
  package.json
```

---

## Classes

### `Participant`

Data class representing a single participant in an event.

**Fields:**

- `name` (string) — participant's name
- `abilityScore` (number) — numeric skill rating used for fair team balancing

### `Team`

Data class holding a group of participants assigned to the same team.

**Private:**

- `_participants` (array of Participant)

**Public interface:**

- `getSize()` → number of members
- `getParticipants()` → copy of participants array
- `getSkillSum()` → sum of all participants' abilityScore values

### `TeamResult`

Returned by `TeamBuilder.build()`. Encapsulates outcome of a team generation attempt.

**Fields:**

- `success` (boolean) — false if teams could not be generated at all
- `teams` (Team[]) — generated teams; empty array if success is false
- `unplacedParticipants` (Participant[]) — participants who could not be assigned
- `errorMessage` (string|null) — description of failure when success is false

**Method:**

- `hasUnplaced()` → boolean convenience method

### `RandomStrategy`

Implements random team formation.

- `buildTeams(participants, idealSize, minSize, maxSize)` → `{ teams: Team[], unplaced: Participant[] }`
- Shuffles participants using Fisher-Yates, then fills teams sequentially using the calculated size distribution.

### `FairStrategy`

Implements ability-balanced team formation using a snake draft.

- `buildTeams(participants, idealSize, minSize, maxSize)` → `{ teams: Team[], unplaced: Participant[] }`
- Sorts participants descending by `abilityScore`, then assigns using a snake pattern (0,1,2…N,N,N-1…0,0,1…) so ability is distributed evenly.

### `TeamBuilder`

Orchestrates validation and delegates to the injected strategy.

**Constructor:** `new TeamBuilder(strategy)` — accepts a `RandomStrategy` or `FairStrategy` instance.

**Setters:**

- `setParticipants(participants)`
- `setIdealSize(ideal)`
- `setMinSize(min)`
- `setMaxSize(max)`

**`build()` → TeamResult**

---

## Validation Rules (enforced in `TeamBuilder.build()`)

| Condition | Result |
| --- | --- |
| `participants` null or empty | `success: false` |
| `min > max` | `success: false` |
| `ideal < min` or `ideal > max` | `success: false` |
| Calculated team count > 100 | Cap at 100; overflow participants → `unplacedParticipants` |
| Some participants can't fit constraints | `success: true`, non-empty `unplacedParticipants` |

No exceptions are thrown for invalid inputs — all bad inputs produce a `TeamResult` with `success: false` and a descriptive `errorMessage`.

---

## Team Size Algorithm

1. `numTeams = Math.round(N / idealSize)`, clamped to `[1, 100]`
2. `baseSize = Math.floor(N / numTeams)`, `extras = N % numTeams`
3. `extras` teams get `baseSize + 1` members; the rest get `baseSize`
4. If `baseSize + 1 > maxSize`: reduce `numTeams` by 1 and recalculate; repeat until sizes fit or only participants that cannot be placed remain — those go to `unplacedParticipants`
5. If `baseSize < minSize`: participants that cannot fill a minimum-sized team go to `unplacedParticipants`

---

## Usage Example

```js
const { TeamBuilder } = require('./src/TeamBuilder');
const { FairStrategy } = require('./src/strategies/FairStrategy');
const { Participant } = require('./src/Participant');

const participants = [
  new Participant('Alice', 90),
  new Participant('Bob', 70),
  new Participant('Carol', 85),
  new Participant('Dave', 60),
];

const builder = new TeamBuilder(new FairStrategy());
builder.setParticipants(participants);
builder.setIdealSize(2);
builder.setMinSize(2);
builder.setMaxSize(3);

const result = builder.build();

if (result.success) {
  result.teams.forEach(team => {
    console.log(team.getParticipants(), team.getSkillSum());
  });
}
```

---

## Test Coverage

| File | What it covers |
| --- | --- |
| `Participant.test.js` | Constructor, edge values (score 0, negative) |
| `Team.test.js` | `getSize`, `getSkillSum`, `getParticipants` returns copy |
| `TeamResult.test.js` | `hasUnplaced`, success/error states |
| `RandomStrategy.test.js` | All placed when evenly divisible; sizes within min/max |
| `FairStrategy.test.js` | Balanced skill sums; snake draft order for known input |
| `TeamBuilder.test.js` | All 9 spec requirements: invalid inputs, 100-team cap, unplaced reporting, both strategies |

---

## Spec Requirements Checklist

- [x] Interface accepts list of Participant objects
- [x] Interface accepts ideal, min, max team size
- [x] Supports random and fair (ability score) team generation modes
- [x] Gracefully handles min > max
- [x] Gracefully handles ideal outside [min, max]
- [x] Does not create more than 100 teams
- [x] Returns list of teams made up of lists of participants
- [x] Indicates if teams could not be generated (success: false)
- [x] Indicates if teams were generated but some participants could not be placed (unplacedParticipants)
- [x] Team interface: getSize, getParticipants, getSkillSum
- [x] OO design with encapsulation and abstraction
- [x] Unit tests covering all functionality
- [x] No interactive interface (no GUI, no CLI)
