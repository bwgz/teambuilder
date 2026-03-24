# Implementation Tasks: Team Formation

## Sequencing Strategy

**Foundation-first:** Build data models bottom-up, then the orchestrator, then tests. Each task produces a compilable, testable increment.

---

## Tasks

- [ ] 1. **Domain Models**

- [ ] 1.1 Implement `Participant` class
  - Create `src/main/java/com/teambuilder/Participant.java`
  - Fields: `name` (String), `abilityScore` (double)
  - Constructor accepting name and ability score; handle null name gracefully (default to empty string)
  - Getters: `getName()`, `getAbilityScore()`
  - Javadoc file header and method docs per NFR-4
  - _Requirements: FR-1 AC-1, NFR-2, NFR-4, NFR-5_

- [ ] 1.2 Implement `Team` class
  - Create `src/main/java/com/teambuilder/Team.java`
  - Internal `ArrayList<Participant>` for members
  - Methods: `addParticipant(Participant)`, `getParticipants()` (returns unmodifiable list), `size()`, `getTotalSkillScore()`
  - Javadoc file header and method docs
  - _Requirements: FR-6 AC-1/2/3, NFR-2, NFR-4_

- [ ] 1.3 Write unit tests for `Participant` and `Team`
  - Create `src/test/java/com/teambuilder/ParticipantTest.java`
    - Valid construction, getter behavior, null name handling
  - Create `src/test/java/com/teambuilder/TeamTest.java`
    - Add participants, verify size, verify total skill score, empty team returns 0
  - Verify the project compiles and tests pass with `gradle test`
  - _Requirements: NFR-7_

- [ ] 2. **Configuration and Result Types**

- [ ] 2.1 Implement `PlacementStrategy` enum
  - Create `src/main/java/com/teambuilder/PlacementStrategy.java`
  - Values: `RANDOM`, `MINIMIZE_VARIANCE`, `MINIMIZE_MAX_DIFFERENCE`, `SNAKE_DRAFT`
  - Javadoc on enum and each constant
  - _Requirements: FR-1 AC-3, FR-4, FR-5_

- [ ] 2.2 Implement `TeamSizeConfig` class
  - Create `src/main/java/com/teambuilder/TeamSizeConfig.java`
  - Constructor: `TeamSizeConfig(int idealSize, int minSize, int maxSize)`
  - `validate()` method throws `IllegalArgumentException` when:
    - Any size < 1
    - `minSize > maxSize`
    - `idealSize < minSize` or `idealSize > maxSize`
  - Getters for all three fields
  - Javadoc file header and method docs
  - _Requirements: FR-1 AC-2, FR-2 AC-1/2, NFR-5_

- [ ] 2.3 Implement `TeamBuildResult` class
  - Create `src/main/java/com/teambuilder/TeamBuildResult.java`
  - Inner `Status` enum: `SUCCESS`, `PARTIAL`, `FAILURE`
  - Fields: `teams` (List\<Team\>), `status` (Status), `unplacedParticipants` (List\<Participant\>), `message` (String)
  - Static factory methods for clarity: `success(teams)`, `partial(teams, unplaced, message)`, `failure(message)`
  - Getters for all fields
  - Javadoc file header and method docs
  - _Requirements: FR-1 AC-4/5/6, NFR-2_

- [ ] 2.4 Write unit tests for `TeamSizeConfig` and `TeamBuildResult`
  - Create `src/test/java/com/teambuilder/TeamSizeConfigTest.java`
    - Valid config accepted, min > max rejected, ideal outside range rejected, boundary case min = max = ideal, sizes < 1 rejected
  - Create `src/test/java/com/teambuilder/TeamBuildResultTest.java`
    - SUCCESS factory, PARTIAL factory with unplaced list, FAILURE factory with message
  - Verify all tests pass with `gradle test`
  - _Requirements: NFR-7_

- [ ] 3. **Core Team Builder — Allocation and Random Placement**

- [ ] 3.1 Implement `TeamBuilder` class with input validation and team slot allocation
  - Create `src/main/java/com/teambuilder/TeamBuilder.java`
  - `buildTeams(List<Participant>, TeamSizeConfig, PlacementStrategy)` method
  - Input validation: null list → FAILURE, empty list → FAILURE, catch `IllegalArgumentException` from config validation → FAILURE
  - Participant count < minSize → FAILURE
  - Team slot allocation algorithm:
    - Compute number of teams and their sizes based on ideal/min/max
    - Evenly divisible → all teams of ideal size
    - Remainder distributed within min/max bounds
    - Cap at 100 teams; excess participants → PARTIAL
  - Javadoc file header and method docs
  - Define constant `MAX_TEAMS = 100`
  - _Requirements: FR-1, FR-2 AC-3, FR-3, NFR-5_

- [ ] 3.2 Implement random placement strategy
  - Within `TeamBuilder`, add private method for random placement
  - Shuffle participant list with `Collections.shuffle()`
  - Assign shuffled participants sequentially to pre-allocated team slots
  - _Requirements: FR-4 AC-1/2_

- [ ] 3.3 Write unit tests for team allocation and random placement
  - Create `src/test/java/com/teambuilder/TeamBuilderTest.java`
  - **Validation tests:** null list → FAILURE, empty list → FAILURE, invalid config → FAILURE, count < minSize → FAILURE
  - **Allocation tests:** evenly divisible → all ideal size, non-divisible → sizes within min/max, 100-team cap, exactly 100 teams allowed
  - **Random tests:** all participants placed (SUCCESS), team sizes within constraints, multiple runs produce different orderings
  - Verify all tests pass with `gradle test`
  - _Requirements: FR-1, FR-2, FR-3, FR-4, NFR-7_

- [ ] 4. **Fairness Placement Strategies**

- [ ] 4.1 Implement snake draft strategy
  - Add private method in `TeamBuilder` for snake draft placement
  - Sort participants by ability score descending
  - Assign in snake order across pre-allocated teams (forward pass, then reverse, repeat)
  - _Requirements: FR-5 AC-1/2/3_

- [ ] 4.2 Implement minimize variance strategy
  - Add private method in `TeamBuilder` for minimize-variance placement
  - Sort participants by ability score descending
  - Greedy: assign each participant to the non-full team with the lowest current total score
  - _Requirements: FR-5 AC-1/2/3_

- [ ] 4.3 Implement minimize max difference strategy
  - Add private method in `TeamBuilder` for minimize-max-difference placement
  - Greedy initial assignment (same as minimize variance)
  - Post-processing: attempt local swaps between strongest and weakest teams to reduce max difference
  - _Requirements: FR-5 AC-1/2/3_

- [ ] 4.4 Write unit tests for all fairness strategies
  - Add to `TeamBuilderTest.java`:
  - **Snake draft:** balanced teams with known inputs, team sizes respected
  - **Minimize variance:** verify variance is lower than random baseline for a fixed input set
  - **Minimize max difference:** verify max-min gap is reduced
  - **Equal scores:** all strategies produce teams with equal totals
  - **Size constraints:** all fairness strategies respect min/max
  - Verify all tests pass with `gradle test`
  - _Requirements: FR-5, NFR-7_

- [ ] 5. **Edge Cases and Final Validation**

- [ ] 5.1 Write edge case tests
  - Add to `TeamBuilderTest.java`:
  - Single participant with min <= 1 → one team of size 1
  - min = max = ideal → all teams exactly that size
  - Participant with null name → handled gracefully
  - More than 100 teams needed → PARTIAL with correct unplaced count
  - Remaining participants after formation → PARTIAL with unplaced list
  - _Requirements: Edge cases from requirements doc, NFR-5_

- [ ] 5.2 Full build verification
  - Run `gradle build` to confirm compilation + all tests pass
  - Review Javadoc completeness across all source files
  - Verify no magic numbers, consistent naming, proper encapsulation
  - _Requirements: NFR-3, NFR-4_
