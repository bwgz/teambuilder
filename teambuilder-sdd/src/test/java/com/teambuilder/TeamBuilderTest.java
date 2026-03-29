/**
 * Unit tests for the {@link TeamBuilder} class.
 *
 * <p>Covers input validation, team slot allocation, random placement,
 * all three fairness strategies, and edge cases from the requirements.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TeamBuilderTest {

    private TeamBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new TeamBuilder();
    }

    // ---------------------------------------------------------------
    // Helper: creates a list of participants with sequential scores
    // ---------------------------------------------------------------

    /**
     * Creates a list of participants named P1..Pn with ability scores 1.0..n.0.
     */
    private List<Participant> makeParticipants(int count) {
        List<Participant> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            list.add(new Participant("P" + i, (double) i));
        }
        return list;
    }

    /**
     * Returns the total number of participants across all teams in a result.
     */
    private int totalPlaced(TeamBuildResult result) {
        return result.getTeams().stream().mapToInt(Team::size).sum();
    }

    // ===============================================================
    //  Validation Tests (FR-1, FR-2, NFR-5)
    // ===============================================================

    @Nested
    class ValidationTests {

        @Test
        void nullParticipantListReturnsFailure() {
            TeamSizeConfig config = new TeamSizeConfig(3, 3, 3);

            TeamBuildResult result = builder.buildTeams(null, config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
            assertThat(result.getMessage()).containsIgnoringCase("null");
        }

        @Test
        void emptyParticipantListReturnsFailure() {
            TeamSizeConfig config = new TeamSizeConfig(3, 3, 3);

            TeamBuildResult result = builder.buildTeams(List.of(), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
            assertThat(result.getMessage()).containsIgnoringCase("empty");
        }

        @Test
        void minGreaterThanMaxReturnsFailure() {
            TeamSizeConfig config = new TeamSizeConfig(4, 6, 3);

            TeamBuildResult result = builder.buildTeams(makeParticipants(12), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
            assertThat(result.getMessage()).containsIgnoringCase("invalid configuration");
        }

        @Test
        void idealOutsideRangeReturnsFailure() {
            TeamSizeConfig config = new TeamSizeConfig(2, 3, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(12), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
        }

        @Test
        void fewerParticipantsThanMinSizeReturnsFailure() {
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(3), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.FAILURE);
            assertThat(result.getMessage()).containsIgnoringCase("not enough");
        }
    }

    // ===============================================================
    //  Team Size Allocation Tests (FR-3)
    // ===============================================================

    @Nested
    class AllocationTests {

        @Test
        void evenlyDivisibleCreatesAllIdealSizeTeams() {
            // 12 participants / ideal 4 = 3 teams of 4
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(12), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(result.getTeams()).hasSize(3);
            assertThat(result.getTeams()).allMatch(t -> t.size() == 4);
        }

        @Test
        void nonDivisibleDistributesWithinMinMax() {
            // 13 participants / ideal 4 = 3 teams of 4, remainder 1
            // Should create teams within [3, 5] bounds
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(13), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(totalPlaced(result)).isEqualTo(13);

            // All teams should be within min/max bounds
            for (Team team : result.getTeams()) {
                assertThat(team.size()).isBetween(3, 5);
            }
        }

        @Test
        void teamCapAt100() {
            // 500 participants / ideal 1, min 1, max 1 → would need 500 teams → cap at 100
            TeamSizeConfig config = new TeamSizeConfig(1, 1, 1);
            List<Participant> participants = makeParticipants(500);

            TeamBuildResult result = builder.buildTeams(participants, config, PlacementStrategy.RANDOM);

            assertThat(result.getTeams().size()).isLessThanOrEqualTo(100);
            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.PARTIAL);
            assertThat(result.getUnplacedParticipants()).isNotEmpty();
        }

        @Test
        void exactly100TeamsIsAllowed() {
            // 100 participants / ideal 1 = exactly 100 teams
            TeamSizeConfig config = new TeamSizeConfig(1, 1, 1);

            TeamBuildResult result = builder.buildTeams(makeParticipants(100), config, PlacementStrategy.RANDOM);

            assertThat(result.getTeams()).hasSize(100);
            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
        }

        @Test
        void minEqualsMaxEqualsIdealForcesExactSize() {
            // 15 participants, all teams must be exactly 5
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(15), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(result.getTeams()).hasSize(3);
            assertThat(result.getTeams()).allMatch(t -> t.size() == 5);
        }
    }

    // ===============================================================
    //  Random Placement Tests (FR-4)
    // ===============================================================

    @Nested
    class RandomPlacementTests {

        @Test
        void allParticipantsArePlaced() {
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(12), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(totalPlaced(result)).isEqualTo(12);
        }

        @Test
        void teamSizesRespectConstraints() {
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(13), config, PlacementStrategy.RANDOM);

            for (Team team : result.getTeams()) {
                assertThat(team.size()).isBetween(3, 5);
            }
        }

        @Test
        void multipleRunsProduceDifferentOrderings() {
            // Run several times and collect the first team's first participant name
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);
            Set<String> firstParticipantNames = new HashSet<>();

            for (int run = 0; run < 20; run++) {
                TeamBuildResult result = builder.buildTeams(
                        makeParticipants(12), config, PlacementStrategy.RANDOM);
                String firstName = result.getTeams().get(0).getParticipants().get(0).getName();
                firstParticipantNames.add(firstName);
            }

            // With 12 participants over 20 runs, we expect at least 2 different first participants
            assertThat(firstParticipantNames.size()).isGreaterThan(1);
        }
    }

    // ===============================================================
    //  Snake Draft Tests (FR-5)
    // ===============================================================

    @Nested
    class SnakeDraftTests {

        @Test
        void producesBalancedTeams() {
            // 8 participants with scores 1-8, ideal size 4, 2 teams
            // Snake order: T1 gets 8,5,4,1 = 18; T2 gets 7,6,3,2 = 18
            TeamSizeConfig config = new TeamSizeConfig(4, 4, 4);

            TeamBuildResult result = builder.buildTeams(makeParticipants(8), config, PlacementStrategy.SNAKE_DRAFT);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(result.getTeams()).hasSize(2);

            double team1Score = result.getTeams().get(0).getTotalSkillScore();
            double team2Score = result.getTeams().get(1).getTotalSkillScore();
            assertThat(Math.abs(team1Score - team2Score)).isLessThanOrEqualTo(2.0);
        }

        @Test
        void respectsTeamSizeConstraints() {
            TeamSizeConfig config = new TeamSizeConfig(3, 2, 4);

            TeamBuildResult result = builder.buildTeams(makeParticipants(10), config, PlacementStrategy.SNAKE_DRAFT);

            for (Team team : result.getTeams()) {
                assertThat(team.size()).isBetween(2, 4);
            }
        }

        @Test
        void allParticipantsPlacedWhenPossible() {
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(20), config, PlacementStrategy.SNAKE_DRAFT);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(totalPlaced(result)).isEqualTo(20);
        }
    }

    // ===============================================================
    //  Minimize Variance Tests (FR-5)
    // ===============================================================

    @Nested
    class MinimizeVarianceTests {

        @Test
        void producesLowerVarianceThanRandom() {
            // Use a large enough set that greedy optimization should outperform random
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);
            List<Participant> participants = makeParticipants(20);

            TeamBuildResult fairResult = builder.buildTeams(
                    new ArrayList<>(participants), config, PlacementStrategy.MINIMIZE_VARIANCE);

            double fairVariance = computeScoreVariance(fairResult.getTeams());

            // Run random multiple times and take the average variance
            double totalRandomVariance = 0;
            int runs = 50;
            for (int i = 0; i < runs; i++) {
                TeamBuildResult randomResult = builder.buildTeams(
                        new ArrayList<>(participants), config, PlacementStrategy.RANDOM);
                totalRandomVariance += computeScoreVariance(randomResult.getTeams());
            }
            double avgRandomVariance = totalRandomVariance / runs;

            // Fairness strategy should produce lower or equal variance on average
            assertThat(fairVariance).isLessThanOrEqualTo(avgRandomVariance);
        }

        @Test
        void equalScoresProduceEqualTeamTotals() {
            // All participants have the same score
            List<Participant> participants = new ArrayList<>();
            for (int i = 0; i < 12; i++) {
                participants.add(new Participant("P" + i, 50.0));
            }
            TeamSizeConfig config = new TeamSizeConfig(4, 4, 4);

            TeamBuildResult result = builder.buildTeams(participants, config, PlacementStrategy.MINIMIZE_VARIANCE);

            double expectedTotal = 200.0; // 4 × 50
            for (Team team : result.getTeams()) {
                assertThat(team.getTotalSkillScore()).isCloseTo(expectedTotal, within(0.001));
            }
        }
    }

    // ===============================================================
    //  Minimize Max Difference Tests (FR-5)
    // ===============================================================

    @Nested
    class MinimizeMaxDifferenceTests {

        @Test
        void reducesGapBetweenStrongestAndWeakest() {
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);
            List<Participant> participants = makeParticipants(20);

            TeamBuildResult result = builder.buildTeams(
                    new ArrayList<>(participants), config, PlacementStrategy.MINIMIZE_MAX_DIFFERENCE);

            double maxScore = result.getTeams().stream()
                    .mapToDouble(Team::getTotalSkillScore).max().orElse(0);
            double minScore = result.getTeams().stream()
                    .mapToDouble(Team::getTotalSkillScore).min().orElse(0);
            double gap = maxScore - minScore;

            // With scores 1-20 across 4 teams of 5, a well-optimized gap should be small
            // Total is 210, ideal per team is 52.5 — gap should be at most a few points
            assertThat(gap).isLessThan(10.0);
        }

        @Test
        void respectsTeamSizeConstraints() {
            TeamSizeConfig config = new TeamSizeConfig(3, 2, 4);

            TeamBuildResult result = builder.buildTeams(
                    makeParticipants(10), config, PlacementStrategy.MINIMIZE_MAX_DIFFERENCE);

            for (Team team : result.getTeams()) {
                assertThat(team.size()).isBetween(2, 4);
            }
        }

        @Test
        void equalScoresProduceEqualTeamTotals() {
            List<Participant> participants = new ArrayList<>();
            for (int i = 0; i < 12; i++) {
                participants.add(new Participant("P" + i, 50.0));
            }
            TeamSizeConfig config = new TeamSizeConfig(4, 4, 4);

            TeamBuildResult result = builder.buildTeams(
                    participants, config, PlacementStrategy.MINIMIZE_MAX_DIFFERENCE);

            double expectedTotal = 200.0;
            for (Team team : result.getTeams()) {
                assertThat(team.getTotalSkillScore()).isCloseTo(expectedTotal, within(0.001));
            }
        }
    }

    // ===============================================================
    //  Edge Case Tests
    // ===============================================================

    @Nested
    class EdgeCaseTests {

        @Test
        void singleParticipantWithMinOneCreatesOneTeam() {
            TeamSizeConfig config = new TeamSizeConfig(1, 1, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(1), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(result.getTeams()).hasSize(1);
            assertThat(result.getTeams().get(0).size()).isEqualTo(1);
        }

        @Test
        void participantWithNullNameIsHandled() {
            List<Participant> participants = new ArrayList<>();
            participants.add(new Participant(null, 50.0));
            participants.add(new Participant("Bob", 60.0));
            participants.add(new Participant("Charlie", 70.0));
            TeamSizeConfig config = new TeamSizeConfig(3, 3, 3);

            TeamBuildResult result = builder.buildTeams(participants, config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.SUCCESS);
            assertThat(totalPlaced(result)).isEqualTo(3);
        }

        @Test
        void moreThan100TeamsNeededReportsPartial() {
            // 150 participants with ideal 1, min 1, max 1 → 100 teams, 50 unplaced
            TeamSizeConfig config = new TeamSizeConfig(1, 1, 1);

            TeamBuildResult result = builder.buildTeams(makeParticipants(150), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.PARTIAL);
            assertThat(result.getTeams()).hasSize(100);
            assertThat(result.getUnplacedParticipants()).hasSize(50);
        }

        @Test
        void remainingParticipantsReportedAsUnplaced() {
            // 11 participants, teams must be exactly 5 → 2 teams of 5, 1 unplaced
            TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);

            TeamBuildResult result = builder.buildTeams(makeParticipants(11), config, PlacementStrategy.RANDOM);

            assertThat(result.getStatus()).isEqualTo(TeamBuildResult.Status.PARTIAL);
            assertThat(result.getTeams()).hasSize(2);
            assertThat(totalPlaced(result)).isEqualTo(10);
            assertThat(result.getUnplacedParticipants()).hasSize(1);
        }

        @Test
        void allFairnessStrategiesRespectSizeConstraints() {
            TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);
            List<Participant> participants = makeParticipants(13);

            for (PlacementStrategy strategy : PlacementStrategy.values()) {
                TeamBuildResult result = builder.buildTeams(
                        new ArrayList<>(participants), config, strategy);

                for (Team team : result.getTeams()) {
                    assertThat(team.size())
                            .as("Strategy %s: team size out of bounds", strategy)
                            .isBetween(3, 5);
                }
            }
        }
    }

    // ---------------------------------------------------------------
    // Helper: compute variance of team total scores
    // ---------------------------------------------------------------

    private double computeScoreVariance(List<Team> teams) {
        if (teams.isEmpty()) {
            return 0.0;
        }
        double mean = teams.stream().mapToDouble(Team::getTotalSkillScore).average().orElse(0);
        double sumSquaredDiffs = teams.stream()
                .mapToDouble(t -> Math.pow(t.getTotalSkillScore() - mean, 2))
                .sum();
        return sumSquaredDiffs / teams.size();
    }
}
