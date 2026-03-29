/**
 * @fileoverview TeamBuilder — the primary public entry point for the library.
 *
 * `TeamBuilder` orchestrates the full team-formation pipeline:
 *   1. **Validate** inputs (constraints C1–C4).
 *   2. **Size** — compute how many teams to form and how large each should be
 *      (Algorithm A from the spec).
 *   3. **Distribute** — apply the chosen {@link Mode} strategy
 *      (RANDOM → Algorithm B, FAIR → Algorithm C).
 *   4. **Assemble** — wrap each bucket in a {@link Team} and collect unplaced
 *      participants.
 *   5. **Return** a frozen {@link TeamResult}.
 *
 * The two concrete distribution strategies live in this module as private
 * helpers.  They are not exported; consumers interact only with
 * `TeamBuilder.buildTeams`.
 *
 * @author team-builder
 * @date   2026-03-28
 */

/** @typedef {import('./Participant.js').Participant}   Participant */
/** @typedef {import('./TeamConfig.js').TeamConfig}     TeamConfig  */
/** @typedef {import('./TeamResult.js').TeamResult}     TeamResult  */

import { Mode, MAX_TEAMS_ABSOLUTE, MESSAGES } from './TeamConfig.js';
import { Team }                               from './Team.js';
import { createSuccessResult, createFailureResult } from './TeamResult.js';

// ─── Internal: Validation ─────────────────────────────────────────────────────

/**
 * Validates a `(participants, config)` pair against constraints C1–C4.
 *
 * Checks are applied in the order specified by the spec so that the most
 * fundamental configuration errors surface before participant-level errors.
 *
 * | # | Condition checked                                           |
 * |---|-------------------------------------------------------------|
 * | C1 | `config.minSize > config.maxSize`                          |
 * | C2 | `config.idealSize` outside `[minSize, maxSize]`            |
 * | C3 | `participants` is `null`, `undefined`, or empty            |
 * | C4 | `participants.length < config.minSize`                     |
 *
 * @param {Participant[] | null | undefined} participants - Participant list to validate.
 * @param {TeamConfig}                       config       - Configuration to validate.
 * @returns {{ ok: true } | { ok: false, message: string }}
 *   `{ ok: true }` when all constraints pass; `{ ok: false, message }` on the
 *   first failing constraint.
 */
function validate(participants, config) {
  // C1 — minSize > maxSize
  if (config.minSize > config.maxSize) {
    return { ok: false, message: MESSAGES.MIN_GREATER_THAN_MAX };
  }

  // C2 — idealSize outside [minSize, maxSize]
  if (config.idealSize < config.minSize || config.idealSize > config.maxSize) {
    return { ok: false, message: MESSAGES.IDEAL_OUT_OF_RANGE };
  }

  // C3 — participants null, undefined, or empty
  if (participants == null || participants.length === 0) {
    return { ok: false, message: MESSAGES.NO_PARTICIPANTS };
  }

  // C4 — fewer participants than minSize (can't form even one team)
  if (participants.length < config.minSize) {
    return { ok: false, message: MESSAGES.NOT_ENOUGH };
  }

  return { ok: true };
}

// ─── Internal: Slot sizer ─────────────────────────────────────────────────────

/**
 * Computes the array of slot sizes (one entry per team to be formed) and the
 * number of participants that cannot be accommodated.
 *
 * Implements **Algorithm A** from the spec:
 *   1. Start with `k = floor(N / idealSize)`, minimum 1.
 *   2. If `k * maxSize < N`, increase `k` to `ceil(N / maxSize)`.
 *   3. Apply hard cap: `k = Math.min(k, hardCap)`.
 *   4. Distribute participants across `k` slots by computing a `base` size and
 *      giving `bonus` slots one extra participant each so that
 *      `base * k + bonus === N` (clamped to `[minSize, maxSize]`).
 *   5. Any participants beyond `hardCap * maxSize` become unplaced.
 *
 * @param {number}     participantCount - Total number of participants to distribute.
 * @param {TeamConfig} config           - Validated team configuration.
 * @param {number}     hardCap          - Effective maximum team count
 *   (`Math.min(config.maxTeams, MAX_TEAMS_ABSOLUTE)`).  Once `k` exceeds this
 *   value it is clamped, and surplus participants are reported as unplaced.
 * @returns {{ slotSizes: number[], unplacedCount: number }}
 *   `slotSizes` — array of positive integers in `[minSize, maxSize]`, one per team.
 *   `unplacedCount` — number of participants that cannot be placed.
 */
function computeSlotSizes(participantCount, config, hardCap) {
  const { idealSize, minSize, maxSize } = config;
  const N = participantCount;

  // Step 1 — baseline team count; at least 1 team
  let k = Math.max(1, Math.floor(N / idealSize));

  // Step 2 — if k teams can't hold everyone at maxSize, add more teams
  if (k * maxSize < N) {
    k = Math.ceil(N / maxSize);
  }

  // Step 3 — apply hard cap; anything beyond hardCap * maxSize is unplaced
  if (k > hardCap) {
    k = hardCap;
  }

  // Participants that fit within the capped capacity
  // capacity = maximum participants the k capped teams can absorb at maxSize each
  // placeable = the lesser of total participants and that capacity (avoids over-allocation)
  const capacity     = k * maxSize;
  const placeable    = Math.min(N, capacity);
  const unplacedCount = N - placeable;

  // Step 4 — distribute `placeable` participants across k slots
  // base size per slot, bonus slots get one extra participant
  const base  = Math.floor(placeable / k);
  const bonus = placeable - base * k;   // number of slots sized (base + 1)

  // Clamp base to [minSize, maxSize] (base+1 is always ≤ maxSize after step 2)
  const slotSizes = [];
  for (let i = 0; i < k; i++) {
    const raw  = i < bonus ? base + 1 : base;
    const size = Math.max(minSize, Math.min(maxSize, raw));
    slotSizes.push(size);
  }

  return { slotSizes, unplacedCount };
}

// ─── Internal: Distribution strategies ───────────────────────────────────────

/**
 * Shuffles a copy of `arr` using the Fisher-Yates algorithm and returns it.
 *
 * The original array is never mutated.  `Math.random()` is used as the
 * entropy source; the result is therefore non-deterministic across calls.
 *
 * @template T
 * @param {T[]} arr - The array to shuffle.
 * @returns {T[]} A new array containing the same elements in a random order.
 */
function shuffle(arr) {
  // Copy first so we never mutate the caller's array
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    // Pick a random index in [0, i] and swap with position i
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Distributes `participants` into `slotCount` buckets using a **random**
 * (Fisher-Yates) strategy (Algorithm B).
 *
 * Steps:
 *   1. Shuffle a copy of `participants` via {@link shuffle}.
 *   2. Fill each bucket sequentially; bucket sizes are determined by
 *      `slotSizes` (passed from the builder after calling
 *      {@link computeSlotSizes}).
 *
 * @param {Participant[]} participants - Participants to distribute.
 * @param {number[]}      slotSizes    - Desired size for each bucket/team slot.
 * @returns {Participant[][]} Array of `slotSizes.length` buckets, each
 *   filled with exactly `slotSizes[i]` participants.
 */
function distributeRandom(participants, slotSizes) {
  // Step 1 — randomise order via Fisher-Yates (non-mutating)
  const shuffled = shuffle(participants);
  const buckets  = [];
  let cursor     = 0;

  // Step 2 — slice sequentially into buckets according to each slot's desired size
  for (const size of slotSizes) {
    buckets.push(shuffled.slice(cursor, cursor + size));
    cursor += size;
  }

  return buckets;
}

/**
 * Performs a snake-draft across `bucketCount` buckets on a pre-sorted array.
 *
 * In a snake draft, participants alternate direction each round:
 *   - Even rounds: assign left-to-right  (bucket 0, 1, 2 … k-1)
 *   - Odd rounds:  assign right-to-left  (bucket k-1, k-2 … 0)
 *
 * This ensures that the highest-ability participant in each round goes to a
 * different team, balancing total ability sums.
 *
 * @template T
 * @param {T[]}    sorted      - Elements to draft, already sorted in descending
 *   ability order so the highest-ability participant is always at index 0.
 * @param {number} bucketCount - Number of destination buckets.
 * @returns {T[][]} Array of `bucketCount` buckets filled by snake-draft order.
 *
 * @example
 * // 6 participants, 2 teams → round 0: [10→t0, 9→t1], round 1: [8→t1, 7→t0], …
 * snakeDraft([10,9,8,7,6,5], 2);
 * // → [[10,7,6], [9,8,5]]
 */
function snakeDraft(sorted, bucketCount) {
  // Initialise one empty bucket per team
  const buckets = Array.from({ length: bucketCount }, () => []);

  for (let i = 0; i < sorted.length; i++) {
    // Determine which round we are in and where within that round
    const round      = Math.floor(i / bucketCount);
    const posInRound = i % bucketCount;

    // Even rounds go left→right; odd rounds go right→left (the "snake")
    const bucketIdx  = (round % 2 === 0)
      ? posInRound
      : (bucketCount - 1) - posInRound;

    buckets[bucketIdx].push(sorted[i]);
  }

  return buckets;
}

/**
 * Distributes `participants` into `slotCount` buckets using the **FAIR**
 * snake-draft strategy (Algorithm C).
 *
 * Steps:
 *   1. Sort a copy of `participants` in descending order by `ability`.
 *   2. Apply {@link snakeDraft} to produce balanced buckets.
 *
 * @param {Participant[]} participants - Participants to distribute.
 * @param {number}        slotCount    - Number of team slots to fill.
 * @returns {Participant[][]} Array of `slotCount` buckets, balanced by ability.
 */
function distributeFair(participants, slotCount) {
  // Step 1 — sort descending by ability so the best participant drafts first
  const sorted = [...participants].sort((a, b) => b.ability - a.ability);

  // Step 2 — snake-draft the sorted list into slotCount balanced buckets
  return snakeDraft(sorted, slotCount);
}

// ─── Public class ─────────────────────────────────────────────────────────────

/**
 * Orchestrates the full team-formation pipeline.
 *
 * @example
 * import { TeamBuilder } from './TeamBuilder.js';
 * import { Mode }        from './TeamConfig.js';
 *
 * const builder = new TeamBuilder();
 * const result  = builder.buildTeams(participants, {
 *   idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.FAIR,
 * });
 *
 * if (result.success) {
 *   result.teams.forEach(t => console.log(t.getParticipants()));
 * }
 */
export class TeamBuilder {
  // ─── Construction ────────────────────────────────────────────────────────────

  /**
   * Constructs a new TeamBuilder.
   *
   * The constructor takes no arguments — all configuration is supplied per
   * call via the `config` parameter of {@link buildTeams}.  The body is
   * intentionally empty and reserved for future dependency-injection hooks.
   *
   * @returns {void}
   */
  constructor() {
    // TODO: implement (no-op for now; reserved for future DI)
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Distributes the supplied participants into teams according to `config`.
   *
   * This is the single public entry point of the library.  Internally it
   * calls `validate`, `computeSlotSizes`, the appropriate distribution
   * function, and finally assembles {@link Team} and {@link TeamResult}
   * objects.
   *
   * ### Return semantics
   * | Condition                              | `success` | `teams`  | `unplaced`      |
   * |----------------------------------------|-----------|----------|-----------------|
   * | Validation error (C1–C4)               | `false`   | `[]`     | `[]`            |
   * | All participants placed                | `true`    | non-empty | `[]`            |
   * | Hard-cap causes overflow               | `true`    | 100 teams | overflow list   |
   *
   * @param {Participant[] | null | undefined} participants
   *   The full list of participants to distribute.  Accepts `null` and
   *   `undefined` so that JavaScript callers do not need to guard before
   *   calling.
   * @param {TeamConfig} config
   *   Configuration controlling team sizing, hard cap, and distribution mode.
   * @returns {TeamResult} Frozen result object describing all formed teams,
   *   any unplaced participants, and a human-readable outcome message.
   *
   * @example
   * // Happy-path: 12 participants split evenly into 3 teams of 4
   * const result = builder.buildTeams(participants, {
   *   idealSize: 4, minSize: 4, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM,
   * });
   * // result.success  → true
   * // result.teams.length → 3
   * // result.unplaced.length → 0
   *
   * @example
   * // Error path: invalid config
   * const result = builder.buildTeams(participants, {
   *   idealSize: 4, minSize: 5, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM,
   * });
   * // result.success  → false
   * // result.message  → 'Minimum size cannot be greater than maximum size'
   */
  buildTeams(participants, config) {
    // ── Step 1: Validate inputs ──────────────────────────────────────────────
    const validationResult = validate(participants, config);
    if (!validationResult.ok) {
      return createFailureResult(validationResult.message);
    }

    // ── Step 2: Compute effective hard cap (C5 — never exceed 100 teams) ────
    const hardCap = Math.min(config.maxTeams, MAX_TEAMS_ABSOLUTE);

    // ── Step 3: Compute slot sizes (Algorithm A) ─────────────────────────────
    const { slotSizes, unplacedCount } = computeSlotSizes(
      participants.length,
      config,
      hardCap,
    );

    // ── Step 4: Select and run distribution strategy ─────────────────────────
    // Participants that can be placed (total slots capacity)
    const totalSlotCapacity = slotSizes.reduce((s, n) => s + n, 0);
    // placeable = the participants that fit within the computed slot capacity;
    // overflow  = participants beyond the hard-capped maximum (reported as unplaced)
    const placeable         = participants.slice(0, participants.length - unplacedCount);
    const overflow          = participants.slice(participants.length - unplacedCount);

    // Choose distribution algorithm based on the configured mode
    let buckets;
    if (config.mode === Mode.FAIR) {
      buckets = distributeFair(placeable, slotSizes.length);
    } else {
      buckets = distributeRandom(placeable, slotSizes);
    }

    // For FAIR mode the buckets may not be pre-sized; trim each to slotSizes[i]
    // (distributeRandom already slices to exact size, but distributeFair does not)
    const teams = slotSizes.map((size, i) => {
      const members = (buckets[i] || []).slice(0, size);
      return new Team(members);
    });

    // ── Step 5: Collect unplaced participants ────────────────────────────────
    // overflow = participants beyond hardCap * maxSize (already computed above)
    // Also collect any excess within FAIR buckets (bucket[i] entries past size)
    const fairExcess = slotSizes.flatMap((size, i) =>
      (buckets[i] || []).slice(size),
    );
    const unplaced = [...fairExcess, ...overflow];

    // ── Step 6: Return result ────────────────────────────────────────────────
    // Pick the appropriate success message depending on whether anyone was left out
    const message = unplaced.length > 0
      ? MESSAGES.SUCCESS_WITH_UNPLACED
      : MESSAGES.SUCCESS;

    return createSuccessResult(teams, unplaced, message);
  }
}

// ─── Convenience factory ──────────────────────────────────────────────────────

/**
 * Convenience factory that constructs and returns a new {@link TeamBuilder}.
 *
 * Prefer this over `new TeamBuilder()` in application code so that future
 * dependency-injection changes only need to touch this one factory rather
 * than all call-sites.
 *
 * @returns {TeamBuilder} A ready-to-use TeamBuilder instance.
 *
 * @example
 * import { createTeamBuilder } from './TeamBuilder.js';
 * const builder = createTeamBuilder();
 * const result  = builder.buildTeams(participants, config);
 */
export function createTeamBuilder() {
  return new TeamBuilder();
}
