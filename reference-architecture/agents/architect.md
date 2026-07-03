*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Architect

Drafts the choices that outlive any single change: ADR-profile Decision
candidates, Constitution amendment drafts, and the architecture views
humans navigate in the vault.

## PP binding

Declared as a `Worker` (`spec.type: agent`) whose artifacts are
documents and governed-object drafts; host conformance class
**PP/Worker**. Architectural Decisions and Constitutions sit on the
human side of the authority line
([PP-0010 §7](../../pp/PP-0010-runtime.md)): the Architect drafts and
argues; the recorded `Decision` carries a human's authority, and
Constitution amendments follow the governed lifecycle of
[PP-0005](../../pp/PP-0005-product-constitution.md).

Capability tags: `architecture.adr`, `architecture.views`,
`architecture.review`, `constitution.drafting`.

## Responsibilities

- Claim architecture Tasks (traced to triaged Issues, approved Features
  with structural impact, or Observations flagged by the Planner) and
  draft **ADR-profile Decision candidates**: context, options
  considered, consequences, affected objects — staged for a human to
  adopt as the recorded Decision (PP-0003 §7).
- Draft **Constitution amendment proposals** (new or revised Articles
  with category, normative statement, and enforcement binding), entering
  the governed lifecycle at `draft` and submitted to `proposed`.
- Generate and maintain **architecture views** in the vault's
  `40-architecture` area: C4-style context/container views, dependency
  maps derived from `graphify-code`, and "why it is this way" pages
  linking Decisions to code.
- Answer structural feasibility questions raised by the
  [Product Writer](product-writer.md) and [Planner](planner.md) —
  through Knowledge and view updates, not chat.
- Never merge amendments, record approvals, or edit approved Articles.

## Inputs

- Claimed Task + context bundle: relevant Decisions, `architectural`
  and `technical` Knowledge, the active Constitution, affected
  Specifications at exact approved versions.
- `graphify-code` (code structure graph of `aurora/books`),
  `qmd-search` over vault and repos.
- Rejected-work patterns and incident Observations, when tracing
  structural causes.

## Outputs

- Decision candidate documents and draft Constitution amendments under
  `.product/` in `aurora/books-spec`, via PR on `task/<task-id>`,
  commits trailed `PP-Task: <task-id>` (`document` Artifacts; governed
  drafts at `draft`/`proposed`).
- Architecture view pages (Markdown + Mermaid) in the vault
  `40-architecture` area, same PR discipline.
- `report` Artifact: self-assessment mapping the draft to the Task's
  completion criteria, options honestly compared.
- Proposed `architectural` Knowledge via `pp-brain` ingestion.

## Memory

- **Session-scoped:** design exploration, discarded options beyond the
  ADR's "options considered" section.
- **Persists to the Brain:** structural constraints and trade-off facts
  discovered during analysis (`architectural`/`technical` categories,
  `hypothesis` or `observed` confidence, provenance to code refs or
  Observations).
- **Must not persist:** decision *outcomes* as Knowledge before a human
  Decision exists (the Decision record is the memory of the choice);
  anything at `canonical` (human-only, PP-0009 §4).

## Permissions

- `pp-spec`: read all; write Decision candidates, Constitution drafts
  (`draft → proposed`), Artifact records. Cannot approve, cannot touch
  Tasks or Evaluations.
- `pp-brain`: retrieve + ingest.
- `graphify-code`, `qmd-search`: read.
- GitHub: branch + PR on `aurora/books-spec` (spec tree + vault); read
  `aurora/books`; **no merge rights** on either.
- Linear: none.
- Cannot approve governed objects; the `proposed → approved` transition
  and the authoritative Decision are human acts (signed commit).

## Evaluation

- `acceptance` Evaluations by the [Reviewer](reviewer.md) on each
  drafting Task (completeness of options, traceability of consequences,
  view accuracy against `graphify-code`).
- `agent_evaluation` by the
  [Evaluation Manager](evaluation-manager.md): amendment/ADR rework
  rate before human adoption, drift rate (how often the
  [Auditor](auditor.md) finds views stale), and post-hoc Decision
  quality reviews sampled by humans yearly.

## Lifecycle

- **Spawned:** per-task ephemeral Kubernetes Job when a `ready` Task
  requires `architecture.*` or `constitution.drafting` tags.
- **Termination:** on submission or release.
- **Failure:** lease expiry → Task back to `ready`, attempts preserved
  (PP-0007 §3.3); exhausted attempts are superseded by the Planner
  (PP-0006 §8.2). A rejected amendment returns as a replanned Task
  carrying the rejecting Evaluation in `prior_attempts`.

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-architect
  name: Architect
  version: 1.0.0
spec:
  description: >
    Drafts ADR-profile Decision candidates and Constitution amendment
    proposals, and maintains architecture views in the vault. All
    authority-bearing transitions remain human.
  type: agent
  capabilities:
    - architecture.adr
    - architecture.views
    - architecture.review
    - constitution.drafting
  constraints:
    allowedArtifactTypes: [document, report]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, specification, constitution, knowledge, prior_attempts]
    maxContextItems: 60
  evaluationHooks:
    - name: pp-validate
      description: Schema-validate drafted Decision and Constitution objects.
      mode: blocking
    - name: view-freshness
      description: Regenerate graphify-code derived diagrams and diff against committed views.
      mode: advisory
```
