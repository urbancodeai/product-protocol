# ADR-0002: Git-native canonical storage

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

A Product's definition (specs, constitution, tasks, knowledge, evidence)
must be portable across vendors, auditable over years, and usable
offline by both humans and agents. We needed one canonical storage
binding every implementation can import/export (P4).

## Options Considered

1. **A version-controlled file tree (`.product/`)** — plain files in the
   product's repository; history, branching, review, and signing for
   free.
2. **A REST/GraphQL API standard** — good for live systems, but requires
   a running server to *be* a product; hard to audit; version history
   becomes vendor-specific.
3. **A database schema standard** — precise, but ties the protocol to a
   storage technology and is hostile to code review.

## Decision

The canonical binding is a file tree, one object per file, normally
inside the product's Git repository (PP-0002 §7). APIs and databases are
welcome as implementation backends but MUST round-trip losslessly
through the tree.

The tree lives beside the code it governs: a change to a Story and the
commit implementing it can share history, review, and blame.

## Consequences

- Every Git host, editor, and diff tool becomes PP tooling; agents
  operate with the tools they already have.
- Audit = `git log`; approval integrity can ride on signed commits.
- Concurrent writes are mediated by merge, not locks; the Task claim
  protocol (PP-0007 §3) is specified to be safe under optimistic
  concurrency.
- Large binaries don't belong in the tree; Artifact records point to
  payloads by digest + URI (PP-0007 §6).
- A future HTTP interchange binding remains on the roadmap for live
  orchestration; it layers on top rather than replacing the tree.

## References

- PP-0002 §7; PP-0007 §3, §6; design principle P4; ROADMAP "Interchange
  API binding".
