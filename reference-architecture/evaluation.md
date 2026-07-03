# RA v1 — Evaluation Stack

*Part of the [Reference Architecture v1](./README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../README.md).*

This document describes how RA v1 implements
[PP-0008](../pp/PP-0008-evaluation.md): which tool renders which
category of judgment, how golden datasets run, how Evaluation records
and evidence land in the spec repo, how QualityGates become GitHub
required checks and environment protection rules, and how scores feed
back into planning.

The operating principle is PP-0008's: *an Evaluation without evidence is
an opinion.* Every verdict in RA v1 is backed by a digest-referenced
payload a human or auditor can open.

## 1. Category-to-tool mapping

| PP-0008 §3 category | RA v1 tool | Evidence produced |
| --- | --- | --- |
| `acceptance` | pytest (API/unit acceptance) + Playwright (UI acceptance) against the Task's completion criteria | `test_report` (JUnit/JSON), `log` |
| `regression` | pytest suites + golden datasets re-run per candidate | `test_report`, `log` |
| `visual` | Playwright screenshot comparison against Story prototypes (`prototypes/`) | `screenshot`, `diff`, `trace` |
| `business_validation` | LLM evaluation with a rubric derived from the Story's intent and the Specification ("does this achieve the goal, not merely its letter?") | `transcript`, `measurement` (rubric scores) |
| `performance` | Budget checks in CI (k6/Lighthouse for aurora-books) against Specification budgets ([PP-0008 §10](../pp/PP-0008-evaluation.md)) | `measurement`, `log` |
| `security` | Dependency + secret scanning, agentic security review on sensitive paths | `test_report`, `log` |
| `accessibility` | Playwright + axe-core against constitution `accessibility` articles | `test_report`, `screenshot` |
| `constitution_audit` | The [Auditor](./agents/auditor.md): scheduled sweeps, one Evaluation per article batch ([PP-0005 §5](../pp/PP-0005-product-constitution.md)) | `transcript`, `measurement`, `log` |
| `agent_evaluation` | LLM review of worker transcripts + computed rework metrics (rejection rate, attempts-to-done, lease expiries per Worker) | `transcript`, `measurement` |

One Evaluator may serve several categories and one gate may select
across them — the table maps defaults, not silos. The two agentic
evaluators are the [Reviewer](./agents/reviewer.md) (per-submission code
and design judgment, `acceptance`/`business_validation`) and the
[Auditor](./agents/auditor.md) (`constitution_audit`); the
[Evaluation Manager](./agents/evaluation-manager.md) operates the
automated harnesses and owns all write-back.

## 2. Golden datasets in CI

GoldenTests are governed objects in `.product/evaluation/golden/`;
datasets are the reserved `dataset` label
([PP-0008 §6.2](../pp/PP-0008-evaluation.md)). RA v1 binds each dataset
to a **named GitHub Actions workflow**:

| Dataset (label) | Workflow | Harness |
| --- | --- | --- |
| `checkout-core` | `.github/workflows/golden-checkout-core.yml` | Playwright (UI scenarios) + pytest (API scenarios) |
| `recs-quality` | `.github/workflows/golden-recs-quality.yml` | pytest + LLM rubric on recommendation output |
| `constitution-sweep` | `.github/workflows/golden-constitution-sweep.yml` | Auditor session (scheduled) |

Workflow behavior:

- The workflow resolves the dataset at run time from the spec repo:
  all GoldenTests with `metadata.labels.dataset: <name>` and
  `lifecycle: approved`, highest approved version per id. The resolved
  `(id, version)` list is recorded in the Evaluation's criteria and in
  the run log, satisfying the dataset-versioning rule
  ([PP-0008 §6.3](../pp/PP-0008-evaluation.md)).
- `method: automated` scenarios map to committed test code annotated
  with the GoldenTest id; a CI check fails if an approved automated
  GoldenTest has no bound test (coverage guard).
- `method: agentic` scenarios launch an evaluator Claude Code session
  that executes the steps (e.g. via Playwright MCP) and judges
  `expected` within `tolerance`, attaching its transcript.
- `method: manual` scenarios page a human and block until judged —
  rare by design.
- Triggers: every worker PR (datasets selected by the Task's completion
  contract), every deployment candidate (all datasets a
  `deployment_promotion` gate selects), and nightly (full sweep).

Because GoldenTests are governed, an agent that wants a test weakened
can only propose a new version into the human approval queue — "make
the test pass by changing the test" requires a human signature.

## 3. Writing Evaluations back to the spec repo

Only the Evaluation Manager's identity (`pp-eval[bot]`) can write
`.product/evaluation/runs/` ([architecture.md §2](./architecture.md)).
After each harness run it:

1. Collects harness outputs (JUnit XML, Playwright traces and
   screenshots, LLM transcripts, measurements).
2. Uploads payloads to the **CI artifact store**, content-addressed;
   records `sha256` digests. Nothing bulky enters the Git tree.
3. Writes one `Evaluation` object per subject × category, with
   `criteria[].source` refs to the GoldenTests / Task / Constitution
   articles judged, a verdict, optional score and dimensions, and one
   evidence entry per payload (`uri` + `digest`, or `path` for small
   in-tree reports).
4. Commits to the spec repo. The append-only CI check guarantees no
   Evaluation is ever edited after the fact.

Evaluations reference their subject at the exact version/digest being
judged, so gate currency ([PP-0008 §9.2](../pp/PP-0008-evaluation.md))
falls out naturally: a new commit on the PR branch produces a new
Artifact digest, staling every prior Evaluation.

## 4. Worked example: `golden-checkout-happy-path`

The scenario is
[`examples/ecommerce/.product/evaluation/golden/golden-checkout-happy-path.yaml`](../examples/ecommerce/.product/evaluation/golden/golden-checkout-happy-path.yaml)
(dataset `checkout-core`). A release candidate for guest checkout
triggers `golden-checkout-core.yml`; Playwright drives the scenario
against a staging preview, and the Evaluation Manager writes:

```yaml
# .product/evaluation/runs/eval-run-2026-07-03-golden-checkout.yaml
pp: "0.1"
kind: Evaluation
metadata:
  id: eval-run-2026-07-03-golden-checkout
  name: Golden — guest checkout happy path (release candidate 1.4.0)
  version: 1.0.0
  createdAt: 2026-07-03T14:22:00Z
  annotations:
    github.com/workflow-run: "https://github.com/aurora/books-spec/actions/runs/9174523311"
spec:
  subject:
    ref: { kind: Artifact, id: artifact-checkout-release-1-4-0, version: "1.0.0" }
  category: regression
  criteria:
    - source:
        ref: { kind: GoldenTest, id: golden-checkout-happy-path, version: "1.0.0" }
      description: >
        Guest completes checkout without an account: order placed,
        confirmation page with order number, confirmation email queued,
        no account record created (dataset checkout-core, resolved
        2026-07-03T14:20:11Z).
  verdict: pass
  score: 1.0
  dimensions:
    - { name: functional, score: 1.0, weight: 0.8 }
    - { name: visual_stability, score: 1.0, weight: 0.2 }
  evidence:
    - type: trace
      description: Playwright trace of the full checkout flow.
      uri: "https://artifacts.ci.example.com/aurora-books/9174523311/checkout-happy-path.trace.zip"
      digest: sha256:4c8e21aa90bd3f17c6d2e5a8b1f09374d5e6c7a8b9012f3a4b5c6d7e8f901234
    - type: screenshot
      description: Confirmation page showing the order number.
      uri: "https://artifacts.ci.example.com/aurora-books/9174523311/confirmation.png"
      digest: sha256:9f1b2c3d4e5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e
    - type: test_report
      description: Playwright JSON report incl. no-account-record assertion.
      path: evaluation/runs/evidence/eval-run-2026-07-03-golden-checkout/report.json
      digest: sha256:0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9
  evaluator:
    ref: { kind: Evaluator, id: eval-playwright-golden }
  evaluatedAt: 2026-07-03T14:21:47Z
  notes: >
    Copy variance on the confirmation page is within the golden test's
    declared tolerance; order-number format and account-record absence
    verified exactly.
```

This validates against
[`schemas/evaluation/evaluation.schema.json`](../schemas/evaluation/evaluation.schema.json):
required `subject`, `category` (enum), non-empty `criteria` with
`description`, `verdict` (enum), non-empty `evidence` where every item
has a `type` and at least one of `uri`/`path`/`digest`/`artifact`, plus
`evaluator` and `evaluatedAt`.

## 5. Quality gates → GitHub enforcement

QualityGates live in `.product/evaluation/gates/`. RA v1 wires them in
two layers:

- **Task acceptance** (`trigger: task_acceptance`): each blocking gate
  maps to a **required status check** on the worker PR. The Evaluation
  Manager evaluates the gate predicate over current Evaluations
  ([PP-0008 §9.2](../pp/PP-0008-evaluation.md)) and reports
  `gate/<gate-id>` pass/fail. All blocking gates green → the PR can
  merge → merge is `evaluating → done`.
- **Deployment promotion** (`trigger: deployment_promotion`): each
  blocking gate maps to a **GitHub environment protection rule** on
  `staging`/`production` (e.g.
  [`gate-production-promotion`](../examples/ecommerce/.product/evaluation/gates/gate-production-promotion.yaml)
  requires the full `checkout-core` dataset passing plus a
  constitution deployment sweep). The Deployment Manager records the
  gate-check Evaluations in `Deployment.status.evaluations`
  ([PP-0010 §6.1](../pp/PP-0010-runtime.md)).
- `advisory` gates report a neutral check with an annotated summary —
  visible, recorded, never blocking.
- `error` and `inconclusive` verdicts never satisfy a requirement; the
  check stays red and the Evaluation Manager schedules a re-run.

Gate definitions are declarations, not governed objects, but the gate
files sit under CODEOWNERS so changing what protects production always
crosses a human review.

## 6. Quality scores, Issues, and replanning

Verdicts gate; scores steer.

- **Dimensions and weights.** RA v1 standardizes dimension names per
  category (e.g. `correctness`, `maintainability` for acceptance;
  `functional`, `visual_stability` for golden UI runs; `groundedness`,
  `intent_fit` for business validation) so trends are comparable across
  time and workers ([PP-0008 §7.3](../pp/PP-0008-evaluation.md)).
- **Thresholds.** Gates carry `minScore` where a bare pass is too weak —
  e.g. business validation requires `score ≥ 0.8` even on a `pass`.
- **Trend feeds.** The Evaluation Manager aggregates scores weekly into
  `reports/quality/`: per-Story quality, per-Worker `agent_evaluation`
  trends (rework rate, attempts-to-done), and per-dimension drift.
- **Issues.** Sustained degradation (dimension below threshold across N
  runs, rework rate above budget, repeated `error` verdicts from one
  Evaluator) raises an `Issue` in `.product/issues/`. Triaged Issues
  enter the Planner's replanning triggers
  ([PP-0006 §8](../pp/PP-0006-task-graph.md)) — quality data literally
  becomes new Tasks.
- **Lessons.** Every rejection with a repeated cause becomes a `lesson`
  Knowledge object via the Knowledge Curator, which the Librarian then
  serves into future worker contexts — the cheapest rework prevention.

## 7. Evidence retention

- Evidence referenced by an Evaluation that **gated a merge or a
  promotion** is retained as long as the gated object is retained —
  in practice, indefinitely: the artifact store bucket for gate-check
  runs is immutable and lifecycle-exempt ([PP-0008 §8](../pp/PP-0008-evaluation.md)).
- Evidence from non-gating runs (nightly sweeps that passed, advisory
  checks) expires after 180 days; the Evaluation record and digests
  remain in Git forever, so a purged payload is detectable as purged
  rather than silently missing.
- Small textual evidence (JSON reports under ~100 KB) is committed
  in-tree under `evaluation/runs/evidence/` for zero-dependency audit.
- Transcripts of agentic evaluators are always retained with the
  gating class — they are the primary audit trail for judgment calls.

Deep dives: [agents/evaluation-manager.md](./agents/evaluation-manager.md),
[agents/reviewer.md](./agents/reviewer.md),
[agents/auditor.md](./agents/auditor.md),
[runtime/github-integration.md](./runtime/github-integration.md).
