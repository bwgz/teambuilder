---
name: spec-driven-development
description: Systematic three-phase approach to feature development using Requirements, Design, and Tasks phases. Transforms vague feature ideas into well-defined, implementable solutions that reduce ambiguity, improve quality, and enable effective AI collaboration.
license: MIT
compatibility: Claude Code, Cursor, VS Code, Windsurf
metadata:
  category: methodology
  complexity: intermediate
  author: Kiro Team
  version: "2.0.0"
---

# Spec-Driven Development

A systematic three-phase methodology for feature development. Each phase has a dedicated skill with detailed guidance — this skill orchestrates the workflow across all three.

## When to Use This Skill

**Ideal scenarios:**
- Complex features with multiple components, integrations, or user interactions
- High-stakes projects where rework costs are significant
- Team collaboration requiring shared understanding
- AI-assisted development where clear structure improves output quality
- Knowledge preservation for future maintainers

**Less suitable:**
- Simple bug fixes with obvious solutions
- Experimental prototypes for rapid iteration
- Time-critical hotfixes requiring immediate action
- Well-established patterns with minimal ambiguity

## The Three-Phase Workflow

Each phase must be completed and reviewed before moving to the next. Outputs from each phase feed into the next as inputs.

```
Phase 1: Requirements ──► Phase 2: Design ──► Phase 3: Tasks ──► Implementation
   (what)                   (how)                (plan)
```

### Phase 1: Requirements Gathering

**Skill:** `/requirements-engineering`

**Purpose:** Transform vague feature ideas into clear, testable requirements using EARS format.

**Process:**
1. Capture user stories expressing value and purpose
2. Define acceptance criteria using EARS format
3. Identify edge cases and constraints
4. Validate completeness using the requirements checklist

**Output:** `01-requirements.md` — User stories, acceptance criteria, edge cases, non-functional requirements, open questions.

**Gate:** Requirements must be reviewed and approved before proceeding to design. All open questions must be resolved.

### Phase 2: Design Documentation

**Skill:** `/design-documentation`

**Purpose:** Create a comprehensive technical blueprint that addresses all approved requirements.

**Process:**
1. Analyze approved requirements and research technical approaches
2. Define system architecture and component interactions
3. Specify data models, interfaces, and error handling
4. Document key decisions with rationale
5. Plan testing strategy

**Output:** `02-design.md` — Architecture, components, interfaces, data models, error handling, testing strategy, decision log.

**Gate:** Design must be reviewed and approved before proceeding to tasks. All requirements must be traceable to design elements.

### Phase 3: Task Planning

**Skill:** `/task-breakdown`

**Purpose:** Convert the approved design into actionable, sequenced implementation tasks.

**Process:**
1. Analyze design components and identify all implementation needs
2. Map dependencies between tasks
3. Sequence tasks using an appropriate strategy (foundation-first, feature-slice, risk-first, or hybrid)
4. Write detailed task descriptions with completion criteria

**Output:** `03-tasks.md` — Sequenced task list with implementation details, file references, requirement traceability, and completion criteria.

**Gate:** Tasks must be reviewed before beginning implementation. Each task should be 2-4 hours of focused work.

## Spec Directory Structure

All spec artifacts live together in a dedicated directory:

```
docs/specs/<feature-name>/
├── 01-requirements.md    # Phase 1 output
├── 02-design.md          # Phase 2 output
└── 03-tasks.md           # Phase 3 output
```

## Phase Transitions

### Requirements → Design

Before starting design, verify:
- [ ] All user roles identified and addressed
- [ ] Normal, edge, and error cases covered
- [ ] Requirements are testable and measurable
- [ ] No conflicting requirements
- [ ] EARS format used consistently
- [ ] Open questions resolved

### Design → Tasks

Before starting task breakdown, verify:
- [ ] All requirements addressed in design
- [ ] Component responsibilities well-defined
- [ ] Interfaces between components specified
- [ ] Error handling covers expected failures
- [ ] Security considerations addressed
- [ ] Decision rationale documented

### Tasks → Implementation

Before starting implementation, verify:
- [ ] All design components have implementation tasks
- [ ] Tasks ordered to respect dependencies
- [ ] Each task produces testable code
- [ ] Requirements references included for traceability
- [ ] Scope is appropriate (2-4 hours each)

## Integration with AI Workflows

1. **Start with context:** Provide project background, constraints, and goals
2. **Work in phases:** Complete requirements before design, design before tasks
3. **Use the dedicated skill** for each phase to get detailed guidance
4. **Iterate:** Refine outputs through conversation rather than single requests
5. **Validate:** Review outputs against the phase transition checklists
6. **Trace:** Maintain links between requirements → design → tasks

## Common Pitfalls to Avoid

1. **Skipping phases:** Each phase builds on the previous; shortcuts create problems
2. **Vague requirements:** "System should be fast" vs specific, measurable criteria
3. **Implementation details in requirements:** Focus on what, not how
4. **Over-engineering design:** Solve current requirements, not hypothetical future ones
5. **Monolithic tasks:** Break down into 2-4 hour increments
6. **Missing error cases:** Always consider what happens when things go wrong
7. **No traceability:** Every design element should trace to a requirement; every task should trace to a design element

## Next Steps

After completing all three phases:
1. Begin implementation following the task sequence
2. Track progress by marking tasks complete
3. Update spec if implementation reveals gaps
4. Validate completed work against requirements
5. Document learnings for future specs
