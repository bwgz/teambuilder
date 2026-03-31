# TeamBuilder Design Spec

**Date:** 2026-03-30  
**Language:** JavaScript (ES Modules)  
**Test framework:** Jest

---

## Overview

A general-purpose team building library that divides a list of participants into teams. No GUI or CLI — programmatic API only. Implemented with a Strategy pattern so new team-building algorithms can be added by extending a base class.

---

## Classes & File Structure

```
src/
  Participant.js           — Data class: id, name, abilityScore
  Team.js                  — Holds participants; exposes size(), getParticipants(), skillSum()
  TeamConfig.js            — ideal, min, max, maxTeams=100; validates constraints on construction
  TeamBuildResult.js       — { success, teams, unplacedParticipants, message }
  strategies/
    TeamBuildStrategy.js   — Base class; distribute(participants, config) throws if not overridden
    RandomStrategy.js      — Fisher-Yates shuffle, sequential assignment to teams
    FairnessStrategy.js    — Sort desc by abilityScore, snake-draft across teams
  TeamBuilder.js           — Takes TeamConfig + strategy; exposes buildTeams(participants)
test/
  Participant.test.js
  Team.test.js
  TeamConfig.test.js
  TeamBuilder.test.js      — Covers both strategies, edge cases, all error paths
```

---

## Participant

```js
class Participant {
  constructor(id, name, abilityScore)
  getId()
  getName()
  getAbilityScore()
}
```

Fields are private; exposed only via getters. Validates that `abilityScore` is a finite number.

---

## Team

```js
class Team {
  constructor()
  addParticipant(participant)
  size()                    // number of team members
  getParticipants()         // returns copy of participants array
  skillSum()                // sum of all participants' abilityScore
}
```

---

## TeamConfig

```js
class TeamConfig {
  constructor({ ideal, min, max, maxTeams = 100 })
}
```

Throws a descriptive `Error` on construction if:
- `min > max`
- `ideal < min || ideal > max`
- Any size value ≤ 0
- `maxTeams` ≤ 0

All validated fields exposed as read-only getters.

---

## TeamBuildResult

```js
{
  success: boolean,               // false = teams could not be generated at all
  teams: Team[],                  // always an array (may be empty)
  unplacedParticipants: Participant[],  // non-empty when some couldn't be placed
  message: string                 // human-readable explanation of outcome
}
```

`success: true` with non-empty `unplacedParticipants` means teams were formed but some participants could not be placed.

---

## Strategy Pattern

### TeamBuildStrategy (base)

```js
class TeamBuildStrategy {
  distribute(participants, config)  // throws Error("not implemented")
}
```

All strategies implement `distribute(participants, config)` and return `Team[]`.

### RandomStrategy

1. Fisher-Yates shuffle the participant list
2. Determine number of teams using size resolution (see below)
3. Assign participants sequentially to teams

### FairnessStrategy

1. Sort participants descending by `abilityScore`
2. Determine number of teams using size resolution (see below)
3. Snake-draft: assign in order 1,2,3…N, N,N-1…1, repeat — balances skill sums across teams

---

## Team Size Resolution (shared logic)

Given `n` participants and config `{ ideal, min, max, maxTeams }`:

1. If `n % ideal === 0` and `n / ideal ≤ maxTeams` → use `n / ideal` ideal-sized teams
2. Otherwise, find the largest `k ≤ maxTeams` where every team has between `min` and `max` members, distributing as close to `ideal` as possible
3. If no valid `k` exists → form as many ideal-sized teams as possible, leave remainders in `unplacedParticipants`

This logic lives in a shared utility used by both strategies.

---

## TeamBuilder

```js
class TeamBuilder {
  constructor(config, strategy)
  buildTeams(participants)   // returns TeamBuildResult, never throws
}
```

`buildTeams` validates runtime inputs and returns `TeamBuildResult` with `success: false` for:
- `null` or empty participant list
- Participant count < `min` (can't form even one team)
- Required team count > `maxTeams`

If validation passes, delegates to `strategy.distribute()` and wraps the result in `TeamBuildResult`.

---

## Error Handling Policy

| Error type | Behavior |
|---|---|
| Bad `TeamConfig` (programmer error) | `TeamConfig` constructor throws `Error` |
| Bad participant list (runtime data) | `buildTeams` returns `success: false` result |
| Can't place all participants | `success: true`, `unplacedParticipants` non-empty |

---

## Testing Plan

`TeamBuilder.test.js` covers:
- Random and fairness strategies produce teams within min/max bounds
- Fairness strategy produces lower standard deviation of team `skillSum()` values than random on the same input
- Empty participant list → `success: false`
- Participant count < min → `success: false`
- Would exceed 100 teams → `success: false`
- Participants that can't be placed → `success: true`, unplaced list non-empty
- `TeamConfig` throws on invalid size constraints

`Team.test.js`: `size()`, `getParticipants()`, `skillSum()` correctness  
`Participant.test.js`: getter correctness, invalid abilityScore handling  
`TeamConfig.test.js`: all validation error cases
