# teambuilder-superpowers

A JavaScript library for distributing participants into balanced teams using RANDOM or FAIR (snake-draft) strategies.

> This implementation was generated using [Superpowers](https://github.com/obra/superpowers), a structured software development workflow for coding agents by Jesse Vincent. Superpowers guided the agent through brainstorming, spec writing, implementation planning, and subagent-driven TDD to produce this library.

## Installation

```bash
npm install
```

## Usage

```js
const { TeamBuilder } = require('./src/TeamBuilder');
const { FairStrategy } = require('./src/strategies/FairStrategy');
const { Participant } = require('./src/Participant');

const participants = [
  new Participant('Alice', 90),
  new Participant('Bob', 70),
  new Participant('Carol', 85),
  new Participant('Dave', 60),
];

const builder = new TeamBuilder(new FairStrategy());
builder.setParticipants(participants);
builder.setIdealSize(2);
builder.setMinSize(2);
builder.setMaxSize(3);

const result = builder.build();

if (result.success) {
  result.teams.forEach(team => {
    console.log(team.getParticipants(), team.getSkillSum());
  });
}
```

## API

### `new Participant(name, abilityScore)`

| Field          | Type   | Description                        |
|----------------|--------|------------------------------------|
| `name`         | String | Participant's name                 |
| `abilityScore` | Number | Numeric skill rating               |

### `new TeamBuilder(strategy)`

Accepts a `RandomStrategy` or `FairStrategy` instance.

| Method                        | Description                              |
|-------------------------------|------------------------------------------|
| `setParticipants(participants)` | List of `Participant` objects           |
| `setIdealSize(ideal)`         | Preferred team size                      |
| `setMinSize(min)`             | Minimum acceptable team size             |
| `setMaxSize(max)`             | Maximum acceptable team size             |
| `build()` → `TeamResult`      | Validate inputs and form teams           |

### `TeamResult`

| Field                  | Type            | Description                                      |
|------------------------|-----------------|--------------------------------------------------|
| `success`              | Boolean         | `false` if teams could not be formed             |
| `teams`                | `Team[]`        | Formed teams                                     |
| `unplacedParticipants` | `Participant[]` | Participants who could not be placed             |
| `errorMessage`         | String\|null    | Description of failure when `success` is `false` |

`result.hasUnplaced()` — convenience method returning `true` if any participants were unplaced.

### `Team`

| Method              | Description                              |
|---------------------|------------------------------------------|
| `getSize()`         | Number of members                        |
| `getParticipants()` | Copy of participants array               |
| `getSkillSum()`     | Sum of all members' `abilityScore` values |

## Strategies

- **RandomStrategy** — shuffles participants using Fisher-Yates, then assigns sequentially to teams.
- **FairStrategy** — sorts participants descending by `abilityScore`, then distributes using a snake-draft pattern to balance skill sums across teams.

## Testing

```bash
npm test
```

Tests are written with [Jest](https://jestjs.io/).
