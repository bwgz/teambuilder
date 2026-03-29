# Requirements Document: Team Formation

## Overview

Teambuilder is a general-purpose team building application. Its core feature is taking a set of participants registered for an event and dividing them into teams. The system must support both random placement and ability-based fairness optimization. This is a non-interactive Java library (no GUI, no CLI) validated through unit tests.

## Source

- **Assignment:** Programming Assessment (with weekly GitHub commits due)
- **Course:** CS 358 - Software Engineering (Spring 2026)
- **Due Date:** 2026-03-23
- **Points:** 50

## User Roles

- **Event Organizer (API Consumer):** A developer or system that invokes the team-building interface to divide participants into teams for an event.

## Domain Model

- **Participant:** A person registered for an event. Has a name (String) and an ability/skill score (numeric).
- **Team:** A group of participants assigned together. Exposes member count, participant list, and aggregate skill score.
- **Event Configuration:** Defines team size constraints (ideal, min, max) and placement strategy (random vs. fairness).

---

## Functional Requirements

### FR-1: Team Builder Interface

**User Story:** As an event organizer, I want a programmatic interface to build teams from a list of participants, so that I can divide registrants into balanced or random groups.

**Acceptance Criteria:**

1. WHEN the team builder is invoked THEN the system SHALL accept a list of Participant objects as input.
2. WHEN the team builder is invoked THEN the system SHALL accept team size configuration: ideal size, minimum size, and maximum size.
3. WHEN the team builder is invoked THEN the system SHALL accept a placement strategy option: either "maximize ability fairness" or "random."
4. WHEN team generation succeeds THEN the system SHALL return a list of teams, where each team is a list of participants.
5. WHEN team generation fails entirely THEN the system SHALL indicate that teams could not be generated via a status flag.
6. WHEN team generation succeeds but some participants could not be placed THEN the system SHALL return a status flag indicating partial placement AND a separate list of unplaced participants.

### FR-2: Team Size Validation

**User Story:** As an event organizer, I want the system to validate my team size parameters, so that I don't accidentally provide invalid configuration.

**Acceptance Criteria:**

1. WHEN minimum size is greater than maximum size THEN the system SHALL gracefully handle the error (not crash) and indicate the invalid configuration.
2. WHEN ideal size is not equal to or between the minimum and maximum size THEN the system SHALL gracefully handle the error and indicate the invalid configuration.
3. WHEN the number of generated teams would exceed 100 THEN the system SHALL not create more than 100 teams.

### FR-3: Team Generation — Ideal Size

**User Story:** As an event organizer, I want participants divided into teams of the ideal size whenever possible, so that team sizes match my preference.

**Acceptance Criteria:**

1. WHEN the participant count is evenly divisible by the ideal size THEN the system SHALL create teams all of the ideal size.
2. WHEN the participant count is not evenly divisible by the ideal size THEN the system SHALL use the minimum and maximum sizes to create teams as close to the ideal size as possible.

### FR-4: Team Generation — Random Placement

**User Story:** As an event organizer, I want to randomly assign participants to teams, so that team composition is unbiased.

**Acceptance Criteria:**

1. WHEN random placement is selected THEN the system SHALL assign participants to teams in a random order.
2. WHEN random placement is used THEN the system SHALL still respect ideal, min, and max team size constraints.

### FR-5: Team Generation — Ability Fairness

**User Story:** As an event organizer, I want to maximize the fairness of teams by balancing ability scores, so that no single team is significantly stronger or weaker than others.

**Acceptance Criteria:**

1. WHEN ability fairness is selected THEN the system SHALL use each participant's ability score to distribute participants across teams.
2. WHEN ability fairness is used THEN the system SHALL support multiple fairness strategies: minimize variance, minimize max difference between strongest/weakest team, and snake-draft assignment (sort by ability, assign in snake order).
3. WHEN ability fairness is used THEN the system SHALL still respect ideal, min, and max team size constraints.

### FR-6: Team Interface

**User Story:** As an event organizer, I want each team to expose useful information, so that I can inspect team composition.

**Acceptance Criteria:**

1. WHEN a team is created THEN the team SHALL provide the number of team members.
2. WHEN a team is created THEN the team SHALL provide the list of participants on the team.
3. WHEN a team is created THEN the team SHALL provide the skill assessment sum of all participants on the team.

---

## Non-Functional Requirements

### NFR-1: No Interactive UI
- The program SHALL NOT include a GUI or command-line interface.
- All functionality SHALL be exercised through unit tests.

### NFR-2: Object-Oriented Design
- The system SHALL use multiple classes that map to real-world concepts (e.g., Team, Participant).
- Classes SHALL encapsulate related data and methods together.
- Classes SHALL hide implementation details (abstraction).

### NFR-3: Code Quality & Style
- Code SHALL use uniform indentation.
- Code SHALL use consistent naming conventions for variables and constants.
- Code SHALL be grouped into logical classes and methods, each in its own source file.
- Code SHALL use whitespace effectively for readability.
- Code SHALL NOT contain hard-coded magic numbers.
- Code SHALL use standard library data structures and algorithms where appropriate.

### NFR-4: Documentation
- Every file SHALL include documentation of file purpose, author, and date.
- Every method SHALL include documentation of purpose and parameter meaning.
- Inline comments SHALL explain the purpose of logical code groupings (not just translate code to English).

### NFR-5: Robustness
- All bad input SHALL be handled gracefully.
- The program SHALL recover from errors and allow continued use.

### NFR-6: Extensibility
- Code SHALL be written for extensibility, as a peer may add features and automated tests.

### NFR-7: Unit Testing
- The system SHALL include unit tests that verify all required team-building functionality.

### NFR-8: Language & Tooling
- The system SHALL be written in Java.
- The required IDE is Visual Studio Code.

---

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Empty participant list | System indicates teams could not be generated |
| Participant count < minimum team size | System indicates teams could not be generated |
| min > max | System gracefully rejects with error indication |
| ideal < min or ideal > max | System gracefully rejects with error indication |
| Participant count not divisible by ideal size | System uses min/max to create closest-to-ideal teams |
| Remaining participants after team formation | System indicates partial success with unplaced participants |
| Exactly 100 teams would be created | System allows it (100 is the limit) |
| More than 100 teams would be needed | System creates up to 100 teams; remaining participants reported as unplaced (partial success) |
| All participants have the same ability score | Fairness mode produces teams with equal totals |
| One participant | System creates one team of size 1 (if min <= 1) |
| min = max = ideal | All teams must be exactly that size |
| Null participant list | System gracefully handles with error indication |
| Participant with null/missing ability score | System gracefully handles |

---

## Out of Scope

- GUI or command-line interface
- Persistence / database storage
- Network/API endpoints
- Event management (creating/editing events)
- Participant registration
- Authentication or authorization

## Resolved Questions

1. **Participant class fields:** Name (String) + ability score (numeric). No ID field.
2. **Fairness algorithm:** Support all three strategies — minimize variance, minimize max difference, and snake draft.
3. **Unplaced participants:** Return both a status flag AND a separate list of unplaced participants.
4. **Team limit behavior:** Partial success — create up to 100 teams, report remaining as unplaced.

---

## Rubric Summary (50 points total)

| Criteria | Points | Key Expectations |
|---|---|---|
| Source Code Documentation | 5 | File headers, method docs, meaningful inline comments |
| Style | 7 | Indentation, naming, logical grouping, own source files, whitespace, no magic numbers, efficient code |
| Encapsulation & Abstraction | 7 | Well-chosen classes, data hiding, cohesive methods |
| Functionality | 25 | Meets all functional requirements as specified |
| Version Control 1 (by 2026-03-03) | 2 | Commit with meaningful message |
| Version Control 2 (by 2026-03-10) | 2 | Commit with meaningful message |
| Version Control 3 (by 2026-03-23) | 2 | Commit with meaningful message |
