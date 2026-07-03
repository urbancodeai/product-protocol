# Reference Architecture

*(Informative. The normative contracts live in the PP documents cited
throughout.)*

This section describes one coherent way to assemble a conformant
Product Protocol system. It is a *reference*, not a requirement: any
architecture that satisfies the normative contracts is conformant
(PP-0001-RQ-002).

- [Components and Data Flow](./components.md)
- [Actors and Trust Boundaries](./actors-and-trust.md)
- [Storage and Synchronization](./storage-and-sync.md)

## The system at a glance

```mermaid
graph TB
    subgraph Humans
        H[Product Owner / Team]
    end
    subgraph Interface
        HI[Human Interface<br/>conversational]
        AQ[Approval Queue]
    end
    subgraph Runtime["Runtime (PP-0010)"]
        PL[Planner<br/>PP-0006]
        SCH[Scheduler]
        WK[Workers<br/>PP-0007]
        EV[Evaluators<br/>PP-0008]
        DEP[Deployment Controller]
    end
    subgraph Store[".product/ tree (PP-0002 §7)"]
        BR[Product Brain<br/>PP-0003]
        SP[Specifications<br/>PP-0004]
        CO[Constitution<br/>PP-0005]
        TG[Task Graph]
        EVR[Evaluations & Evidence]
    end
    subgraph World
        ENV[Environments]
        TEL[Telemetry]
    end

    H <--> HI
    HI --> BR
    HI --> AQ
    AQ -- "Decisions" --> SP
    AQ -- "Decisions" --> CO
    SP --> PL
    CO --> EV
    PL --> TG
    TG --> SCH --> WK
    WK -- "Artifacts" --> EVR
    EV --> EVR
    EVR -- "gates" --> DEP
    DEP --> ENV
    ENV --> TEL
    TEL -- "Observations" --> BR
    BR --> PL
    BR --> WK
```

The store is the only shared state; every component reads and writes PP
objects there. Components communicate *through the objects* — a Planner
does not call a Worker; it writes `ready` Tasks that Workers claim. This
makes every component independently replaceable (conformance classes,
[terminology §4](../../reference/terminology.md#4-conformance-classes))
and every interaction auditable.
