# ADR-0005: RFC-style numbered specification process

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

The specification will grow through contributions from people who
disagree. It needs a document structure and process that separates
normative requirements from rationale, keeps requirements citable and
stable over years, and makes document maturity legible to implementers.
Proven models exist: IETF RFCs, Python PEPs, Rust RFCs, Kubernetes KEPs,
OpenAPI.

## Options Considered

1. **Numbered PP documents with a fixed template, BCP 14 keywords, and
   per-requirement identifiers** — the RFC/PEP lineage.
2. **A single monolithic spec document** — easy to read once, but merge
   conflicts, unreviewable diffs, and no per-area maturity.
3. **Wiki-style living docs** — low friction, but normative stability
   and citability suffer; "the spec changed under me" becomes routine.

## Decision

Option 1. Every specification is a numbered PP following the PP-0000
template (identical section order), with status lifecycle
Draft → Review → Accepted → Stable, BCP 14 requirement language audited
per [terminology](../../reference/terminology.md), and stable
`[PP-NNNN-RQ-KKK]` requirement identifiers that are never renumbered.
`Stable` additionally demands two independent implementations, borrowed
from IETF practice, so maturity claims are earned, not declared.

## Consequences

- Implementers can cite and track individual requirements across spec
  revisions; changelogs and conformance suites key off requirement IDs.
- Uniform structure lowers review cost and makes gaps visible (an empty
  Security Considerations section is a red flag, not an omission).
- Ceremony has a cost for small changes; the editorial approval tier in
  GOVERNANCE keeps typo-fixes cheap.

## References

- pp/PP-0000-template.md; pp/README.md; GOVERNANCE.md; prior art: BCP 9
  (IETF standards process), PEP 1, Rust RFC process, KEP process.
