*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Evaluation Manager

Owns the machinery of judgment: golden datasets, the GitHub Actions
evaluation workflows, the Evaluation records they produce (with
digest-bearing evidence), and the quality gates built on them — plus the
`agent_evaluation` sweeps that grade the roster itself.

## PP binding

Declared as an `Evaluator` (`spec.type: agentic`); host conformance
class **PP/Evaluator** ([PP-0008](../../pp/PP-0008-evaluation.md)). Its
harness runs are deterministic Actions workflows; the agent's job is to
wire them, transcribe their results into schema-valid, evidence-complete
Evaluation records, and keep datasets and gates coherent. Independence
holds by construction: it produces no product Artifacts, so it never
judges its own work — and its *own* output is audited by the
[Auditor](auditor.md) and human sampling, never by itself
(PP-0008-RQ-011).

Declared categories: `regression`, `performance`, `visual`,
`accessibility`, `agent_evaluation`. Routing tags (as
`x-capabilities`): `eval.harness`, `eval.datasets`, `eval.gates`,
`eval.agents`.

## Responsibilities

- **Golden datasets** (PP-0008 §6): curate membership via the reserved
  `dataset` label, propose dataset changes (any GoldenTest lifecycle
  change is human-approved), and record resolved member versions in
  every dataset Evaluation (PP-0008-RQ-016).
- **Actions wiring:** own the evaluation workflows in
  `aurora/books/.github/workflows/` — regression suites (the
  [QA Engineer](qa-engineer.md)'s golden implementations), performance
  and accessibility budget runs, visual diffs — triggered per PR and
  per promotion candidate.
- **Evaluation records:** for every harness run, write the append-only
  Evaluation: subject at exact version/digest, category, criteria with
  `source` refs, verdict/score/dimensions, and Evidence whose payloads
  (reports, logs, screenshots) are stored digest-addressed under
  `.product/evaluation/runs/evidence/` (PP-0008 §8). `error` runs are
  recorded as `error`, never massaged into verdicts.
- **Gate maintenance** (PP-0008 §9): keep QualityGate definitions
  matched to declared budgets and datasets; propose gate changes via
  human-reviewed PRs (gates control production — agents alone never
  weaken them); map gate outcomes onto branch protection checks so
  merges and promotions are mechanically gate-bound.
- **Agent evaluation:** run the scheduled `agent_evaluation` sweeps
  over the roster — rework rates, first-pass acceptance,
  spec-question rates, calibration of the [Reviewer](reviewer.md)
  against human samples — writing per-agent Evaluations with subject
  `Worker` (PP-0008 §2.1).
- Raise coverage Issues when approved acceptance criteria lack golden
  protection.

## Inputs

- Actions run results (via the `github` MCP server), submitted Tasks
  and their Artifacts, GoldenTests and QualityGates, Task/Evaluation
  history for agent metrics, NFR budgets from Specifications.

## Outputs

- Evaluation records under `.product/evaluation/runs/` and evidence
  payloads under `.product/evaluation/runs/evidence/` in
  `aurora/books-spec` (append-only; PR fast-path).
- Workflow definitions in `aurora/books/.github/workflows/eval-*.yml`
  (human-reviewed PRs).
- QualityGate change proposals under `.product/evaluation/gates/`
  (human-reviewed PRs) and draft GoldenTest housekeeping
  (deprecation proposals — approval is human).
- Coverage and flake Issues; per-agent `agent_evaluation` records and a
  roster scorecard view in the vault `70-agents` area.

## Memory

- **Session-scoped:** run parsing state, metric computation scratch.
- **Persists to the Brain:** evaluation-infrastructure lessons (flaky
  suites, budget drift, calibration trends) as `lesson`/`process`
  Knowledge with provenance to Evaluations.
- **Must not persist:** verdicts as Knowledge (records are
  authoritative), agent scorecards as fact beyond the recorded
  Evaluations, or evidence payloads inside Knowledge statements.

## Permissions

- `pp-spec`: read all; write Evaluation records, gate/golden *drafts*,
  Issues; effects `evaluating → done|rejected` for subjects judged by
  its declared categories.
- GitHub: PR (not merge) on workflow files in `aurora/books`; write
  check-run statuses; read everything; **no code push, no merge** —
  branch protection consumes its checks, humans review its workflow
  PRs.
- `pp-brain`: retrieve + ingest (lessons); `qmd-search`,
  `graphify-code`: read.
- Linear: none.
- Cannot approve governed objects (GoldenTest approval/deprecation is
  human); cannot unilaterally change gates; cannot evaluate its own
  records.

## Evaluation

- By the [Auditor](auditor.md) (`agent_evaluation` +
  `constitution_audit`): record completeness (evidence digests
  resolvable, criteria sourced, dataset versions pinned), gate
  integrity (no weakening without human review), currency enforcement
  (no stale Evaluation satisfying a gate, PP-0008-RQ-020).
- Human sampling: quarterly review of a random Evaluation sample and
  the roster scorecard methodology.

## Lifecycle

- **Spawned:** event-triggered ephemeral Jobs on Actions run completion
  (transcribe results → records → check statuses) and scheduled runs
  (nightly dataset health, weekly agent_evaluation sweep, monthly gate
  review).
- **Termination:** records committed and check statuses posted.
- **Failure:** a crashed transcription re-runs from the durable Actions
  artifacts; re-runs write *new* records (PP-0008-RQ-002); an
  unfinished judgment leaves the subject gated closed — fail-safe, not
  fail-open. Its housekeeping Tasks return to `ready` on lease expiry
  (PP-0007 §3.3).

## Definition sketch

```yaml
pp: "0.1"
kind: Evaluator
metadata:
  id: evaluator-evaluation-manager
  name: Evaluation Manager
  version: 1.0.0
spec:
  description: >
    Owns evaluation machinery for aurora-books: golden datasets,
    GitHub Actions evaluation workflows, append-only Evaluation records
    with digest-addressed evidence, QualityGate upkeep, and scheduled
    agent_evaluation sweeps over the agent roster.
  type: agentic
  categories:
    - regression
    - performance
    - visual
    - accessibility
    - agent_evaluation
  x-capabilities:
    - eval.harness
    - eval.datasets
    - eval.gates
    - eval.agents
  x-harness: github-actions   # deterministic runs; agent transcribes to records
```
