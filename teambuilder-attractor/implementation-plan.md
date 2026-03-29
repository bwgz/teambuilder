# TeamBuilder — Detailed Implementation Plan

## 1. Spec Analysis

### 1.1 Domain Objects

| Object | Kind | Fields |
|--------|------|--------|
| `Participant` | Immutable value record | `id: string`, `name: string`, `ability: number` |
| `TeamConfig` | Configuration value record | `idealSize: number`, `minSize: number`, `maxSize: number`, `maxTeams: number` (hard-capped ≤ 100), `mode: Mode` |
| `Team` | Mutable during building, read-only in result | internal `Participant[]` roster |
| `TeamResult` | Immutable result value | `success: boolean`, `teams: Team[]`, `unplaced: Participant[]`, `message: string` |
| `Mode` | Discriminated enum | `RANDOM \| FAIR` |

### 1.2 Interfaces

**`ITeamBuilder`** — single public entry point
```
buildTeams(participants: Participant[], config: TeamConfig): TeamResult
```

**`ITeam`** — read-only view of a formed team
```
getMemberCount(): number
getParticipants(): Participant[]
getAbilitySum(): number
```

**`IDistributionStrategy`** — internal seam between RANDOM and FAIR algorithms
```
distribute(participants: Participant[], slotCount: number): Participant[][]
```
*(returns an array of `slotCount` arrays, each containing the assigned participants)*

### 1.3 Constraints (ordered by priority)

| # | Constraint | Error message | Notes |
|---|-----------|--------------|-------|
| C1 | `minSize > maxSize` | `"Minimum size cannot be greater than maximum size"` | Guard 1 |
| C2 | `idealSize < minSize \|\| idealSize > maxSize` | `"Ideal size must be between minimum and maximum size"` | Guard 2 |
| C3 | `participants` is null or empty | `"No participants provided"` | Guard 3 |
| C4 | `participants.length < minSize` | `"Not enough participants to form a single team"` | Guard 4 |
| C5 | `config.maxTeams` cannot exceed 100 | (enforced silently — clamp or reject; spec says "never exceeds 100") | Use min(maxTeams,100) |
| C6 | Never produce more than 100 teams total | Excess participants go to `unplaced` | Post-distribution |
| C7 | Every team must satisfy `minSize ≤ size ≤ maxSize` | — | Distribution invariant |
| C8 | Attempt `idealSize` first; use `[minSize, maxSize]` to absorb remainder | — | Size-packing algorithm |

### 1.4 Algorithms

#### Algorithm A — Team-count and slot sizing (shared, mode-agnostic)

```
Given N = participants.length, ideal, min, max, hardCap = min(maxTeams, 100)

1. Start with k = floor(N / ideal)          -- baseline team count
2. remainder = N - k * ideal
3. if remainder == 0: all teams get idealSize  → done
4. Try to absorb remainder by growing some teams toward maxSize:
     extraCapacity = k * (max - ideal)
     if remainder <= extraCapacity:
         numBigTeams = remainder               -- distribute 1 extra to each
         sizes = [ideal+1 × numBigTeams, ideal × (k - numBigTeams)]
     else:
         -- Cannot absorb; try adding one more team of size [min..max]
         k += 1
         Re-run size-packing:
             Distribute N across k teams staying within [min, max]
             Fill as many teams as possible from the front at idealSize;
             absorb remainders greedily within bounds.
             If still impossible, accept unplaced participants.
5. Cap at hardCap: if k > hardCap, k = hardCap
   Any participants beyond hardCap * maxSize go to unplaced.
```

#### Algorithm B — RANDOM distribution

```
1. Copy participant list.
2. Fisher-Yates shuffle using Math.random().
3. Assign participants sequentially into the slot array produced by Algorithm A.
```

#### Algorithm C — FAIR (snake-draft) distribution

```
1. Sort participants descending by ability score.
2. Create k empty team buckets (k from Algorithm A).
3. Iterate i = 0..N-1:
     Round number  = floor(i / k)
     Position in round = i mod k
     if round is even:  bucket_index = position        (left → right)
     if round is odd:   bucket_index = (k-1) - position (right → left)
     assign participants[i] to buckets[bucket_index]
4. Fill each slot from the corresponding bucket.
```

---

## 2. File & Module Layout

All new code lives under the existing **TypeScript / Vitest / ESM** project at
`/Users/bwgz/projects/bruce/teambuilde-strongdm`.

```
src/
  team-builder/
    types.ts            -- Participant, TeamConfig, TeamResult, Mode (interfaces + types)
    team.ts             -- Team class (implements ITeam)
    validator.ts        -- input-validation logic (all C1–C4 guards)
    sizer.ts            -- team-count / slot-size algorithm (Algorithm A)
    strategies/
      random.ts         -- RandomDistributionStrategy (Algorithm B)
      fair.ts           -- FairDistributionStrategy (Algorithm C)
    team-builder.ts     -- TeamBuilderImpl (orchestrator, implements ITeamBuilder)
    index.ts            -- public barrel export

tests/
  team-builder/
    team.test.ts
    validator.test.ts
    sizer.test.ts
    strategies/
      random.test.ts
      fair.test.ts
    team-builder.test.ts   -- scenario-level integration tests
```

---

## 3. Detailed Class & Method Specification

### 3.1 `src/team-builder/types.ts`

```typescript
// ── Enums ──────────────────────────────────────────────────────────────────

export enum Mode {
  RANDOM = 'RANDOM',
  FAIR   = 'FAIR',
}

// ── Value types ────────────────────────────────────────────────────────────

export interface Participant {
  readonly id:      string;
  readonly name:    string;
  readonly ability: number;   // any finite float
}

export interface TeamConfig {
  readonly idealSize: number;   // preferred team size
  readonly minSize:   number;   // minimum acceptable size
  readonly maxSize:   number;   // maximum acceptable size
  readonly maxTeams:  number;   // hard cap — effective cap = min(maxTeams, 100)
  readonly mode:      Mode;
}

// ── Result types ───────────────────────────────────────────────────────────

export interface ITeam {
  getMemberCount(): number;
  getParticipants(): ReadonlyArray<Participant>;
  getAbilitySum(): number;
}

export interface TeamResult {
  readonly success:   boolean;
  readonly teams:     ReadonlyArray<ITeam>;
  readonly unplaced:  ReadonlyArray<Participant>;
  readonly message:   string;
}

// ── Strategy interface ──────────────────────────────────────────────────────

export interface IDistributionStrategy {
  /**
   * Distribute `participants` into exactly `slotCount` arrays.
   * Each sub-array may be empty (unfilled slot).
   * Caller guarantees slotCount >= 1.
   */
  distribute(
    participants: ReadonlyArray<Participant>,
    slotCount:    number,
  ): Participant[][];
}

// ── Builder interface ───────────────────────────────────────────────────────

export interface ITeamBuilder {
  buildTeams(
    participants: Participant[] | null | undefined,
    config:       TeamConfig,
  ): TeamResult;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const MAX_TEAMS_ABSOLUTE = 100;
```

---

### 3.2 `src/team-builder/team.ts`

**Class `Team`** — implements `ITeam`

| Method | Signature | Behaviour |
|--------|-----------|-----------|
| `constructor` | `(participants: Participant[])` | Deep-copies the array; stores internally. |
| `getMemberCount` | `() → number` | Returns `this.#participants.length`. |
| `getParticipants` | `() → ReadonlyArray<Participant>` | Returns a frozen shallow copy (prevents mutation). |
| `getAbilitySum` | `() → number` | Returns `Σ p.ability` using `reduce`. Handles empty team (returns 0). |

```typescript
// Sketch
export class Team implements ITeam {
  readonly #participants: Participant[];

  constructor(participants: Participant[]) {
    this.#participants = [...participants];
  }

  getMemberCount(): number { … }
  getParticipants(): ReadonlyArray<Participant> { … }
  getAbilitySum(): number { … }
}
```

---

### 3.3 `src/team-builder/validator.ts`

**Function `validate`**

```typescript
export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validate(
  participants: Participant[] | null | undefined,
  config: TeamConfig,
): ValidationResult
```

| Check | Order | Message |
|-------|-------|---------|
| `config.minSize > config.maxSize` | 1st | `"Minimum size cannot be greater than maximum size"` |
| `config.idealSize < config.minSize \|\| config.idealSize > config.maxSize` | 2nd | `"Ideal size must be between minimum and maximum size"` |
| `participants == null \|\| participants.length === 0` | 3rd | `"No participants provided"` |
| `participants.length < config.minSize` | 4th | `"Not enough participants to form a single team"` |

Returns `{ ok: true }` when all checks pass.

---

### 3.4 `src/team-builder/sizer.ts`

**Function `computeSlotSizes`**

```typescript
export function computeSlotSizes(
  participantCount: number,
  config: TeamConfig,
  hardCap: number,   // = min(config.maxTeams, MAX_TEAMS_ABSOLUTE)
): { slotSizes: number[]; unplacedCount: number }
```

Returns an array of positive integers (each in `[minSize, maxSize]`) and the count of participants that cannot be placed.

**Detailed algorithm:**

```
Step 1 — Determine baseline team count
  k = floor(participantCount / idealSize)
  if k === 0, k = 1   (at least one team if N >= minSize)

Step 2 — Try to fit all participants into k teams
  totalCapacity(k) = k * maxSize
  totalMinRequired(k) = k * minSize
  if participantCount > totalCapacity(k):
      k = ceil(participantCount / maxSize)   -- need more teams

Step 3 — Apply hard cap
  if k > hardCap:
      k = hardCap
      unplaced = participantCount - k * maxSize   (if positive)

Step 4 — Compute individual slot sizes
  Greedily assign sizes starting at idealSize,
  growing toward maxSize to absorb remainders,
  shrinking toward minSize if over-subscribed (shouldn't happen after step 2/3).

  Concrete approach:
    base   = floor(N / k)          -- clamped to [minSize, maxSize]
    bonus  = N - base * k          -- number of teams getting (base+1)
    sizes  = Array(bonus).fill(base+1) + Array(k-bonus).fill(base)
    Clamp each to [minSize, maxSize];
    any overflow becomes unplaced.

Step 5 — Return { slotSizes, unplacedCount }
```

> **Why separate sizer?** The distribution strategies need only slot counts, not the exact sizes — but the builder needs sizes to correctly split the shuffled/sorted list. Keeping them together in `sizer.ts` makes the logic testable in isolation.

---

### 3.5 `src/team-builder/strategies/random.ts`

**Class `RandomDistributionStrategy`** — implements `IDistributionStrategy`

| Method | Signature | Behaviour |
|--------|-----------|-----------|
| `distribute` | `(participants, slotCount) → Participant[][]` | Fisher-Yates shuffle on a copy, then splits into `slotCount` buckets. Bucket sizes come from `computeSlotSizes` (injected or called internally). |

> **Dependency injection note:** The strategy itself only handles *ordering*; slot-size splitting is driven by the builder using `slotSizes` from `sizer.ts`. The `distribute` method returns `slotCount` equal-or-near-equal arrays; the builder trims each to the corresponding slot size and collects the remainder.

**Private helper `shuffle<T>(arr: T[]): T[]`**
- Creates a copy.
- Iterates from last index to 1; swaps with a random index ≤ current.
- Returns the shuffled copy.

---

### 3.6 `src/team-builder/strategies/fair.ts`

**Class `FairDistributionStrategy`** — implements `IDistributionStrategy`

| Method | Signature | Behaviour |
|--------|-----------|-----------|
| `distribute` | `(participants, slotCount) → Participant[][]` | Sorts desc by ability, then snake-drafts into `slotCount` buckets. |

**Private helper `snakeDraft<T>(sorted: T[], bucketCount: number): T[][]`**
```
buckets = Array(bucketCount).fill([])
for i = 0..sorted.length-1:
    round     = Math.floor(i / bucketCount)
    posInRound = i % bucketCount
    bucketIdx = (round % 2 === 0)
                  ? posInRound
                  : (bucketCount - 1) - posInRound
    buckets[bucketIdx].push(sorted[i])
return buckets
```

---

### 3.7 `src/team-builder/team-builder.ts`

**Class `TeamBuilderImpl`** — implements `ITeamBuilder`

#### Constructor

```typescript
constructor(
  private readonly randomStrategy: IDistributionStrategy,
  private readonly fairStrategy:   IDistributionStrategy,
)
```

*Factory function `createTeamBuilder(): ITeamBuilder`* (exported convenience) constructs with default strategy instances.

#### Public method: `buildTeams`

```typescript
buildTeams(
  participants: Participant[] | null | undefined,
  config: TeamConfig,
): TeamResult
```

**Step-by-step orchestration:**

```
1. Validate inputs → call validate(participants, config)
   If !ok → return failure TeamResult with message

2. Compute effective hard cap
   cap = Math.min(config.maxTeams, MAX_TEAMS_ABSOLUTE)

3. Compute slot sizes
   { slotSizes, unplacedCount } = computeSlotSizes(participants.length, config, cap)

4. Select strategy
   strategy = (config.mode === Mode.FAIR) ? fairStrategy : randomStrategy

5. Distribute
   buckets = strategy.distribute(participants, slotSizes.length)
   --  buckets[i] should contain slotSizes[i] participants

6. Build Team objects
   teams = slotSizes.map((size, i) => new Team(buckets[i].slice(0, size)))

7. Collect unplaced
   All participants not assigned to any team slot.
   unplaced = [...excess from each bucket] + participants trailing beyond total capacity

8. Return TeamResult:
   success  = true
   teams    = teams
   unplaced = unplaced
   message  = (unplaced.length > 0)
                ? "Teams formed with unplaced participants"
                : "Teams formed successfully"
```

#### Private helper: `#buildFailure`

```typescript
#buildFailure(message: string): TeamResult {
  return { success: false, teams: [], unplaced: [], message };
}
```

---

### 3.8 `src/team-builder/index.ts`

Public barrel export:

```typescript
export type { Participant, TeamConfig, TeamResult, ITeam, ITeamBuilder } from './types.js';
export { Mode, MAX_TEAMS_ABSOLUTE } from './types.js';
export { Team } from './team.js';
export { createTeamBuilder } from './team-builder.js';
```

---

## 4. Test Plan

### 4.1 `tests/team-builder/team.test.ts`

| Test | Description |
|------|-------------|
| `getMemberCount — empty team` | `new Team([]).getMemberCount() === 0` |
| `getMemberCount — non-empty team` | Team with 3 participants → 3 |
| `getParticipants — returns copy` | Mutating returned array does not change team internals |
| `getAbilitySum — empty team` | Returns 0 |
| `getAbilitySum — sums correctly` | `[{ability:10},{ability:5}]` → 15 |
| `getAbilitySum — negative abilities` | Works with negative floats |

### 4.2 `tests/team-builder/validator.test.ts`

| Test | Constraint |
|------|-----------|
| minSize > maxSize → failure with correct message | C1 |
| idealSize < minSize → failure with correct message | C2 |
| idealSize > maxSize → failure with correct message | C2 |
| null participants → failure | C3 |
| empty array → failure | C3 |
| participants.length < minSize → failure | C4 |
| valid inputs → `{ ok: true }` | — |

### 4.3 `tests/team-builder/sizer.test.ts`

| Test | Description |
|------|-------------|
| Even split: 12 participants, ideal=4 | → 3 slots of 4, 0 unplaced |
| Uneven, absorbed by growth: 14, ideal=4, max=5 | → mixed slot sizes, 0 unplaced |
| Uneven, requires extra team: 13, ideal=4, min=3, max=4 | → 4 teams (e.g., [4,3,3,3]) |
| Hard-cap enforced: 1000 participants, ideal=2, cap=100 | → 100 slots of 2, 800 unplaced |
| Single team: min=3, 5 participants, ideal=5, max=6 | → 1 slot of 5 |

### 4.4 `tests/team-builder/strategies/random.test.ts`

| Test | Description |
|------|-------------|
| All participants placed | sum of bucket lengths === input length |
| Correct bucket count | `buckets.length === slotCount` |
| No participant appears twice | Set membership check |
| Distribution is "random" over runs | Re-running with same input gives different orders (probabilistic: run 10 times, assert not all identical) |

### 4.5 `tests/team-builder/strategies/fair.test.ts`

| Test | Description |
|------|-------------|
| Snake-draft order — 6 participants, 2 teams | `[10,9,8,7,6,5]` → team0 gets [10,7,6], team1 gets [9,8,5] |
| Ability balance — scores differ by ≤ 1 | Formal scenario `fair_balanced` |
| All participants placed | No participant lost |
| Single participant per team edge case | Works with 1 participant per team |

### 4.6 `tests/team-builder/team-builder.test.ts` (integration / scenario tests)

Maps directly to the spec scenarios:

| Test | Scenario ID |
|------|------------|
| 12 participants, ideal=4, random → 3 teams, 0 unplaced | `even_split_random` |
| 14 participants, ideal=4, min=3, max=5, random → all placed, valid sizes | `uneven_split` |
| 6 participants, ability [10..5], ideal=3, fair → ability sums differ ≤ 1 | `fair_balanced` |
| minSize=5, maxSize=3 → success=false, message matches | `invalid_min_max` |
| idealSize=6, min=2, max=4 → success=false, message matches | `invalid_ideal` |
| 1000 participants, ideal=2 → exactly 100 teams, 800 unplaced | `max_teams_cap` |
| empty list → success=false | `empty_participants` |
| 2 participants, minSize=3 → success=false | `not_enough_participants` |
| Additional: all participants on successful result have unique IDs (no duplicates) | custom |
| Additional: FAIR teams contain correct participants (verify IDs) | custom |

---

## 5. Cross-Cutting Concerns

### 5.1 Immutability

- All `Participant` and `TeamConfig` fields are `readonly`.
- `Team.getParticipants()` returns a frozen copy; internals are private (`#participants`).
- `TeamResult` fields are `readonly`; `teams` and `unplaced` are `ReadonlyArray`.

### 5.2 Type Safety

- `Participant[] | null | undefined` is accepted at the boundary to guard against JS callers.
- Internally, after validation, participants are treated as `Participant[]`.
- `Mode` is a TypeScript `enum`; no stringly-typed comparisons internally.

### 5.3 Edge Cases

| Edge case | Handling |
|-----------|---------|
| 0-ability participants | `ability: number` allows 0; no special handling needed |
| Identical abilities | Sort is stable (JS `Array.sort` is stable since ES2019); snake-draft works correctly |
| `maxTeams = 0` | `min(0, 100) = 0` → zero slots → all unplaced. Guard C4 (`participants.length < minSize`) prevents this only if `minSize > 0`. A team count of 0 means all participants are unplaced; `success = true` because we did form 0 valid teams. *Note:* spec says "success=true if at least one team was formed" — with 0 teams formed, `success` should be `false`. Guard should check: `if cap === 0 → return failure("No teams can be formed")` |
| Single participant list equal to idealSize | Forms exactly 1 team |
| `ability` = `Infinity` or `NaN` | Not explicitly handled by spec; `getAbilitySum` will propagate. Consider a validation step or document the behavior. |

### 5.4 No External Dependencies

The team-builder module has zero external dependencies beyond TypeScript builtins. It does **not** import from the existing `src/attractor`, `src/llm`, or `src/agent` modules — it is a self-contained library feature.

---

## 6. Implementation Order (Suggested)

1. **`types.ts`** — Define all interfaces, enums, and constants first. Everything else depends on this.
2. **`team.ts`** + **`team.test.ts`** — Simple class; verify `ITeam` contract immediately.
3. **`validator.ts`** + **`validator.test.ts`** — Guard logic; pure functions, no dependencies.
4. **`sizer.ts`** + **`sizer.test.ts`** — Core arithmetic; test with explicit expected slot arrays.
5. **`strategies/random.ts`** + **`strategies/random.test.ts`** — Shuffle + partition.
6. **`strategies/fair.ts`** + **`strategies/fair.test.ts`** — Snake-draft + sort.
7. **`team-builder.ts`** + **`team-builder.test.ts`** — Orchestrate everything; run all scenario tests.
8. **`index.ts`** — Barrel export; confirm all public surface is accessible.

---

## 7. Message String Constants

Define all required exact message strings as named constants in `types.ts`:

```typescript
export const MESSAGES = {
  MIN_GREATER_THAN_MAX:   'Minimum size cannot be greater than maximum size',
  IDEAL_OUT_OF_RANGE:     'Ideal size must be between minimum and maximum size',
  NO_PARTICIPANTS:        'No participants provided',
  NOT_ENOUGH:             'Not enough participants to form a single team',
  SUCCESS:                'Teams formed successfully',
  SUCCESS_WITH_UNPLACED:  'Teams formed with unplaced participants',
} as const;
```

Tests assert against these constants (not bare string literals) so a single rename propagates everywhere.

---

## 8. Summary Table — Every Class and Method

| File | Export | Type | Methods / Signatures |
|------|--------|------|----------------------|
| `types.ts` | `Mode` | enum | `RANDOM`, `FAIR` |
| `types.ts` | `Participant` | interface | fields: `id`, `name`, `ability` |
| `types.ts` | `TeamConfig` | interface | fields: `idealSize`, `minSize`, `maxSize`, `maxTeams`, `mode` |
| `types.ts` | `ITeam` | interface | `getMemberCount()`, `getParticipants()`, `getAbilitySum()` |
| `types.ts` | `TeamResult` | interface | fields: `success`, `teams`, `unplaced`, `message` |
| `types.ts` | `IDistributionStrategy` | interface | `distribute(participants, slotCount): Participant[][]` |
| `types.ts` | `ITeamBuilder` | interface | `buildTeams(participants, config): TeamResult` |
| `types.ts` | `MAX_TEAMS_ABSOLUTE` | const | `100` |
| `types.ts` | `MESSAGES` | const object | 6 message strings |
| `team.ts` | `Team` | class | `constructor(Participant[])`, `getMemberCount()`, `getParticipants()`, `getAbilitySum()` |
| `validator.ts` | `validate` | function | `(Participant[] \| null \| undefined, TeamConfig) → ValidationResult` |
| `validator.ts` | `ValidationResult` | type | `{ ok: true } \| { ok: false; message: string }` |
| `sizer.ts` | `computeSlotSizes` | function | `(participantCount, config, hardCap) → { slotSizes: number[], unplacedCount: number }` |
| `strategies/random.ts` | `RandomDistributionStrategy` | class | `distribute(participants, slotCount): Participant[][]`; private `shuffle<T>(T[]): T[]` |
| `strategies/fair.ts` | `FairDistributionStrategy` | class | `distribute(participants, slotCount): Participant[][]`; private `snakeDraft<T>(T[], number): T[][]` |
| `team-builder.ts` | `TeamBuilderImpl` | class | `constructor(random, fair)`, `buildTeams(participants, config): TeamResult`; private `#buildFailure(message): TeamResult` |
| `team-builder.ts` | `createTeamBuilder` | factory function | `() → ITeamBuilder` |
| `index.ts` | barrel | — | re-exports all public surface |
