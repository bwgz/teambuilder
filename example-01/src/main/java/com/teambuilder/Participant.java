/**
 * Represents a person registered for a team-building event.
 *
 * <p>Each participant has a name and a numeric ability score used for
 * fairness-based team placement. The ability score defaults to 0.0 if
 * not explicitly provided.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

public class Participant {

    /** Default ability score assigned when none is provided. */
    private static final double DEFAULT_ABILITY_SCORE = 0.0;

    private final String name;
    private final double abilityScore;

    /**
     * Creates a participant with the given name and ability score.
     *
     * @param name         the participant's display name; null is treated as an empty string
     * @param abilityScore the participant's numeric skill rating
     */
    public Participant(String name, double abilityScore) {
        this.name = (name != null) ? name : "";
        this.abilityScore = abilityScore;
    }

    /**
     * Creates a participant with the given name and a default ability score of 0.0.
     *
     * @param name the participant's display name; null is treated as an empty string
     */
    public Participant(String name) {
        this(name, DEFAULT_ABILITY_SCORE);
    }

    /**
     * Returns the participant's display name.
     *
     * @return the name, never null
     */
    public String getName() {
        return name;
    }

    /**
     * Returns the participant's ability score.
     *
     * @return the numeric skill rating
     */
    public double getAbilityScore() {
        return abilityScore;
    }

    @Override
    public String toString() {
        return "Participant{name='" + name + "', abilityScore=" + abilityScore + "}";
    }
}
