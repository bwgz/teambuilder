# Design Document: Team Formation

## Overview

A pure Java library that divides a list of participants into teams based on configurable size constraints and placement strategies. The library supports random assignment and three ability-based fairness algorithms. It returns a result object containing formed teams, a status flag, and any unplaced participants.

No GUI, CLI, or persistence — all functionality is validated through unit tests.

## Architecture

### System Overview

```
┌──────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│   API Consumer   │─────▶│   TeamBuilder     │─────▶│ TeamBuildResult  │
│  (test / caller) │      │  (entry point)    │      │ (teams + status) │
└──────────────────┘      └───────────────────┘      └──────────────────┘
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                 ┌────────────────┐ ┌───────────────────┐
                 │ TeamSizeConfig │ │ PlacementStrategy  │
                 │ (validation)   │ │ (enum / interface) │
                 └────────────────┘ └───────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                   ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
                   │   Random    │  │ MinVariance  │  │ SnakeDraft  │
                   │  Strategy   │  │ / MinMaxDiff │  │  Strategy   │
                   └─────────────┘  └──────────────┘  └─────────────┘
```

The consumer creates `Participant` objects, configures team sizes via `TeamSizeConfig`, chooses a `PlacementStrategy`, and calls `TeamBuilder.buildTeams(...)`. The result is a `TeamBuildResult` containing the list of `Team` objects, a status indicator, and any unplaced participants.

### Technology Stack

| Concern | Choice |
|---------|--------|
| Language | Java 21 (Temurin LTS) |
| Build | Gradle 8.12, `java-library` plugin |
| Testing | JUnit 5 + AssertJ |
| Package | `com.teambuilder` |

---

## Components and Interfaces

### Participant

**Purpose:** Represents a person registered for an event.

**Responsibilities:**
- Store participant name and ability score
- Provide read access to both fields
- Handle null/missing ability score gracefully (default to 0)

**Interface:**
```java
public class Participant {
    public Participant(String name, double abilityScore);
    public String getName();
    public double getAbilityScore();
}
```

### Team

**Purpose:** A group of assigned participants. Exposes aggregate information per FR-6.

**Responsibilities:**
- Maintain an ordered list of participants
- Compute member count and total skill score

**Interface:**
```java
public class Team {
    public void addParticipant(Participant participant);
    public List<Participant> getParticipants();
    public int size();
    public double getTotalSkillScore();
}
```

### TeamSizeConfig

**Purpose:** Encapsulates and validates team-size constraints (ideal, min, max).

**Responsibilities:**
- Validate that min <= ideal <= max (FR-2)
- Expose getters for all three values

**Interface:**
```java
public class TeamSizeConfig {
    public TeamSizeConfig(int idealSize, int minSize, int maxSize);
    public int getIdealSize();
    public int getMinSize();
    public int getMaxSize();
    public void validate();  // throws IllegalArgumentException on bad config
}
```

**Validation Rules (FR-2):**
1. `minSize > maxSize` → error
2. `idealSize < minSize || idealSize > maxSize` → error
3. All sizes must be >= 1

### PlacementStrategy (enum)

**Purpose:** Identifies which algorithm to use for team assignment.

**Values:**
```java
public enum PlacementStrategy {
    RANDOM,
    MINIMIZE_VARIANCE,
    MINIMIZE_MAX_DIFFERENCE,
    SNAKE_DRAFT
}
```

`RANDOM` maps to FR-4. The three fairness strategies map to FR-5.

### TeamBuilder

**Purpose:** The main entry point. Orchestrates validation, team slot allocation, and participant placement.

**Responsibilities:**
- Accept participants, config, and strategy
- Delegate to `TeamSizeConfig.validate()`
- Determine how many teams to create and their sizes (FR-3)
- Enforce the 100-team cap (FR-2 AC-3)
- Delegate participant assignment to the chosen strategy
- Return a `TeamBuildResult`

**Interface:**
```java
public class TeamBuilder {
    public TeamBuildResult buildTeams(
        List<Participant> participants,
        TeamSizeConfig config,
        PlacementStrategy strategy
    );
}
```

### TeamBuildResult

**Purpose:** Encapsulates the outcome of a team-building operation (FR-1 AC-4/5/6).

**Responsibilities:**
- Hold the list of formed teams
- Hold a status flag (SUCCESS, FAILURE, PARTIAL)
- Hold the list of unplaced participants (if any)
- Hold an error message (if any)

**Interface:**
```java
public class TeamBuildResult {
    public List<Team> getTeams();
    public Status getStatus();
    public List<Participant> getUnplacedParticipants();
    public String getMessage();

    public enum Status {
        SUCCESS,   // all participants placed
        PARTIAL,   // some participants unplaced
        FAILURE    // no teams could be formed
    }
}
```

---

## Data Models

### Participant

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | String | Yes | Non-null, non-blank | Participant's display name |
| abilityScore | double | Yes | Defaults to 0.0 if not provided | Numeric skill rating |

### Team

| Field | Type | Description |
|-------|------|-------------|
| participants | List\<Participant\> | Ordered list of members |

**Derived properties (not stored):**
- `size()` → `participants.size()`
- `getTotalSkillScore()` → sum of all `participant.getAbilityScore()`

### TeamSizeConfig

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| idealSize | int | >= 1 and between min/max | Preferred team size |
| minSize | int | >= 1 and <= maxSize | Smallest allowed team |
| maxSize | int | >= minSize | Largest allowed team |

### TeamBuildResult

| Field | Type | Description |
|-------|------|-------------|
| teams | List\<Team\> | Formed teams (empty on FAILURE) |
| status | Status | SUCCESS, PARTIAL, or FAILURE |
| unplacedParticipants | List\<Participant\> | Participants not assigned to a team |
| message | String | Human-readable status/error message |

---

## Key Algorithms

### Team Slot Allocation (FR-3)

Before placing participants, `TeamBuilder` determines how many teams to create and their target sizes:

1. Compute `numTeams = participantCount / idealSize`.
2. If `participantCount % idealSize == 0` → create `numTeams` teams of `idealSize`.
3. Otherwise, compute the remainder (`participantCount % idealSize`). Distribute the remainder by increasing some teams to `idealSize + 1` (up to `maxSize`) or decreasing some to `idealSize - 1` (down to `minSize`).
4. If no valid distribution exists within min/max bounds, place as many as possible and report the rest as unplaced (PARTIAL).
5. Cap at 100 teams (FR-2 AC-3). If more would be needed, create 100 and report remaining participants as unplaced.

### Random Placement (FR-4)

1. Shuffle the participant list using `Collections.shuffle()`.
2. Assign participants sequentially to the pre-allocated team slots.

### Ability Fairness Strategies (FR-5)

**Snake Draft:**
1. Sort participants by ability score descending.
2. Assign to teams in snake order: Team 1, 2, ..., N, N, ..., 2, 1, 1, 2, ...
3. This naturally balances total scores across teams.

**Minimize Variance:**
1. Sort participants by ability score descending.
2. Use a greedy approach: assign each participant to the team with the lowest current total score.
3. Respects team size constraints — skip teams that are already full.

**Minimize Max Difference:**
1. Sort participants by ability score descending.
2. Use a greedy approach: assign each participant to the team with the lowest current total score (same as minimize variance, but optimization target differs).
3. After initial assignment, perform local swaps between the strongest and weakest teams if it reduces the max difference.

---

## Error Handling

### Error Categories and Responses

| Scenario | Status | Behavior | Requirement |
|----------|--------|----------|-------------|
| Null participant list | FAILURE | Return result with error message | FR-1, NFR-5 |
| Empty participant list | FAILURE | Return result with error message | Edge case |
| min > max | FAILURE | Return result with validation error | FR-2 AC-1 |
| ideal outside min/max range | FAILURE | Return result with validation error | FR-2 AC-2 |
| Participant count < minSize | FAILURE | Cannot form even one valid team | Edge case |
| More than 100 teams needed | PARTIAL | Create up to 100, report rest as unplaced | FR-2 AC-3 |
| Remainder can't fit in min/max | PARTIAL | Place as many as possible, report unplaced | FR-1 AC-6 |
| Participant with null name | Graceful | Default to empty string or reject | NFR-5 |

### Design Principle

The system never throws unchecked exceptions to the caller. All error conditions are communicated through `TeamBuildResult` with an appropriate `Status` and `message`. This follows NFR-5 (robustness) and allows continued use after errors.

---

## Testing Strategy

### Unit Testing (JUnit 5 + AssertJ)

**Participant Tests:**
- Construction with valid name and score
- Default ability score behavior
- Null/blank name handling

**Team Tests:**
- Adding participants and verifying size
- Total skill score calculation
- Empty team behavior

**TeamSizeConfig Tests:**
- Valid configurations accepted
- min > max rejected
- ideal outside range rejected
- Boundary values (min = max = ideal)

**TeamBuilder Tests — Size Allocation (FR-3):**
- Evenly divisible participant count → all teams ideal size
- Non-divisible count → teams within min/max bounds
- 100-team cap enforcement

**TeamBuilder Tests — Random Placement (FR-4):**
- All participants placed
- Team sizes within constraints
- Randomness verification (run multiple times, check different orderings)

**TeamBuilder Tests — Fairness Strategies (FR-5):**
- Snake draft produces balanced teams
- Minimize variance reduces score variance across teams
- Minimize max difference reduces gap between strongest/weakest
- All participants with equal scores → equal team totals
- Team size constraints still respected

**TeamBuildResult Tests (FR-1):**
- SUCCESS status when all placed
- PARTIAL status with unplaced participants list
- FAILURE status on invalid input

**Edge Case Tests:**
- Empty list → FAILURE
- Null list → FAILURE
- Single participant with min <= 1 → one team of size 1
- Participant count < minSize → FAILURE
- Exactly 100 teams → SUCCESS
- 101+ teams needed → PARTIAL with unplaced

---

## File Layout

```
src/
├── main/java/com/teambuilder/
│   ├── Participant.java
│   ├── Team.java
│   ├── TeamSizeConfig.java
│   ├── PlacementStrategy.java       (enum)
│   ├── TeamBuilder.java             (main entry point)
│   └── TeamBuildResult.java
└── test/java/com/teambuilder/
    ├── ParticipantTest.java
    ├── TeamTest.java
    ├── TeamSizeConfigTest.java
    ├── TeamBuilderTest.java          (covers FR-1 through FR-5, edge cases)
    └── TeamBuildResultTest.java
```

Each class resides in its own source file per NFR-3. All files include Javadoc headers per NFR-4.

---

## Design Decisions

### Decision: Error Reporting via Result Object vs. Exceptions

**Options:**
1. **Throw exceptions** for invalid input — simple, standard Java pattern
2. **Return a result object** with status flag — caller never catches exceptions

**Decision:** Result object (`TeamBuildResult` with `Status` enum)

**Rationale:** The requirements explicitly call for a "status flag" (FR-1 AC-5/6) and "graceful handling" (FR-2, NFR-5). A result object maps directly to these requirements and makes partial success (some participants unplaced) easy to represent. `TeamSizeConfig.validate()` may throw internally, but `TeamBuilder` catches it and wraps it into a FAILURE result.

### Decision: PlacementStrategy as Enum vs. Strategy Interface

**Options:**
1. **Enum** — simple, all strategies built in
2. **Strategy interface** — more extensible, follows Strategy pattern

**Decision:** Enum for the public API, with internal strategy dispatch in `TeamBuilder`

**Rationale:** The requirements define a fixed set of four strategies. An enum keeps the API simple for the consumer. Internally, `TeamBuilder` can use a switch or method-per-strategy. If extensibility is needed later (NFR-6), the enum can be refactored to an interface without changing the result model.

### Decision: Ability Score Type — int vs. double

**Options:**
1. **int** — simpler, no floating-point concerns
2. **double** — more flexible for fractional scores

**Decision:** `double`

**Rationale:** The requirements say "numeric" without specifying integer. Using `double` is more general and avoids constraining future use. Fairness calculations (variance, averages) naturally produce fractional values anyway.

---

## Requirements Traceability

| Requirement | Design Element |
|-------------|---------------|
| FR-1 AC-1 (accept participants) | `TeamBuilder.buildTeams(List<Participant>, ...)` |
| FR-1 AC-2 (accept size config) | `TeamSizeConfig` parameter |
| FR-1 AC-3 (accept strategy) | `PlacementStrategy` enum parameter |
| FR-1 AC-4 (return teams) | `TeamBuildResult.getTeams()` |
| FR-1 AC-5 (failure flag) | `TeamBuildResult.Status.FAILURE` |
| FR-1 AC-6 (partial + unplaced) | `TeamBuildResult.Status.PARTIAL` + `getUnplacedParticipants()` |
| FR-2 AC-1 (min > max) | `TeamSizeConfig.validate()` |
| FR-2 AC-2 (ideal outside range) | `TeamSizeConfig.validate()` |
| FR-2 AC-3 (100-team cap) | `TeamBuilder` allocation logic |
| FR-3 (ideal size teams) | Team slot allocation algorithm |
| FR-4 (random placement) | `PlacementStrategy.RANDOM` |
| FR-5 (fairness strategies) | `MINIMIZE_VARIANCE`, `MINIMIZE_MAX_DIFFERENCE`, `SNAKE_DRAFT` |
| FR-6 (team interface) | `Team.size()`, `getParticipants()`, `getTotalSkillScore()` |
| NFR-2 (OO design) | Separate classes per domain concept |
| NFR-4 (documentation) | Javadoc on every file and method |
| NFR-5 (robustness) | Result-object error reporting, no unchecked exceptions |
| NFR-6 (extensibility) | Clean interfaces, enum-based strategy selection |
