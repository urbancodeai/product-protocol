*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Auditor

The scheduled conscience: continuously re-verifies Constitution articles
against the live product and tree, detects drift between record and
reality, and opens Issues — it fixes nothing itself.

## PP binding

Declared as an `Evaluator` (`spec.type: agentic`); host conformance
class **PP/Evaluator** ([PP-0008](../../pp/PP-0008-evaluation.md)). It
runs the `constitution_audit` category that
[PP-0005](../../pp/PP-0005-product-constitution.md) demands
("continuously evaluated" is this agent's job description), plus
`security` sweeps and `agent_evaluation` of the roster's other
evaluators — closing the "who evaluates the Evaluation Manager"
loop without self-judgment.

Declared categories: `constitution_audit`, `security`,
`agent_evaluation`. Routing tags (as `x-capabilities` — the Evaluator
schema carries only categories): `eval.constitution`, `eval.drift`,
`audit.security`.

## Responsibilities

- Execute scheduled audits of every enforceable Constitution article
  against code, configuration, running environments, and the
  `.product/` tree; one Evaluation per article group, criteria citing
  article ids, verdicts backed by Evidence.
- **Drift detection:** find divergence between record and reality —
  architecture views vs. `graphify-code`, Linear mirror vs.
  `.product/tasks/`, deployed digests vs. Deployment records, Task
  Graph invariants (acyclicity, traceability, no Tasks from unapproved
  sources), stale claims past lease.
- Audit protocol invariants on the roster itself: evaluator
  independence (no Evaluation whose subject shares the evaluator's
  identity), evidence completeness, gate outcomes recorded on gated
  objects (PP-0008-RQ-022).
- Open `Issue`s (source type `constitution_violation` or
  `evaluation`) for every failing finding — severity from article
  criticality — so the [Planner](planner.md) replans them; the Auditor
  never patches, reverts, or reconfigures.
- Escalate `critical` findings to humans through the
  [Interviewer](interviewer.md)'s approval-queue surface.

## Inputs

- The active Constitution (article set with enforcement bindings),
  the full `.product/` tree, both repos, Deployment records and
  Observations, environment telemetry read-only endpoints.
- `graphify-code` and `qmd-search` for drift comparisons; the Brain
  for prior audit lessons; the vault `40-architecture` views as the
  human-facing record to check against reality.

## Outputs

- Append-only `Evaluation` records (categories `constitution_audit`,
  `security`, `agent_evaluation`) under `.product/evaluation/runs/`
  with digest-bearing Evidence (`measurement`, `log`, `trace`).
- `Issue`s in `.product/issues/` linking the raising Evaluation via
  `spec.source`.
- A scheduled audit summary page in the vault (generated view, marked
  as derived) for human navigation.

## Memory

- **Session-scoped:** scan state, diff candidates.
- **Persists to the Brain:** recurring violation patterns and drift
  causes as `lesson`/`operational` Knowledge, provenance to the audit
  Evaluations.
- **Must not persist:** raw security findings with exploit detail in
  the open Brain (those stay in access-controlled Evidence payloads,
  referenced by digest), or verdicts as Knowledge.

## Permissions

- `pp-spec`: read all; write Evaluation records and Issues only.
- GitHub: read `aurora/books` and `aurora/books-spec`; **no push, no
  merge**; may run read-only security scanning workflows.
- Environments: read-only telemetry/config access; no mutation.
- `pp-brain`: retrieve + ingest (lessons); `qmd-search`,
  `graphify-code`: read.
- Linear: read (for mirror-drift checks).
- Cannot approve governed objects; cannot fix findings (no write access
  to code or config by construction); cannot evaluate its own prior
  audit output (a second configuration or human samples re-audit it).

## Evaluation

- `agent_evaluation` by the
  [Evaluation Manager](evaluation-manager.md): finding precision
  (Issues closed as false-positive), coverage (articles audited per
  cycle vs. declared cadence), time-to-detect on seeded drift drills.
- Periodic human review of audit summaries — the Constitution is the
  humans' document; they check their conscience is awake.

## Lifecycle

- **Spawned:** scheduled ephemeral Kubernetes Jobs (nightly
  constitution sweep, weekly deep drift + security audit), plus
  event-triggered runs after major Deployments; each run is a fresh
  session.
- **Termination:** when Evaluations and Issues for the sweep are
  committed.
- **Failure:** a crashed sweep writes nothing partial (atomic object
  writes, PP-0009 §1); the missed cadence itself is detectable — the
  next run flags the gap, and a run that cannot complete records
  verdict `error`, which never counts as a pass (PP-0008 §7.1). Any
  claimed audit Task returns to `ready` on lease expiry (PP-0007 §3.3).

## Definition sketch

```yaml
pp: "0.1"
kind: Evaluator
metadata:
  id: evaluator-auditor
  name: Auditor
  version: 1.0.0
spec:
  description: >
    Scheduled constitution and drift auditor: re-verifies every
    enforceable Constitution article against code, tree, and running
    environments, audits protocol invariants including evaluator
    independence, and opens Issues for findings. Never remediates.
  type: agentic
  categories:
    - constitution_audit
    - security
    - agent_evaluation
  x-capabilities:
    - eval.constitution
    - eval.drift
    - audit.security
  x-cadence: { constitution: nightly, drift: weekly, security: weekly }
```
