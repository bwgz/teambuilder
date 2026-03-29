import { describe, it, expect } from 'vitest';
import { TeamBuilder } from '../src/TeamBuilder.js';
import { Mode } from '../src/TeamConfig.js';

const builder = new TeamBuilder();
const p = (id, ability) => ({ id: String(id), name: `P${id}`, ability });

describe('holdout scenarios', () => {
  it('even_split_random', () => {
    const participants = Array.from({ length: 12 }, (_, i) => p(i, 5));
    const result = builder.buildTeams(participants, { idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(3);
    expect(result.unplaced).toHaveLength(0);
  });

  it('uneven_split', () => {
    const participants = Array.from({ length: 14 }, (_, i) => p(i, 5));
    const result = builder.buildTeams(participants, { idealSize: 4, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(true);
    for (const team of result.teams) {
      expect(team.getMemberCount()).toBeGreaterThanOrEqual(3);
      expect(team.getMemberCount()).toBeLessThanOrEqual(5);
    }
  });

  it('fair_balanced', () => {
    const participants = [10,9,8,7,6,5].map((a, i) => p(i, a));
    const result = builder.buildTeams(participants, { idealSize: 3, minSize: 3, maxSize: 3, maxTeams: 10, mode: Mode.FAIR });
    expect(result.success).toBe(true);
    expect(result.teams).toHaveLength(2);
    const sums = result.teams.map(t => t.getAbilitySum());
    expect(Math.abs(sums[0] - sums[1])).toBeLessThanOrEqual(1);
  });

  it('invalid_min_max', () => {
    const result = builder.buildTeams([p(1, 5)], { idealSize: 3, minSize: 5, maxSize: 3, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Minimum size cannot be greater');
  });

  it('invalid_ideal', () => {
    const result = builder.buildTeams([p(1, 5)], { idealSize: 6, minSize: 2, maxSize: 4, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Ideal size must be between');
  });

  it('max_teams_cap', () => {
    const participants = Array.from({ length: 1000 }, (_, i) => p(i, 5));
    const result = builder.buildTeams(participants, { idealSize: 2, minSize: 2, maxSize: 2, maxTeams: 200, mode: Mode.RANDOM });
    expect(result.teams).toHaveLength(100);
    expect(result.unplaced).toHaveLength(800);
  });

  it('empty_participants', () => {
    const result = builder.buildTeams([], { idealSize: 3, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(false);
    expect(result.message).toContain('No participants provided');
  });

  it('not_enough_participants', () => {
    const result = builder.buildTeams([p(1,5), p(2,5)], { idealSize: 3, minSize: 3, maxSize: 5, maxTeams: 10, mode: Mode.RANDOM });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough participants');
  });
});
