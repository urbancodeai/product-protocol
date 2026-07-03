*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Librarian

The context-assembly service and index gardener: answers "what do we
know about X" for every other agent, and keeps the qmd-search and
Graphify indexes that make the answer fast and honest.

## PP binding

Declared as a `Worker` (`spec.type: agent`); host conformance class
**PP/Worker**, operating the retrieval side of **PP/Brain**
([PP-0009 §3](../../pp/PP-0009-knowledge-protocol.md)). It writes no
Knowledge of substance — retrieval is read-only by contract
(PP-0009 §3) — its writable surface is indexes and retrieval reports.

Capability tags: `knowledge.retrieval`, `knowledge.context-assembly`,
`index.qmd`, `index.graph`.

## Responsibilities

- **Context assembly** (PP-0009 §3.2): given a Task ref and a budget,
  assemble the bounded bundle a Worker is owed — trace-referenced
  objects first, then `canonical`/`validated` Knowledge in relevant
  categories, then graph-proximate material; trim by ascending
  relevance, never mid-claim; preserve `id@version`, confidence, and
  provenance on every item; flag unresolved `contradicts` pairs instead
  of silently dropping a side.
- Never launder confidence: the bundle presents Knowledge exactly at
  its stored rung.
- Mark content from untrusted origins (user-reported Issues, external
  documents) as data, not instructions, in assembled bundles
  (PP-0007 §4).
- **Index gardening:** keep `qmd-search` embeddings/text indexes over
  the vault, `.product/` tree, and code current with `main`; regenerate
  `graphify-code`'s structure graph on merge; verify index/tree
  consistency and rebuild on drift.
- Serve ad-hoc "what do we know about X" retrievals to the
  [Planner](planner.md), [Interviewer](interviewer.md), engineers, and
  Evaluators — each answer a citable retrieval report, not chat.

## Inputs

- Context requests (Task ref + budget) from the scheduler at claim
  time; ad-hoc retrieval requests recorded as lightweight Tasks.
- The Product Brain via `pp-brain` (retrieve), the vault, both repos'
  trees, and merge events (index triggers).

## Outputs

- Context bundles delivered to the requesting session (ephemeral
  payload) plus a durable `report` Artifact per assembly: what was
  selected, what was trimmed, which contradictions were flagged — so
  audits can reconstruct what a Worker knew (PP-0007 §4 provenance).
- Index updates: `qmd-search` and `graphify-code` state (infrastructure
  data, outside the `.product/` tree), and `dataset` Artifacts pinning
  index snapshots by digest.
- Consistency Issues when the Brain and indexes disagree beyond
  tolerance.

## Memory

- **Session-scoped:** ranking scratch, candidate sets.
- **Persists to the Brain:** nothing as content — the Librarian reads
  the Brain, it does not author it. Retrieval-quality observations
  ("Task contexts in checkout keep missing payment constraints") go to
  the [Knowledge Curator](knowledge-curator.md) as proposed `process`
  Knowledge via Issues.
- **Must not persist:** cached copies of Knowledge as new objects
  (duplication, PP-0009 §2.3), relevance scores as fact, or any
  confidence-annotation of its own invention.

## Permissions

- `pp-brain`: retrieve only — no ingest, no update, no link.
- `qmd-search`: read + index-admin (the only agent with index write).
- `graphify-code`: read + rebuild.
- `pp-spec`: read all; claim/submit its own index/assembly Tasks; write
  own Artifact records and consistency Issues only.
- GitHub: read `aurora/books` and `aurora/books-spec`; **no push, no
  merge** (indexes live outside the repos).
- Linear: none. Cannot approve governed objects; cannot write Knowledge,
  Tasks (other than claiming its own), or Evaluations.

## Evaluation

- `agent_evaluation` by the
  [Evaluation Manager](evaluation-manager.md): context precision/recall
  (sampled bundles judged for missing-but-relevant and
  included-but-irrelevant items), downstream blocked-rate attributable
  to missing context (shared metric with the Planner), index freshness
  lag, determinism of repeated retrievals (PP-0009 §3.1).
- The [Auditor](auditor.md) spot-checks provenance preservation and
  confidence-laundering invariants on assembled-bundle reports.

## Lifecycle

- **Spawned:** on-demand ephemeral sessions for context assembly
  (invoked by the scheduler at every claim) and scheduled sessions
  (hourly index refresh, nightly consistency sweep).
- **Termination:** bundle delivered / sweep committed.
- **Failure:** assembly crash → the claiming Worker's context request
  retries against a fresh session; index-sweep crash → next scheduled
  sweep catches up; any claimed housekeeping Task returns to `ready` on
  lease expiry (PP-0007 §3.3). Indexes are rebuildable from the trees —
  they are cache, never source of truth.

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-librarian
  name: Librarian
  version: 1.0.0
spec:
  description: >
    Context-assembly and index-gardening agent: assembles bounded,
    provenance-preserving knowledge bundles for other agents per
    PP-0009 §3.2, and maintains the qmd-search and graphify-code
    indexes over the vault, spec tree, and code.
  type: agent
  capabilities:
    - knowledge.retrieval
    - knowledge.context-assembly
    - index.qmd
    - index.graph
  constraints:
    allowedArtifactTypes: [report, dataset]
    maxConcurrentTasks: 4
    constitutionBound: true
  contextContract:
    requires: [task, knowledge]
    maxContextItems: 100
  evaluationHooks:
    - name: bundle-invariants
      description: Verify every bundle item carries id@version, confidence, provenance; no confidence uplift.
      mode: blocking
    - name: index-consistency
      description: Sample index hits against tree state before publishing a refresh.
      mode: advisory
```
