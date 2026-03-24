# Evaluation: example-01 vs. Programming Assessment Rubric

## Rubric Scoring (50 points total)

---

### 1. Source Code Documentation — 4/5 (Good)

**Rubric (5 pts Full Marks):** Every file documented with purpose, author, date. Every method documented with purpose and parameter meaning. Inline comments explain purpose of logical groupings.

**What's done well:**
- All 11 files (6 source + 5 test) have file-level Javadoc with purpose, `@author`, and `@since`
- Every public and private method has Javadoc with `@param` and `@return` tags
- TeamBuilder.java has good section-separator comments (`// --- Input validation ---`, `// --- Determine team sizes ---`, etc.)
- Algorithm comments explain non-obvious logic (e.g., "Forward pass: team 0 → team N-1", "After swap: stronger loses scoreDelta, weaker gains scoreDelta")

**What's light:**
- Simpler classes (Participant, Team, TeamBuildResult, PlacementStrategy) have Javadoc but no inline comments explaining logical groupings — the rubric explicitly wants inline comments "in logical groupings" even in straightforward code
- `improveMaxDifference` has a hardcoded `1000` for `maxIterations` without a named constant or comment explaining why 1000
- The test files have file-level Javadoc but individual test methods lack Javadoc (only descriptive method names)

**Verdict:** Solid documentation overall, but the rubric's "Full Marks" requires inline comments across the board, not just in complex methods. A strict grader would dock 1 point for the lighter files.

---

### 2. Style — 7/7 (Full Marks)

**Rubric (7 pts Full Marks):** (1) Uniform indentation, (2) Consistent naming, (3) Logical classes/methods, (4) Each class in own file, (5) Effective whitespace, (6) No magic numbers, (7) Efficient use of standard library.

| Criterion | Met? | Evidence |
|-----------|------|----------|
| (1) Uniform indentation | Yes | 4-space indentation throughout all files |
| (2) Consistent naming | Yes | camelCase methods/fields, PascalCase classes, UPPER_SNAKE constants |
| (3) Logical classes/methods | Yes | 6 classes with clear single responsibilities; TeamBuilder decomposes into 12 well-named private methods |
| (4) Own source files | Yes | Each class/enum is in its own `.java` file |
| (5) Effective whitespace | Yes | Blank lines between methods, logical sections separated |
| (6) No magic numbers | Yes | `MAX_TEAMS = 100`, `DEFAULT_ABILITY_SCORE = 0.0` are named constants |
| (7) Efficient stdlib use | Yes | `Collections.shuffle()`, `Collections.unmodifiableList()`, `Comparator.comparingDouble()`, streams for aggregation |

**One minor note:** `maxIterations = 1000` in `improveMaxDifference` is a local variable rather than a named class constant. A strict grader could flag this, but it's borderline since it's local and contextual.

**Verdict:** All 7 criteria clearly met.

---

### 3. Encapsulation & Abstraction — 7/7 (Full Marks)

**Rubric (7 pts Full Marks):** All classes encapsulate related data and methods. Data and methods abstract (hide) information not needed by other objects.

| Class | Encapsulation | Abstraction |
|-------|---------------|-------------|
| Participant | `private final` fields, no setters, immutable | Only exposes name and score |
| Team | `private final` list, returns `Collections.unmodifiableList()` | Hides internal ArrayList; exposes only size, participants (read-only), and total score |
| TeamSizeConfig | `private final` fields, immutable | Validation logic encapsulated in `validate()` |
| TeamBuildResult | `private` constructor, factory methods only, `private final` fields | Hides construction details; consumers use `success()`, `partial()`, `failure()` |
| TeamBuilder | All algorithm methods are `private` | Only `buildTeams()` is public; all placement strategies, allocation logic, and swap optimization are hidden |
| PlacementStrategy | Enum — inherently encapsulated | Strategy selection without exposing implementation |

**Verdict:** Excellent encapsulation throughout. Data hiding is consistent — no public fields, no leaking mutable state, factory pattern on the result class. Well-chosen class boundaries that map to domain concepts.

---

### 4. Functionality — 22/25 (Minor differences)

**Rubric (25 pts):** Meets functionality requirements as specified.

**Requirements checklist:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-1.1: Accept list of Participants | PASS | `buildTeams(List<Participant>, ...)` |
| FR-1.2: Accept ideal, min, max size | PASS | `TeamSizeConfig` parameter |
| FR-1.3: Option for fairness or random | PASS | `PlacementStrategy` enum |
| FR-1.4: Return list of teams of participants | PASS | `TeamBuildResult.getTeams()` |
| FR-1.5: Indicate if teams could not be generated | PASS | `Status.FAILURE` |
| FR-1.6: Indicate partial placement + unplaced list | PASS | `Status.PARTIAL` + `getUnplacedParticipants()` |
| FR-2.1: Graceful min > max handling | PASS | Returns FAILURE with message |
| FR-2.2: Graceful ideal outside range | PASS | Returns FAILURE with message |
| FR-2.3: No more than 100 teams | PASS | `MAX_TEAMS = 100` enforced |
| FR-3.1: Ideal size when evenly divisible | PASS | Tested and verified |
| FR-3.2: Use min/max when not divisible | PASS | `allocateTeamSizes` distributes remainder |
| FR-4.1: Random placement | PASS | `Collections.shuffle()` |
| FR-4.2: Random respects size constraints | PASS | Tested |
| FR-5.1: Use ability scores for fairness | PASS | All three strategies sort by ability |
| FR-5.2: Three fairness strategies | PASS | Snake draft, minimize variance, minimize max diff |
| FR-5.3: Fairness respects size constraints | PASS | Tested across all strategies |
| FR-6.1: Team member count | PASS | `Team.size()` |
| FR-6.2: Team participant list | PASS | `Team.getParticipants()` |
| FR-6.3: Team skill sum | PASS | `Team.getTotalSkillScore()` |

**Issues that cost points:**

1. **The assignment says "as defined in the starting repository"** for the Participant class — the template repo likely has a predefined `Participant` class that should be used or extended, not replaced. Our implementation creates its own from scratch. If the template had a different Participant API (e.g., `int` score instead of `double`, or specific field names), this could be a compatibility problem. **(-1 to -2 points risk)**

2. **"The program shall define an interface to build teams"** — The assignment says "interface" twice. This likely means a Java `interface` (e.g., `TeamBuilderInterface` or similar), not just a class with a public method. Our `TeamBuilder` is a concrete class. The rubric is looking for OO design patterns, and a Java interface would demonstrate abstraction better. **(-1 point risk)**

3. **"The program define an interface on the list of teams returned"** — Similarly, the Team-related requirements say "interface" for the team operations (member count, participant list, skill sum). Our `Team` is a concrete class, not a Java `interface`. **(-1 point risk)**

**Verdict:** All functional behaviors work correctly and are well-tested. However, the assignment's repeated use of the word "interface" likely means actual Java interfaces were expected. And the Participant class may not match the starter template. These are specification-compliance issues, not bugs.

---

### 5. Version Control 1 (by March 3rd) — ?/2
### 6. Version Control 2 (by March 10th) — ?/2
### 7. Version Control 3 (by March 23rd) — ?/2

**Cannot evaluate** — this project has no git history (the working directory is not a git repository). If no commits were pushed to GitHub by the required dates, this is **0/6**.

---

## Score Summary

| Criteria | Points Available | Score | Rating |
|----------|-----------------|-------|--------|
| Source Code Documentation | 5 | **4** | Good |
| Style | 7 | **7** | Full Marks |
| Encapsulation & Abstraction | 7 | **7** | Full Marks |
| Functionality | 25 | **22** | Minor differences |
| Version Control 1 (Mar 3) | 2 | **?** | Unknown — no git repo |
| Version Control 2 (Mar 10) | 2 | **?** | Unknown — no git repo |
| Version Control 3 (Mar 23) | 2 | **?** | Unknown — no git repo |
| **Total** | **50** | **40 + ?/6** | |

**Best case (all commits made): 46/50 (92%)**
**Worst case (no commits): 40/50 (80%)**

---

## Recommendations to Improve Score

1. **Add Java `interface` types** — Create `ITeamBuilder` and `ITeam` interfaces that the concrete classes implement. The assignment explicitly says "define an interface" twice. This is likely worth 2-3 points under Functionality.

2. **Add more inline comments** — The simpler classes (Participant, Team, TeamBuildResult) need at least a few inline comments explaining logical groupings, even if the code is straightforward. This would move Documentation from 4 → 5.

3. **Check the starter template** — If the template repo defines a `Participant` class, ensure compatibility or extend it rather than replacing it.

4. **Extract `maxIterations = 1000`** to a named class constant (`private static final int MAX_SWAP_ITERATIONS = 1000`).

5. **Ensure git commits** are pushed to GitHub with meaningful messages by the three checkpoint dates.
