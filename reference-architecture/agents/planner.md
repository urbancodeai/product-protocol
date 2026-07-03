*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Planner

The PP Planner: decomposes approved Stories and triaged Issues into the
Task DAG, keeps it acyclic and prioritized, and replans on rejection,
Issues, spec changes, and Observations.

## PP binding

Declared as a `Planner` object
([PP-0006 §3](../../pp/PP-0006-task-graph.md)); host conformance class
**PP/Planner** (PP-0006 with PP-0002). It is the only agent that
creates or amends Tasks — Workers never invent work
(PP-0007 §1) and humans never create Tasks; human intent reaches the
graph only through approved Stories/Features and triaged Issues
(PP-0006 §2.1).

Capability tags: `plan.decomposition`, `plan.estimation`,
`plan.replanning`, `plan.scheduling`.

## Responsibilities

- Decompose newly `approved` Stories/Features and `triaged` Issues into
  Tasks: one Worker, one claim per Task; completion contracts covering
  every acceptance criterion; ordering as `dependsOn` edges, never
  prose (PP-0006 §2.2).
- Attach curated context to each Task (`spec.context`): Knowledge refs
  selected with the [Librarian](librarian.md), Specification slices at
  exact approved versions, in-scope Constitution article ids.
- Keep the graph acyclic, priorities honest, and the ready queue
  ordered `priority_fifo` (PP-0006 §6); surface unclaimable Tasks as
  Issues rather than letting them sit.
- Replan on its declared triggers — `rejection`, `issue`,
  `specification_change`, `observation` (PP-0006 §8): retry within
  `maxAttempts`, amend un-started Tasks, or supersede with replacement
  Tasks; never abandon a `rejected` Task silently.
- Maintain the **Linear mirror**: create/update Linear issues
  reflecting Task state via `linear-mirror`. The mirror is
  write-through and one-way; `.product/tasks/` remains the source of
  truth.
- Never execute or evaluate work; never draft or transition governed
  objects.

## Inputs

- Approved Stories/Features and triaged Issues (via `pp-spec`).
- Rejecting Evaluations, Observations, and lesson Knowledge — PP-0010
  §8.2 requires replanning be informed by the Brain (`pp-brain`
  retrieval).
- The current Task Graph derived from `.product/tasks/`; Worker
  declarations and their capability tags for allocation (PP-0006 §7).
- Deadline-miss and lease-expiry signals from the scheduler.

## Outputs

- Task objects and `spec` amendments to un-started Tasks in
  `.product/tasks/` (`aurora/books-spec`), committed directly on
  `main`-tracking planning branches merged by the runtime's fast-path
  (Tasks are not governed objects); cancellations with provenance
  annotations when superseding (PP-0006 §8.2).
- Updates to Issue `status.tasks` when planning Issues (PP-0006 §8.3).
- Linear issue creation/updates (mirror only).
- Planning-rationale notes in `Task.spec.context.notes`.

## Memory

- **Session-scoped:** decomposition scratch, candidate DAG shapes.
- **Persists to the Brain:** recurring decomposition lessons (e.g.
  "checkout Tasks that mix schema and API changes get rejected") as
  `process`/`lesson` Knowledge with provenance to the rejecting
  Evaluations.
- **Must not persist:** per-Task state (that lives on `Task.status`),
  speculative estimates as fact, or anything above `observed`
  confidence.

## Permissions

- `pp-spec`: read all; write Tasks and Issue `status.tasks`; cannot
  write governed objects, Evaluations, or Deployments; cannot modify a
  Task's `spec` while it is claimed → evaluating (PP-0006 §5.7,
  enforced server-side).
- `pp-brain`: retrieve + ingest (lessons).
- `qmd-search`, `graphify-code`: read.
- GitHub: write access limited to `.product/tasks/` and
  `.product/issues/` paths of `aurora/books-spec`; **no merge rights**
  elsewhere; read `aurora/books`.
- Linear: write (the only roster agent with mirror write scope).
- Cannot approve governed objects; plans only from `approved` /
  `triaged` sources (PP-0006-RQ-006/007, checked again at claim time).

## Evaluation

- `agent_evaluation` by the
  [Evaluation Manager](evaluation-manager.md): first-pass Task
  acceptance rate (decomposition quality), rework rate after
  rejection-replans, blocked-rate attributable to missing context,
  ready-queue starvation and deadline-miss counts, mirror fidelity
  (Linear vs. `.product/tasks/` divergence).
- The [Auditor](auditor.md) checks graph invariants on schedule:
  acyclicity, traceability of every Task, no Tasks from unapproved
  sources.

## Lifecycle

- **Spawned:** event-triggered ephemeral sessions on each trigger
  (approval merge, Evaluation rejection, Issue triage, Observation
  flag) plus a scheduled nightly sweep for deadlines, unclaimable
  Tasks, and mirror reconciliation.
- **Termination:** when the triggering event is fully planned and the
  graph validates.
- **Failure:** a crashed planning session leaves the graph in its last
  committed (always valid) state; the trigger re-fires on the next
  sweep. There is no lease to lose — the Planner claims no Tasks; its
  own runs are idempotent replans.

## Definition sketch

```yaml
pp: "0.1"
kind: Planner
metadata:
  id: planner-main
  name: Primary Planner
  version: 1.0.0
spec:
  description: >
    Agent planner for aurora-books: decomposes approved Stories and
    triaged Issues into Tasks with curated context and completion
    contracts, maintains the DAG and priorities, replans on feedback,
    and keeps the Linear mirror in sync.
  type: agent
  policies:
    scheduling: priority_fifo
    maxParallelism: 6
    replanOn:
      - rejection
      - issue
      - specification_change
      - observation
  capabilities:
    - plan.decomposition
    - plan.estimation
    - plan.replanning
    - plan.scheduling
```
