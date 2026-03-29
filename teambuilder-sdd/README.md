# Teambuilder — SDD

A pure Java library that divides participants into teams using random or ability-based fairness strategies.

## Prerequisites

- Java 21 (Temurin LTS, managed via [SDKMAN](https://sdkman.io/))
- Gradle 8.12

## Running Tests

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Run all tests
gradle test

# Run a single test class
gradle test --tests 'com.teambuilder.TeamBuilderTest'

# Run a single test method
gradle test --tests 'com.teambuilder.TeamBuilderTest.ValidationTests.nullParticipantListReturnsFailure'

# Full build (compile + test + jar)
gradle build
```

Test reports are generated at `build/reports/tests/test/index.html`.
