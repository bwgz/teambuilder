/**
 * Represents a group of participants assigned to the same team.
 *
 * <p>Provides access to the member list, member count, and the aggregate
 * skill score for all participants on the team.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Team {

    private final List<Participant> participants;

    /**
     * Creates an empty team with no participants.
     */
    public Team() {
        this.participants = new ArrayList<>();
    }

    /**
     * Adds a participant to this team.
     *
     * @param participant the participant to add; must not be null
     */
    public void addParticipant(Participant participant) {
        if (participant == null) {
            throw new IllegalArgumentException("Participant must not be null");
        }
        participants.add(participant);
    }

    /**
     * Returns an unmodifiable view of the participants on this team.
     *
     * @return the list of participants, never null
     */
    public List<Participant> getParticipants() {
        return Collections.unmodifiableList(participants);
    }

    /**
     * Returns the number of participants on this team.
     *
     * @return the team member count
     */
    public int size() {
        return participants.size();
    }

    /**
     * Returns the sum of ability scores for all participants on this team.
     *
     * @return the aggregate skill score
     */
    public double getTotalSkillScore() {
        double total = 0.0;
        for (Participant participant : participants) {
            total += participant.getAbilityScore();
        }
        return total;
    }

    @Override
    public String toString() {
        return "Team{size=" + size() + ", totalSkill=" + getTotalSkillScore() + "}";
    }
}
