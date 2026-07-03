# ADR-0003: Human-only approval of governed objects

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

An autonomous engineering system that can rewrite its own goals, specs,
and rules is unauditable and unsafe. At the same time, requiring human
sign-off on every action would erase the value of autonomy. The protocol
needed a crisp boundary between what agents may do freely and what
requires human authority (P3).

## Options Considered

1. **Human approval for governed objects only** — Goals, Capabilities,
   Specifications, Constitutions, Features, Stories, GoldenTests move to
   `approved` only via a human Decision; everything else (tasks,
   artifacts, evaluations, knowledge, deployments within gates) is
   autonomous.
2. **Configurable approval policies** — each product chooses what needs
   approval. Flexible, but "the constitution says agents can amend the
   constitution" becomes expressible, and interop on trust semantics
   dies.
3. **Human approval of outcomes only (deployments)** — maximally
   autonomous, but by deployment time the intent drift has already
   happened; reviewing a diff of behavior is harder than reviewing a
   spec.

## Decision

Option 1, as a protocol invariant, not a policy: the
`proposed → approved` transition MUST be performed by a human and
recorded as a Decision (PP-0002 §6.2, RQ-008/010), and no PP document may
define a human-free path to approval (PP-0001-RQ-003). GoldenTests are
included in the governed set because whoever controls the tests controls
what "correct" means.

## Consequences

- Trust in a PP system is verifiable from the record: every approved
  object links to a human Decision.
- Human attention concentrates where it matters — intent and rules —
  and stays out of the mechanical loop.
- Bottleneck risk: products with high spec churn feel approval latency.
  Mitigation: small Stories, batched approval queues (PP-0010 §7), and
  agents preparing high-quality proposals.
- Approval integrity depends on identity; signing is roadmap work.

## References

- PP-0001 §5; PP-0002 §6.2; PP-0010 §7; design principle P3.
