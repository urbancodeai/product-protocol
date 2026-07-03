# Decision Records

Architecture Decision Records (ADRs) for the **design of the Product
Protocol itself** — why the specification is shaped the way it is. They
are informative: normative behavior lives in the PP documents.

(Products *managed by* the protocol record their decisions as `Decision`
objects per [PP-0003 §7](../../pp/PP-0003-product-brain.md); these files
are about this repository.)

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0000](./0000-adr-template.md) | ADR Template | Living |
| [0001](./0001-yaml-object-envelope.md) | YAML objects with a common envelope | Accepted |
| [0002](./0002-git-native-storage.md) | Git-native canonical storage | Accepted |
| [0003](./0003-human-only-approvals.md) | Human-only approval of governed objects | Accepted |
| [0004](./0004-conformance-classes.md) | Modular conformance classes | Accepted |
| [0005](./0005-rfc-style-process.md) | RFC-style numbered specification process | Accepted |
| [0006](./0006-append-only-records.md) | Append-only records for evidence and decisions | Accepted |

## Process

New ADRs: copy the template, number sequentially, submit by PR. An ADR is
`Proposed` until the related change merges, then `Accepted`. Superseded
ADRs are never deleted.
