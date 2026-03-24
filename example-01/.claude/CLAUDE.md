# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this example.

## Project Overview

Teambuilder is a general-purpose team building application. Its core feature is taking a set of participants registered for an event and dividing them into teams.

This is a pure Java library — no main class, no Spring, no CLI. All functionality is validated through unit tests.

## Build & Run

SDKMAN must be sourced before running Gradle commands:

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
gradle build                                          # compile + test
gradle test                                           # run all tests
gradle test --tests 'com.teambuilder.SomeTest'        # single test class
gradle test --tests 'com.teambuilder.SomeTest.method' # single test method
```

## Key Conventions

- **Package root:** `com.teambuilder`
- **Java version:** 21 (Temurin LTS, managed via SDKMAN)
- **Build tool:** Gradle 8.12 with `java-library` plugin
- **Test framework:** JUnit 5 + AssertJ

