/**
 * Main entry point for building teams from a list of participants.
 *
 * <p>The caller supplies a participant list, team-size configuration,
 * and a placement strategy. This class validates the inputs, determines
 * how many teams to create and their sizes, then delegates to the
 * chosen placement algorithm. The result is returned as a
 * {@link TeamBuildResult} that never throws — all error conditions
 * are communicated through the result's status and message.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class TeamBuilder {

    /** The maximum number of teams the system will create. */
    private static final int MAX_TEAMS = 100;

    /**
     * Builds teams from the given participants according to the size
     * configuration and placement strategy.
     *
     * @param participants the list of participants to assign; may be null
     * @param config       the team-size constraints (ideal, min, max)
     * @param strategy     the placement algorithm to use
     * @return a result describing the outcome — never null, never throws
     */
    public TeamBuildResult buildTeams(List<Participant> participants,
                                      TeamSizeConfig config,
                                      PlacementStrategy strategy) {

        // --- Input validation ---
        if (participants == null) {
            return TeamBuildResult.failure("Participant list must not be null");
        }
        if (participants.isEmpty()) {
            return TeamBuildResult.failure("Participant list is empty");
        }
        try {
            config.validate();
        } catch (IllegalArgumentException e) {
            return TeamBuildResult.failure("Invalid configuration: " + e.getMessage());
        }
        if (participants.size() < config.getMinSize()) {
            return TeamBuildResult.failure(
                    "Not enough participants (" + participants.size()
                            + ") to form a team of minimum size " + config.getMinSize());
        }

        // --- Determine team sizes ---
        List<Integer> teamSizes = allocateTeamSizes(participants.size(), config);

        // Separate placed and unplaced participants
        int placedCount = teamSizes.stream().mapToInt(Integer::intValue).sum();
        List<Participant> toPlace = new ArrayList<>(participants.subList(0, placedCount));
        List<Participant> unplaced = new ArrayList<>(participants.subList(placedCount, participants.size()));

        // --- Create empty teams with allocated sizes ---
        List<Team> teams = new ArrayList<>();
        for (int size : teamSizes) {
            teams.add(new Team());
        }

        // --- Assign participants using the chosen strategy ---
        placeParticipants(toPlace, teams, teamSizes, strategy);

        // --- Build the result ---
        if (unplaced.isEmpty()) {
            return TeamBuildResult.success(teams);
        } else {
            return TeamBuildResult.partial(teams, unplaced,
                    unplaced.size() + " participant(s) could not be placed");
        }
    }

    /**
     * Determines how many teams to create and each team's target size.
     *
     * <p>Attempts to create teams of the ideal size. When the participant
     * count is not evenly divisible, distributes the remainder by adjusting
     * team sizes within the min/max bounds. Caps at {@value #MAX_TEAMS} teams.</p>
     *
     * @param participantCount the total number of participants
     * @param config           the team-size constraints
     * @return a list where each element is the target size for one team
     */
    private List<Integer> allocateTeamSizes(int participantCount, TeamSizeConfig config) {
        int ideal = config.getIdealSize();
        int min = config.getMinSize();
        int max = config.getMaxSize();

        // Start with as many ideal-size teams as possible
        int numTeams = participantCount / ideal;
        int remainder = participantCount % ideal;

        // If no full teams can be formed but we have enough for one min-size team
        if (numTeams == 0 && participantCount >= min) {
            numTeams = 1;
            remainder = participantCount - ideal;
        }

        // Cap at maximum allowed teams
        if (numTeams > MAX_TEAMS) {
            numTeams = MAX_TEAMS;
            remainder = participantCount - (numTeams * ideal);
        }

        // Build the sizes list, starting with all teams at ideal size
        List<Integer> sizes = new ArrayList<>();
        for (int i = 0; i < numTeams; i++) {
            sizes.add(ideal);
        }

        // Distribute positive remainder by adding 1 to teams (up to max)
        if (remainder > 0) {
            remainder = distributeExcess(sizes, remainder, max);

            // If remainder still exists, try creating additional teams
            while (remainder >= min && sizes.size() < MAX_TEAMS) {
                int newTeamSize = Math.min(remainder, ideal);
                if (newTeamSize < min) {
                    break;
                }
                sizes.add(newTeamSize);
                remainder -= newTeamSize;
            }
        }

        // Handle negative remainder (when numTeams was forced to 1 with ideal > participantCount)
        if (remainder < 0) {
            // Reduce the single team's size to actual participant count if within bounds
            int actualSize = ideal + remainder;
            if (actualSize >= min) {
                sizes.set(0, actualSize);
            }
        }

        return sizes;
    }

    /**
     * Distributes extra participants across existing teams by incrementing
     * team sizes up to the maximum.
     *
     * @param sizes     the current team sizes (modified in place)
     * @param remainder the number of extra participants to distribute
     * @param max       the maximum allowed team size
     * @return the remaining undistributed participants
     */
    private int distributeExcess(List<Integer> sizes, int remainder, int max) {
        for (int i = 0; i < sizes.size() && remainder > 0; i++) {
            int canAdd = max - sizes.get(i);
            int toAdd = Math.min(canAdd, remainder);
            sizes.set(i, sizes.get(i) + toAdd);
            remainder -= toAdd;
        }
        return remainder;
    }

    /**
     * Assigns participants to teams using the selected placement strategy.
     *
     * @param participants the participants to place (may be reordered)
     * @param teams        the pre-created empty teams
     * @param teamSizes    the target size for each team
     * @param strategy     the placement algorithm
     */
    private void placeParticipants(List<Participant> participants, List<Team> teams,
                                   List<Integer> teamSizes, PlacementStrategy strategy) {
        switch (strategy) {
            case RANDOM -> placeRandom(participants, teams, teamSizes);
            case SNAKE_DRAFT -> placeSnakeDraft(participants, teams, teamSizes);
            case MINIMIZE_VARIANCE -> placeMinimizeVariance(participants, teams, teamSizes);
            case MINIMIZE_MAX_DIFFERENCE -> placeMinimizeMaxDifference(participants, teams, teamSizes);
        }
    }

    /**
     * Assigns participants to teams in a random order.
     *
     * <p>Shuffles the participant list, then fills each team sequentially
     * up to its target size.</p>
     *
     * @param participants the participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void placeRandom(List<Participant> participants, List<Team> teams,
                             List<Integer> teamSizes) {
        Collections.shuffle(participants);
        fillTeamsSequentially(participants, teams, teamSizes);
    }

    /**
     * Assigns participants using snake-draft order to balance ability scores.
     *
     * <p>Sorts participants by ability score descending, then assigns in
     * alternating forward/reverse order across teams (1, 2, ..., N, N, ..., 2, 1, ...).</p>
     *
     * @param participants the participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void placeSnakeDraft(List<Participant> participants, List<Team> teams,
                                 List<Integer> teamSizes) {
        // Sort by ability descending
        participants.sort(Comparator.comparingDouble(Participant::getAbilityScore).reversed());

        int participantIndex = 0;
        int numTeams = teams.size();
        boolean forward = true;

        // Track how many participants each team has received
        int[] currentSizes = new int[numTeams];

        while (participantIndex < participants.size()) {
            if (forward) {
                // Forward pass: team 0 → team N-1
                for (int t = 0; t < numTeams && participantIndex < participants.size(); t++) {
                    if (currentSizes[t] < teamSizes.get(t)) {
                        teams.get(t).addParticipant(participants.get(participantIndex++));
                        currentSizes[t]++;
                    }
                }
            } else {
                // Reverse pass: team N-1 → team 0
                for (int t = numTeams - 1; t >= 0 && participantIndex < participants.size(); t--) {
                    if (currentSizes[t] < teamSizes.get(t)) {
                        teams.get(t).addParticipant(participants.get(participantIndex++));
                        currentSizes[t]++;
                    }
                }
            }
            forward = !forward;
        }
    }

    /**
     * Assigns participants to minimize the variance of total team scores.
     *
     * <p>Sorts participants by ability descending, then greedily assigns
     * each participant to the non-full team with the lowest current total.</p>
     *
     * @param participants the participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void placeMinimizeVariance(List<Participant> participants, List<Team> teams,
                                       List<Integer> teamSizes) {
        participants.sort(Comparator.comparingDouble(Participant::getAbilityScore).reversed());
        greedyAssignToLowest(participants, teams, teamSizes);
    }

    /**
     * Assigns participants to minimize the difference between the strongest
     * and weakest teams.
     *
     * <p>Performs the same greedy assignment as minimize-variance, then
     * attempts local swaps between the strongest and weakest teams to
     * reduce the max difference further.</p>
     *
     * @param participants the participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void placeMinimizeMaxDifference(List<Participant> participants, List<Team> teams,
                                            List<Integer> teamSizes) {
        participants.sort(Comparator.comparingDouble(Participant::getAbilityScore).reversed());
        greedyAssignToLowest(participants, teams, teamSizes);

        // Post-processing: attempt swaps to reduce the max-min gap
        improveMaxDifference(teams);
    }

    /**
     * Greedy assignment: for each participant, add to the non-full team
     * with the lowest current total score.
     *
     * @param participants the sorted participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void greedyAssignToLowest(List<Participant> participants, List<Team> teams,
                                      List<Integer> teamSizes) {
        for (Participant participant : participants) {
            int bestTeamIndex = -1;
            double lowestScore = Double.MAX_VALUE;

            // Find the non-full team with the lowest total score
            for (int t = 0; t < teams.size(); t++) {
                if (teams.get(t).size() < teamSizes.get(t)
                        && teams.get(t).getTotalSkillScore() < lowestScore) {
                    lowestScore = teams.get(t).getTotalSkillScore();
                    bestTeamIndex = t;
                }
            }

            if (bestTeamIndex >= 0) {
                teams.get(bestTeamIndex).addParticipant(participant);
            }
        }
    }

    /**
     * Attempts participant swaps between the strongest and weakest teams
     * to reduce the gap between their total scores.
     *
     * <p>Rebuilds teams as new objects and replaces them in the list.
     * Iterates until no beneficial swap can be found or a maximum
     * number of iterations is reached.</p>
     *
     * @param teams the teams to optimize (list entries may be replaced)
     */
    private void improveMaxDifference(List<Team> teams) {
        if (teams.size() < 2) {
            return;
        }

        int maxIterations = 1000;
        for (int iter = 0; iter < maxIterations; iter++) {
            // Find the strongest and weakest teams
            int strongestIndex = 0;
            int weakestIndex = 0;
            for (int t = 1; t < teams.size(); t++) {
                if (teams.get(t).getTotalSkillScore() > teams.get(strongestIndex).getTotalSkillScore()) {
                    strongestIndex = t;
                }
                if (teams.get(t).getTotalSkillScore() < teams.get(weakestIndex).getTotalSkillScore()) {
                    weakestIndex = t;
                }
            }

            if (strongestIndex == weakestIndex) {
                break;
            }

            double currentDiff = teams.get(strongestIndex).getTotalSkillScore()
                    - teams.get(weakestIndex).getTotalSkillScore();

            // Try all possible swaps between the two teams
            boolean improved = trySwap(teams, strongestIndex, weakestIndex, currentDiff);
            if (!improved) {
                break;
            }
        }
    }

    /**
     * Attempts to find a beneficial swap between two teams.
     *
     * <p>A swap is beneficial if it reduces the absolute difference
     * between the two teams' total scores. When found, builds new
     * {@link Team} objects and replaces the originals in the list.</p>
     *
     * @param teams          the list of all teams (entries may be replaced)
     * @param strongerIndex  index of the team with the higher total
     * @param weakerIndex    index of the team with the lower total
     * @param currentDiff    the current score difference
     * @return true if a beneficial swap was performed
     */
    private boolean trySwap(List<Team> teams, int strongerIndex, int weakerIndex,
                            double currentDiff) {
        List<Participant> strongMembers = teams.get(strongerIndex).getParticipants();
        List<Participant> weakMembers = teams.get(weakerIndex).getParticipants();

        int bestI = -1;
        int bestJ = -1;
        double bestDiff = currentDiff;

        // Evaluate all possible swaps
        for (int i = 0; i < strongMembers.size(); i++) {
            for (int j = 0; j < weakMembers.size(); j++) {
                double scoreDelta = strongMembers.get(i).getAbilityScore()
                        - weakMembers.get(j).getAbilityScore();
                // After swap: stronger loses scoreDelta, weaker gains scoreDelta
                double newDiff = Math.abs(currentDiff - 2 * scoreDelta);
                if (newDiff < bestDiff) {
                    bestDiff = newDiff;
                    bestI = i;
                    bestJ = j;
                }
            }
        }

        // Perform the best swap by rebuilding both teams
        if (bestI >= 0) {
            teams.set(strongerIndex, rebuildTeamWithSwap(strongMembers, bestI, weakMembers.get(bestJ)));
            teams.set(weakerIndex, rebuildTeamWithSwap(weakMembers, bestJ, strongMembers.get(bestI)));
            return true;
        }
        return false;
    }

    /**
     * Builds a new team from an existing member list, replacing the
     * participant at the given index with a substitute.
     *
     * @param originalMembers the current participants
     * @param replaceIndex    the index of the participant to replace
     * @param replacement     the new participant to insert
     * @return a new team with the swap applied
     */
    private Team rebuildTeamWithSwap(List<Participant> originalMembers, int replaceIndex,
                                     Participant replacement) {
        Team rebuilt = new Team();
        for (int i = 0; i < originalMembers.size(); i++) {
            rebuilt.addParticipant(i == replaceIndex ? replacement : originalMembers.get(i));
        }
        return rebuilt;
    }

    /**
     * Fills teams sequentially from a list of participants.
     *
     * <p>Assigns participants in order, filling each team up to its
     * target size before moving to the next.</p>
     *
     * @param participants the ordered participants to place
     * @param teams        the teams to fill
     * @param teamSizes    the target size for each team
     */
    private void fillTeamsSequentially(List<Participant> participants, List<Team> teams,
                                       List<Integer> teamSizes) {
        int participantIndex = 0;
        for (int t = 0; t < teams.size() && participantIndex < participants.size(); t++) {
            for (int i = 0; i < teamSizes.get(t) && participantIndex < participants.size(); i++) {
                teams.get(t).addParticipant(participants.get(participantIndex++));
            }
        }
    }
}
