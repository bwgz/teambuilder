/**
 * Defines the available strategies for assigning participants to teams.
 *
 * <p>The organizer selects one of these strategies when invoking the
 * team builder. {@code RANDOM} assigns participants without regard to
 * ability; the three fairness strategies use ability scores to balance
 * team strength.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

public enum PlacementStrategy {

    /** Assigns participants to teams in a random order. */
    RANDOM,

    /** Distributes participants to minimize the variance of total team scores. */
    MINIMIZE_VARIANCE,

    /** Distributes participants to minimize the gap between the strongest and weakest teams. */
    MINIMIZE_MAX_DIFFERENCE,

    /** Sorts participants by ability and assigns them in alternating (snake) order across teams. */
    SNAKE_DRAFT
}
