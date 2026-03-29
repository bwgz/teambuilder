/**
 * Unit tests for the {@link TeamBuildResult} class.
 *
 * <p>Verifies the three static factory methods produce results with
 * the correct status, team lists, unplaced participants, and messages.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TeamBuildResultTest {

    @Test
    void successResultContainsTeamsAndSuccessStatus() {
        Team team = new Team();
        team.addParticipant(new Participant("Alice", 80.0));
        List<Team> teams = List.of(team);

        TeamBuildResult result = TeamBuildResult.success(teams);

        assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
        assertThat(result.getTeams()).hasSize(1);
        assertThat(result.getUnplacedParticipants()).isEmpty();
        assertThat(result.getMessage()).isNotEmpty();
    }

    @Test
    void partialResultContainsTeamsAndUnplacedParticipants() {
        Team team = new Team();
        team.addParticipant(new Participant("Alice", 80.0));
        Participant unplaced = new Participant("Bob", 60.0);

        TeamBuildResult result = TeamBuildResult.partial(
                List.of(team), List.of(unplaced), "1 participant could not be placed");

        assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.PARTIAL);
        assertThat(result.getTeams()).hasSize(1);
        assertThat(result.getUnplacedParticipants()).containsExactly(unplaced);
        assertThat(result.getMessage()).contains("could not be placed");
    }

    @Test
    void failureResultHasNoTeamsAndErrorMessage() {
        TeamBuildResult result = TeamBuildResult.failure("Participant list is empty");

        assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
        assertThat(result.getTeams()).isEmpty();
        assertThat(result.getUnplacedParticipants()).isEmpty();
        assertThat(result.getMessage()).contains("empty");
    }

    @Test
    void nullTeamsListDefaultsToEmpty() {
        TeamBuildResult result = TeamBuildResult.success(null);

        assertThat(result.getTeams()).isEmpty();
    }
}
