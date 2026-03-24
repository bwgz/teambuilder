/**
 * Encapsulates the outcome of a team-building operation.
 *
 * <p>A result contains the list of formed teams, a status flag indicating
 * whether the operation fully succeeded, partially succeeded, or failed,
 * and any participants that could not be placed on a team.</p>
 *
 * <p>Use the static factory methods {@link #success(java.util.List)},
 * {@link #partial(java.util.List, java.util.List, String)}, and
 * {@link #failure(String)} to construct results.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import java.util.Collections;
import java.util.List;

public class TeamBuildResult {

    /** Describes the overall outcome of team generation. */
    public enum Status {
        /** All participants were placed on a team. */
        SUCCESS,
        /** Some participants could not be placed. */
        PARTIAL,
        /** No teams could be formed. */
        FAILURE
    }

    private final List<Team> teams;
    private final Status status;
    private final List<Participant> unplacedParticipants;
    private final String message;

    /**
     * Private constructor — use the static factory methods instead.
     */
    private TeamBuildResult(List<Team> teams, Status status,
                            List<Participant> unplacedParticipants, String message) {
        this.teams = (teams != null) ? teams : Collections.emptyList();
        this.status = status;
        this.unplacedParticipants = (unplacedParticipants != null)
                ? unplacedParticipants : Collections.emptyList();
        this.message = (message != null) ? message : "";
    }

    /**
     * Creates a successful result where all participants were placed.
     *
     * @param teams the list of formed teams
     * @return a result with {@link Status#SUCCESS}
     */
    public static TeamBuildResult success(List<Team> teams) {
        return new TeamBuildResult(teams, Status.SUCCESS, Collections.emptyList(),
                "All participants placed successfully");
    }

    /**
     * Creates a partial result where some participants could not be placed.
     *
     * @param teams              the list of formed teams
     * @param unplacedParticipants participants that were not assigned to any team
     * @param message            a human-readable explanation
     * @return a result with {@link Status#PARTIAL}
     */
    public static TeamBuildResult partial(List<Team> teams, List<Participant> unplacedParticipants,
                                          String message) {
        return new TeamBuildResult(teams, Status.PARTIAL, unplacedParticipants, message);
    }

    /**
     * Creates a failure result where no teams could be formed.
     *
     * @param message a human-readable explanation of the failure
     * @return a result with {@link Status#FAILURE}
     */
    public static TeamBuildResult failure(String message) {
        return new TeamBuildResult(Collections.emptyList(), Status.FAILURE,
                Collections.emptyList(), message);
    }

    /**
     * Returns the list of formed teams.
     *
     * @return the teams, empty if the operation failed
     */
    public List<Team> getTeams() {
        return teams;
    }

    /**
     * Returns the outcome status of the team-building operation.
     *
     * @return SUCCESS, PARTIAL, or FAILURE
     */
    public Status getStatus() {
        return status;
    }

    /**
     * Returns participants that could not be placed on any team.
     *
     * @return the unplaced participants, empty if all were placed or on failure
     */
    public List<Participant> getUnplacedParticipants() {
        return unplacedParticipants;
    }

    /**
     * Returns a human-readable message describing the result.
     *
     * @return the status or error message
     */
    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return "TeamBuildResult{status=" + status + ", teams=" + teams.size()
                + ", unplaced=" + unplacedParticipants.size() + ", message='" + message + "'}";
    }
}
