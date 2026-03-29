# TeamBuilder Specification

## Domain Objects

```
RECORD Participant:
  id        : String  -- unique identifier
  name      : String  -- display name
  ability   : Float   -- skill score, any numeric value

RECORD TeamConfig:
  idealSize : Integer -- preferred team size
  minSize   : Integer -- minimum acceptable size
  maxSize   : Integer -- maximum acceptable size
  maxTeams  : Integer -- hard cap, never exceeds 100
  mode      : Enum    -- RANDOM | FAIR

RECORD TeamResult:
  success      : Boolean         -- true if at least one team was formed
  teams        : List<Team>      -- formed teams, may be empty
  unplaced     : List<Participant> -- participants who could not be placed
  message      : String          -- human-readable status message
```

## Interface: TeamBuilder

```
FUNCTION buildTeams(
  participants : List<Participant>,
  config       : TeamConfig
) -> TeamResult

CONSTRAINTS:
  The system shall not create more than 100 teams for a single event.
  
  If config.minSize is greater than config.maxSize, 
  the system shall return TeamResult with success=false and 
  message="Minimum size cannot be greater than maximum size".
  
  If config.idealSize is less than config.minSize or 
  greater than config.maxSize, the system shall return 
  TeamResult with success=false and 
  message="Ideal size must be between minimum and maximum size".
  
  If participants is null or empty, the system shall return 
  TeamResult with success=false and message="No participants provided".
  
  If participants.length is less than config.minSize, the system 
  shall return TeamResult with success=false and 
  message="Not enough participants to form a single team".
  
  When config.mode is RANDOM, the system shall distribute 
  participants into teams using random placement.
  
  When config.mode is FAIR, the system shall distribute 
  participants into teams by balancing the sum of ability 
  scores across all teams as evenly as possible.
  
  The system shall first attempt to form teams of idealSize.
  
  If the participant count does not divide evenly into idealSize, 
  the system shall use minSize and maxSize to form teams as 
  close to idealSize as possible.
  
  If any participants cannot be placed into a valid team, 
  the system shall include them in TeamResult.unplaced and 
  set TeamResult.success=true with 
  message="Teams formed with unplaced participants".
  
  If all participants are placed, the system shall set 
  TeamResult.success=true and message="Teams formed successfully".
```

## Interface: Team

```
FUNCTION getMemberCount() -> Integer
  The system shall return the number of participants on the team.

FUNCTION getParticipants() -> List<Participant>
  The system shall return the list of participants on the team.

FUNCTION getAbilitySum() -> Float
  The system shall return the sum of ability scores 
  of all participants on the team.
```

## Algorithm: RANDOM mode

```
When mode is RANDOM:
  The system shall shuffle the participant list using a 
  random seed.
  The system shall sequentially assign participants to 
  teams of idealSize until participants are exhausted.
  The system shall apply minSize and maxSize constraints 
  to handle remainders.
```

## Algorithm: FAIR mode

```
When mode is FAIR:
  The system shall sort participants by ability score 
  in descending order.
  The system shall distribute participants using a 
  snake-draft pattern:
    - Round 1: assign top N participants one per team 
      left to right
    - Round 2: assign next N participants one per team 
      right to left
    - Continue alternating until all participants are assigned
  This ensures ability scores are balanced across teams.
```