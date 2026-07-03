# ADR-0006: Append-only records for evidence and decisions

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

Evaluations, Decisions, Observations, and Artifacts exist to be trusted
later — by auditors, by humans reviewing agent work, and by the learning
loop itself. A record that can be edited after the fact is worthless as
evidence, and an autonomous system that can revise its own history is
worse than one with no history (P6, P7, P12).

## Options Considered

1. **Append-only records; corrections supersede** — records are written
   once; a mistake is corrected by a new record referencing what it
   supersedes.
2. **Mutable records with audit trails** — familiar from databases, but
   pushes integrity into implementation-specific audit mechanisms the
   protocol can't verify.
3. **Full event sourcing for all kinds** — maximal auditability, but
   turns every simple object read into a fold and puts an event store
   between humans and their files.

## Decision

Option 1, scoped to the record kinds: `Evaluation`, `Observation`,
`Decision`, `Artifact` (PP-0002 §6.3). Governed objects get the
complementary rule — approved versions are immutable, change is a new
version (PP-0002 §6.2). Work objects (`Task`) remain mutable in
`status` only, since they model live state, not testimony.

## Consequences

- "What did we know and when" is answerable from the tree alone; Git
  history plus append-only semantics make tampering evident.
- Failed and rejected work stays on the record as learning input
  (P12) — the Brain distills lessons instead of deleting embarrassments.
- Storage grows monotonically; PP-0003 defines compaction by
  supersession (never silent deletion) and implementations may archive
  cold records.

## References

- PP-0002 §6.2–6.3; PP-0003 (long-term memory); PP-0008 §8 (evidence);
  design principles P6, P7, P9, P12.
