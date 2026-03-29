/**
 * Unit tests for the {@link Participant} class.
 *
 * <p>Verifies construction, getter behavior, default ability score,
 * and graceful handling of null names.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ParticipantTest {

    @Test
    void constructorSetsNameAndScore() {
        Participant p = new Participant("Alice", 85.5);

        assertThat(p.getName()).isEqualTo("Alice");
        assertThat(p.getAbilityScore()).isEqualTo(85.5);
    }

    @Test
    void singleArgConstructorDefaultsScoreToZero() {
        Participant p = new Participant("Bob");

        assertThat(p.getName()).isEqualTo("Bob");
        assertThat(p.getAbilityScore()).isEqualTo(0.0);
    }

    @Test
    void nullNameDefaultsToEmptyString() {
        Participant p = new Participant(null, 50.0);

        assertThat(p.getName()).isEmpty();
    }

    @Test
    void negativeAbilityScoreIsAllowed() {
        Participant p = new Participant("Charlie", -10.0);

        assertThat(p.getAbilityScore()).isEqualTo(-10.0);
    }

    @Test
    void toStringIncludesNameAndScore() {
        Participant p = new Participant("Dana", 72.0);

        assertThat(p.toString()).contains("Dana").contains("72.0");
    }
}
