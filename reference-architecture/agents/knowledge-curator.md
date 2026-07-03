*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Knowledge Curator

Keeps the Product Brain honest: distills conversations, Observations,
Evaluations, and documents into deduplicated Knowledge; runs validation
and staleness sweeps; and regenerates the vault views humans navigate.

## PP binding

Declared as a `Worker` (`spec.type: agent`); host conformance class
**PP/Worker**, operating the write side of **PP/Brain**
([PP-0009](../../pp/PP-0009-knowledge-protocol.md) ingestion, update,
link, validate). It holds the roster's only broad `pp-brain` write
scope, and even that stops at the human line: promotions into (or
demotions out of) `canonical` require a human Decision (PP-0009 §4).

Capability tags: `knowledge.ingestion`, `knowledge.validation`,
`knowledge.linking`, `knowledge.curation`, `vault.views`.

## Responsibilities

- **Ingestion** (PP-0009 §2): distill intake briefs from the
  [Interviewer](interviewer.md), Observations from deployments,
  Evaluations, Decisions, and external documents into Knowledge — one
  claim per object, self-contained statements, provenance always,
  dedup-checked against existing Knowledge before any new `id`.
- Honest confidence at creation: `hypothesis` by default, `observed`
  only with observation/evaluation provenance (PP-0009 §2.4); stage
  `validated → canonical` promotion *proposals* for humans, never the
  promotion itself.
- Maintain the **learning loop** (PP-0010 §8.2): distillation cadence
  honored (no Observation left undistilled), a `lesson` Knowledge
  object for every production incident and for recurring Task
  rejections.
- **Linking and contradiction handling** (PP-0009 §5): add graph
  edges, surface every unresolved `contradicts` pair to humans through
  the curation surface, and record resolutions.
- **Staleness sweeps** (PP-0009 §6 V8): refresh or flag Knowledge past
  its review interval; run the full validation suite (V1–V9) and fix
  what agents may fix, raise Issues for the rest.
- **Vault view generation:** regenerate the Obsidian vault's derived
  pages — Brain indexes by category/confidence, contradiction and
  staleness dashboards, per-Feature knowledge maps — clearly marked as
  generated; the `.product/` tree stays the source of truth.

## Inputs

- Intake brief Artifacts and transcripts, Observations, Evaluation
  records, Decision records, external documents referenced by humans.
- The current Brain (via `pp-brain` retrieve) for dedup and linking;
  `qmd-search` for overlap detection.

## Outputs

- Knowledge objects (new ids and new versions) in
  `.product/brain/` of `aurora/books-spec`, via PR on
  `task/<task-id>` with `PP-Task:` trailers; atomic, schema-valid
  writes only (PP-0009 §1).
- Link edges and contradiction flags; promotion-proposal entries in the
  approval queue (the human's Decision performs the promotion).
- Validation reports (`report` Artifacts) and Issues for V-level errors
  it cannot resolve.
- Regenerated vault views (Markdown) in the vault tree, same PR
  discipline.

## Memory

The Curator *is* the memory mechanism, so its own boundary matters
most:

- **Session-scoped:** distillation scratch, candidate claim sets.
- **Persists to the Brain:** the distilled claims themselves — that is
  its output, not a side effect.
- **Must not persist:** raw source material as Brain content
  (PP-0003 §1.1 — transcripts stay as Artifacts), verbatim copies as
  statements (PP-0009 §2.2), confidence it cannot evidence, secrets or
  personal data from conversations, duplicate ids (PP-0009 §2.3).

## Permissions

- `pp-brain`: full ingest/update/link/validate — **except** the
  human-only `canonical` transitions, which the server rejects for any
  agent identity (PP-0009 §4).
- `pp-spec`: read all; write Knowledge, own Artifacts, Issues; claim
  own Tasks.
- GitHub: branch + PR on `aurora/books-spec` (brain + vault paths);
  **no merge** of anything requiring approval; read `aurora/books`.
- `qmd-search`: read (the [Librarian](librarian.md) owns index writes);
  `graphify-code`: read.
- Linear: none. Cannot approve governed objects; cannot promote to or
  demote from `canonical`.

## Evaluation

- `agent_evaluation` by the
  [Evaluation Manager](evaluation-manager.md): distillation coverage
  (Observations/briefs left undistilled past cadence), dedup precision
  (V9 duplicate warnings per hundred objects), provenance completeness,
  contradiction time-to-surface, vault view freshness.
- The [Auditor](auditor.md) audits confidence coherence (V4) and the
  no-agent-`canonical` invariant on schedule.

## Lifecycle

- **Spawned:** event-triggered ephemeral Jobs (post-conversation
  handoff, post-deployment Observation batch, Evaluation rejections)
  plus scheduled sweeps (nightly validation, weekly staleness, weekly
  vault regeneration).
- **Termination:** when the batch is distilled and validated or the
  sweep is committed.
- **Failure:** atomic writes mean a crash leaves no partial objects
  (PP-0009-RQ-002); undistilled input is re-queued — sources are
  durable Artifacts/records, so nothing is lost, only late; claimed
  Tasks return to `ready` on lease expiry (PP-0007 §3.3).

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-knowledge-curator
  name: Knowledge Curator
  version: 1.0.0
spec:
  description: >
    Product Brain curator: distills conversations, Observations,
    Evaluations, and documents into deduplicated, provenance-bearing
    Knowledge; runs validation and staleness sweeps; regenerates vault
    views. Canonical promotions remain human Decisions.
  type: agent
  capabilities:
    - knowledge.ingestion
    - knowledge.validation
    - knowledge.linking
    - knowledge.curation
    - vault.views
  constraints:
    allowedArtifactTypes: [document, report]
    maxConcurrentTasks: 2
    constitutionBound: true
  contextContract:
    requires: [task, knowledge, prior_attempts]
    maxContextItems: 80
  evaluationHooks:
    - name: brain-validate
      description: Run the PP-0009 §6 validation suite over the changeset before submit.
      mode: blocking
    - name: dedup-scan
      description: Overlap scan of new claims against current Knowledge in category.
      mode: blocking
```
