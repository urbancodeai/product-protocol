*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Frontend Engineer

Implements the aurora-books UI — TypeScript/React screens, components,
and client state — from approved Stories and the Product Writer's
approved prototypes, one claimed Task at a time.

## PP binding

Declared as a `Worker` (`spec.type: agent`); host conformance class
**PP/Worker** ([PP-0007](../../pp/PP-0007-worker-protocol.md)). Same
execution contract as the [Backend Engineer](backend-engineer.md) —
different capability surface.

Capability tags: `code.typescript`, `ui.react`, `ui.css`,
`ui.accessibility`, `test.unit`.

## Responsibilities

- Claim `ready` Tasks whose tags it covers; implement UI per the
  Story's acceptance criteria and the approved HTML prototype Artifact
  referenced in the Task's context.
- Work on branch `task/<task-id>` in `aurora/books`; commits carry the
  trailer `PP-Task: <task-id>`.
- Honor Constitution articles in scope — notably accessibility and
  design-system articles — during execution, not as an afterthought
  (PP-0007 §5.1).
- Write unit/component tests; run pre-submit hooks (lint + unit,
  `blocking`; visual smoke `advisory`) before submitting (PP-0007 §8).
- Record `changeset` (commit-digest-pinned) and `report` Artifacts;
  attach screenshots of key states as evidence pointers for the
  Reviewer's `visual` judgment.
- Block with `status.blockedReason` on ambiguous UX rather than
  inventing behavior; a suspected prototype/spec conflict becomes an
  Issue, never a silent deviation (PP-0007 §5.2, §5.4).

## Inputs

- Claimed Task + context bundle: Story and prototype Artifacts at exact
  approved versions, design-system Knowledge, Constitution articles,
  prior attempts on retries.
- `aurora/books` working tree; `graphify-code` for component structure;
  `qmd-search` for existing patterns and conventions.

## Outputs

- PR on `aurora/books` (`task/<task-id>`, `PP-Task:` trailers).
- Artifact records in `.product/tasks/artifacts/`: `changeset`,
  `report` (self-assessment per completion criterion), `image`
  Artifacts for screenshot evidence.
- Submission via `pp-spec`; merge happens only through branch
  protection when blocking gates pass — never by this agent.

## Memory

- **Session-scoped:** component scratch, styling iterations, local
  storybook state.
- **Persists to the Brain:** durable UI facts (browser quirks,
  design-token constraints, accessibility findings) as
  `technical`/`user` Knowledge at `hypothesis`/`observed` with
  provenance.
- **Must not persist:** secrets or API keys, screenshots containing
  real user data, subjective quality claims about its own work, or
  design opinions dressed as `validated` Knowledge.

## Permissions

- GitHub: branch + push + PR on `aurora/books`; **no merge**; no
  workflow-file edits; read `aurora/books-spec`.
- `pp-spec`: claim/renew/release/submit own Tasks; write own Artifact
  records only.
- `pp-brain`: retrieve + ingest; `qmd-search`, `graphify-code`: read.
- Linear: none.
- Cannot approve governed objects; cannot mark its own Task
  `done`/`rejected` (PP-0007-RQ-011); cannot weaken or edit GoldenTests
  or gates.

## Evaluation

- Per-submission: `acceptance` and `visual` Evaluations by the
  [Reviewer](reviewer.md) (distinct model configuration per
  PP-0008 §5.2), `regression` and `accessibility` Evaluations recorded
  by the [Evaluation Manager](evaluation-manager.md) from Actions runs
  (Playwright + axe).
- `agent_evaluation` over time: first-pass acceptance rate, rework
  rate, prototype-fidelity score (visual diff against the approved
  prototype), accessibility-violation trend, spec-question rate.

## Lifecycle

- **Spawned:** per-task ephemeral Kubernetes Job on scheduler match;
  one claim per session.
- **Termination:** on submission or release; pod deleted.
- **Failure:** lease expiry → Task back to `ready`, attempt consumed
  (PP-0007 §3.3); on rejection the Task returns via the
  [Planner](planner.md)'s retry/replan path (PP-0006 §8.2) with the
  rejecting Evaluation in `prior_attempts`.

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-frontend-engineer
  name: Frontend Engineer
  version: 1.0.0
spec:
  description: >
    Autonomous frontend coding agent for aurora-books: React screens
    and components in TypeScript, implemented from approved Stories and
    prototypes, with unit tests and screenshot evidence.
  type: agent
  capabilities:
    - code.typescript
    - ui.react
    - ui.css
    - ui.accessibility
    - test.unit
  constraints:
    allowedArtifactTypes: [changeset, report, image]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, specification, constitution, knowledge, prior_attempts]
    maxContextItems: 40
  evaluationHooks:
    - name: lint-and-unit
      description: eslint + tsc --noEmit + vitest unit suite over the changeset.
      mode: blocking
    - name: visual-smoke
      description: Render key states and diff against the approved prototype.
      mode: advisory
```
