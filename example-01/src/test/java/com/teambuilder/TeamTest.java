/**
 * Unit tests for the {@link Team} class.
 *
 * <p>Verifies participant management, size reporting, total skill score
 * calculation, and edge cases like empty teams.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TeamTest {

    @Test
    void newTeamIsEmpty() {
        Team team = new Team();

        assertThat(team.size()).isZero();
        assertThat(team.getParticipants()).isEmpty();
        assertThat(team.getTotalSkillScore()).isEqualTo(0.0);
    }

    @Test
    void addParticipantIncreasesSize() {
        Team team = new Team();
        team.addParticipant(new Participant("Alice", 80.0));

        assertThat(team.size()).isEqualTo(1);
        assertThat(team.getParticipants()).hasSize(1);
    }

    @Test
    void totalSkillScoreSumsAllParticipants() {
        Team team = new Team();
        team.addParticipant(new Participant("Alice", 80.0));
        team.addParticipant(new Participant("Bob", 60.0));
        team.addParticipant(new Participant("Charlie", 40.0));

        assertThat(team.getTotalSkillScore()).isEqualTo(180.0);
    }

    @Test
    void getParticipantsReturnsUnmodifiableList() {
        Team team = new Team();
        team.addParticipant(new Participant("Alice", 80.0));

        assertThatThrownBy(() -> team.getParticipants().add(new Participant("Hacker", 0.0)))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void addNullParticipantThrowsException() {
        Team team = new Team();

        assertThatThrownBy(() -> team.addParticipant(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void participantsRetainInsertionOrder() {
        Team team = new Team();
        Participant alice = new Participant("Alice", 80.0);
        Participant bob = new Participant("Bob", 60.0);
        team.addParticipant(alice);
        team.addParticipant(bob);

        assertThat(team.getParticipants()).containsExactly(alice, bob);
    }
}
