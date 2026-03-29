# Mermaid Syntax Reference

Complete syntax documentation for all Mermaid diagram types.

## 1. Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### Direction

| Code | Direction |
|------|-----------|
| `TD` / `TB` | Top to bottom |
| `BT` | Bottom to top |
| `LR` | Left to right |
| `RL` | Right to left |

### Node Shapes

| Syntax | Shape | Use Case |
|--------|-------|----------|
| `[text]` | Rectangle | Processes, actions |
| `(text)` | Rounded rectangle | Start/end |
| `{text}` | Diamond | Decisions |
| `[[text]]` | Subroutine | Subprocess |
| `[(text)]` | Cylinder | Database/storage |
| `((text))` | Circle | Connectors |
| `>text]` | Flag | Asymmetric |
| `{{text}}` | Hexagon | Preparation |

### Link Types

| Syntax | Style |
|--------|-------|
| `-->` | Arrow |
| `---` | Line (no arrow) |
| `-.->` | Dotted arrow |
| `==>` | Thick arrow |
| `--text-->` | Arrow with label |
| `--text---` | Line with label |

### Subgraphs

```mermaid
flowchart TB
    subgraph Group1[Title]
        A --> B
    end
    subgraph Group2
        C --> D
    end
    B --> C
```

---

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API
    participant DB

    User->>Client: Submit Form
    activate Client
    Client->>+API: POST /data
    API->>+DB: INSERT
    DB-->>-API: Success
    API-->>-Client: 201 Created
    Client-->>User: Show Success
    deactivate Client
```

### Participants

```
participant A as Alice
actor U as User
```

### Message Types

| Syntax | Description |
|--------|-------------|
| `->>` | Solid line, arrowhead |
| `-->>` | Dotted line, arrowhead |
| `-)` | Async message |
| `-x` | Lost message (X) |
| `--x` | Dotted lost message |

### Activation

```mermaid
sequenceDiagram
    A->>+B: Request (activate)
    B-->>-A: Response (deactivate)
```

Or explicit:
```
activate A
deactivate A
```

### Control Flow

```mermaid
sequenceDiagram
    loop Every minute
        A->>B: Heartbeat
    end

    alt Success
        A->>B: OK
    else Failure
        A->>B: Error
    end

    opt Optional
        A->>B: Maybe
    end

    par Parallel
        A->>B: Task 1
    and
        A->>C: Task 2
    end

    critical Critical Section
        A->>B: Important
    option Timeout
        A->>B: Retry
    end
```

### Notes

```
Note right of A: Single participant
Note over A,B: Spanning note
Note left of A: Left side
```

---

## 3. Class Diagram

```mermaid
classDiagram
    class Animal {
        <<abstract>>
        +name: string
        +age: int
        +makeSound(): void*
    }

    class Dog {
        +breed: string
        +makeSound(): void
        +fetch(): void
    }

    Animal <|-- Dog
```

### Visibility

| Symbol | Visibility |
|--------|------------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package/Internal |

### Relationships

| Syntax | Relationship |
|--------|--------------|
| `<\|--` | Inheritance |
| `*--` | Composition |
| `o--` | Aggregation |
| `-->` | Association |
| `..>` | Dependency |
| `..\|>` | Implementation |

### Cardinality

```
A "1" --> "*" B : has many
A "1" --> "0..1" B : has optional
```

### Annotations

```
<<interface>>
<<abstract>>
<<enumeration>>
<<service>>
```

### Namespaces

```mermaid
classDiagram
    namespace Models {
        class User
        class Order
    }
```

---

## 4. ER Diagram

```mermaid
erDiagram
    USER {
        int id PK
        string email UK
        string name
        datetime created_at
    }

    ORDER {
        int id PK
        int user_id FK
        decimal total
        string status
    }

    USER ||--o{ ORDER : "places"
```

### Cardinality Notation

| Left | Right | Meaning |
|------|-------|---------|
| `\|o` | `o\|` | Zero or one |
| `\|\|` | `\|\|` | Exactly one |
| `o{` | `}o` | Zero or more |
| `\|{` | `}\|` | One or more |

### Common Patterns

```
||--|| One to one
||--o{ One to many
o{--o{ Many to many
||--o| One to zero or one
```

### Attributes

```
type name PK "comment"
type name FK
type name UK
```

---

## 5. State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft

    Draft --> Submitted : submit
    Submitted --> UnderReview : assign

    state UnderReview {
        [*] --> Reviewing
        Reviewing --> RequestChanges : needs work
        Reviewing --> Approved : approve
        RequestChanges --> Reviewing : resubmit
    }

    UnderReview --> Published : publish
    Published --> [*]

    note right of Draft : Initial state
```

### Special States

```
[*]  Start/end state
state "Long Name" as alias
```

### Composite States

```mermaid
stateDiagram-v2
    state Parent {
        [*] --> Child1
        Child1 --> Child2
    }
```

### Choice/Fork/Join

```mermaid
stateDiagram-v2
    state choice <<choice>>
    state fork <<fork>>
    state join <<join>>

    [*] --> fork
    fork --> State1
    fork --> State2
    State1 --> join
    State2 --> join
    join --> [*]
```

### Concurrency

```mermaid
stateDiagram-v2
    state Concurrent {
        [*] --> A1
        --
        [*] --> B1
    }
```

---

## 6. Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: a1, 2024-01-01, 7d
    Task 2: after a1, 5d
    section Phase 2
    Task 3: 2024-01-15, 10d
    Milestone: milestone, m1, 2024-01-25, 0d
```

### Task Syntax

```
taskName: [id], [start], [duration]
taskName: [id], after [dependency], [duration]
taskName: crit, [id], [start], [duration]  (critical)
taskName: done, [id], [start], [duration]  (completed)
taskName: active, [id], [start], [duration]  (in progress)
```

---

## 7. Pie Chart

```mermaid
pie title Distribution
    "Category A": 40
    "Category B": 30
    "Category C": 30
```

Options:
```
pie showData
    "A": 50
    "B": 50
```

---

## 8. Git Graph

```mermaid
gitGraph
    commit id: "initial"
    branch develop
    checkout develop
    commit id: "feature-start"
    branch feature/auth
    checkout feature/auth
    commit id: "add-login"
    checkout develop
    merge feature/auth
    checkout main
    merge develop tag: "v1.0.0"
```

### Commands

| Command | Description |
|---------|-------------|
| `commit` | Add commit |
| `commit id: "msg"` | Commit with ID |
| `commit tag: "v1.0"` | Commit with tag |
| `commit type: HIGHLIGHT` | Highlighted commit |
| `branch name` | Create branch |
| `checkout name` | Switch branch |
| `merge name` | Merge branch |
| `cherry-pick id: "abc"` | Cherry-pick commit |

### Commit Types

```
NORMAL (default)
REVERSE (revert)
HIGHLIGHT (important)
```

---

## 9. Mindmap

```mermaid
mindmap
    root((Central Topic))
        Branch 1
            Leaf 1a
            Leaf 1b
        Branch 2
            Leaf 2a
        Branch 3
```

### Node Shapes

```
root((Circle))
    [Square]
    (Rounded)
    ))Bang((
    {{Cloud}}
```

---

## 10. Timeline

```mermaid
timeline
    title Project History
    2020 : Project Started
         : Initial Planning
    2021 : v1.0 Release
         : First Customer
    2022 : v2.0 Major Update
```

---

## Common Styling

### Inline Styles

```mermaid
flowchart LR
    A --> B
    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
```

### Class Definitions

```mermaid
flowchart LR
    A:::highlight --> B
    classDef highlight fill:#ff0,stroke:#333
```

### Link Styles

```mermaid
flowchart LR
    A --> B --> C
    linkStyle 0 stroke:#ff0000
    linkStyle 1 stroke:#00ff00
```
