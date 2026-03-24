/**
 * Encapsulates and validates team-size constraints for team generation.
 *
 * <p>An event organizer specifies an ideal team size along with minimum
 * and maximum bounds. The {@link #validate()} method ensures the
 * configuration is internally consistent before team generation begins.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

public class TeamSizeConfig {

    private final int idealSize;
    private final int minSize;
    private final int maxSize;

    /**
     * Creates a team size configuration.
     *
     * @param idealSize the preferred number of members per team
     * @param minSize   the smallest acceptable team size
     * @param maxSize   the largest acceptable team size
     */
    public TeamSizeConfig(int idealSize, int minSize, int maxSize) {
        this.idealSize = idealSize;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }

    /**
     * Validates that this configuration is internally consistent.
     *
     * <p>Checks the following rules:</p>
     * <ul>
     *   <li>All sizes must be at least 1</li>
     *   <li>Minimum size must not exceed maximum size</li>
     *   <li>Ideal size must fall between minimum and maximum (inclusive)</li>
     * </ul>
     *
     * @throws IllegalArgumentException if any validation rule is violated
     */
    public void validate() {
        if (minSize < 1) {
            throw new IllegalArgumentException("Minimum team size must be at least 1, got: " + minSize);
        }
        if (maxSize < 1) {
            throw new IllegalArgumentException("Maximum team size must be at least 1, got: " + maxSize);
        }
        if (idealSize < 1) {
            throw new IllegalArgumentException("Ideal team size must be at least 1, got: " + idealSize);
        }
        if (minSize > maxSize) {
            throw new IllegalArgumentException(
                    "Minimum size (" + minSize + ") must not exceed maximum size (" + maxSize + ")");
        }
        if (idealSize < minSize || idealSize > maxSize) {
            throw new IllegalArgumentException(
                    "Ideal size (" + idealSize + ") must be between min (" + minSize + ") and max (" + maxSize + ")");
        }
    }

    /**
     * Returns the preferred number of members per team.
     *
     * @return the ideal team size
     */
    public int getIdealSize() {
        return idealSize;
    }

    /**
     * Returns the smallest acceptable team size.
     *
     * @return the minimum team size
     */
    public int getMinSize() {
        return minSize;
    }

    /**
     * Returns the largest acceptable team size.
     *
     * @return the maximum team size
     */
    public int getMaxSize() {
        return maxSize;
    }

    @Override
    public String toString() {
        return "TeamSizeConfig{ideal=" + idealSize + ", min=" + minSize + ", max=" + maxSize + "}";
    }
}
