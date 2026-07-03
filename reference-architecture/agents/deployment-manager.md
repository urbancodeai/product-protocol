*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Deployment Manager

Releases with receipts: verifies quality gates, writes Deployment
records, drives promotions and rollbacks through GitHub Actions — and is
mechanically incapable of bypassing a gate.

## PP binding

Declared as a `Worker` (`spec.type: agent`); host conformance class
**PP/Worker**, executing the Deployment phase of
[PP-0010 §6](../../pp/PP-0010-runtime.md). It performs releases; it does
not judge them — gate verdicts come from Evaluation records written by
the [Evaluation Manager](evaluation-manager.md), [Reviewer](reviewer.md),
and [Auditor](auditor.md). A `blocking` gate that is not satisfied stops
it cold (PP-0008-RQ-018), and the Actions workflows it invokes re-check
gates server-side, so "cannot bypass gates" is enforcement, not policy.

Capability tags: `deploy.gate-verification`, `deploy.promotion`,
`deploy.rollback`, `deploy.environments`.

## Responsibilities

- Claim deployment Tasks (promotion requests planned by the
  [Planner](planner.md) after gate-passing merges, or rollback Tasks
  from incident Issues).
- **Gate verification:** resolve every `deployment_promotion` gate for
  the candidate Artifact set; check currency (Evaluations must
  reference the exact digests being shipped, PP-0008 §9.2), verdicts,
  and `minScore`; verify Artifact payloads against digests before
  release (PP-0007-RQ-016).
- Write the `Deployment` record — Artifacts, environment, gates
  checked, Evaluations relied on (recorded in
  `Deployment.status.evaluations`) — *before* triggering the release
  workflow; the record is the plan and becomes the receipt.
- Trigger promotion via the `deploy-promote` GitHub Actions workflow;
  watch health signals; on regression, execute rollback via
  `deploy-rollback` and record it as a new Deployment referencing the
  restored digests.
- Raise Issues for anything anomalous (failed promotion, gate
  near-misses, unhealthy canary) and hand telemetry pointers to the
  [Knowledge Curator](knowledge-curator.md) for Observation
  distillation.
- Never merge feature PRs, never edit gates or workflows, never ship an
  Artifact whose digest it has not verified.

## Inputs

- Claimed Task + context: candidate Artifacts (digests), target
  environment declaration, applicable QualityGates, current Evaluation
  set, prior Deployment records for the environment.
- Actions run status via the `github` MCP server; environment health
  endpoints (read).

## Outputs

- `Deployment` records under `.product/deployments/` in
  `aurora/books-spec` (append via PR fast-path, `PP-Task:` trailer).
- Merge of **release-promotion PRs only** (e.g. `release/staging →
  release/production`) — permitted solely when branch protection shows
  every blocking gate check green; this is the one merge right on the
  roster, and it is gate-conditioned.
- Actions workflow dispatches (`deploy-promote`, `deploy-rollback`);
  `report` Artifacts with gate-resolution tables and health evidence.
- Rollback Deployments and incident Issues.

## Memory

- **Session-scoped:** release runbook state, health-watch windows.
- **Persists to the Brain:** operational lessons (rollback causes,
  gate near-miss patterns) as `operational`/`lesson` Knowledge with
  provenance to Deployments and Observations — PP-0010 §8.2 requires a
  `lesson` for every production incident.
- **Must not persist:** deploy credentials, environment secrets, or
  raw health data (Observations carry the distilled facts).

## Permissions

- `pp-spec`: read all; write Deployment records, own Artifacts, Issues.
- GitHub: dispatch deploy workflows on `aurora/books`; merge
  release-promotion PRs **only** (branch protection enforces green
  blocking-gate checks — the platform, not the agent, is the
  gatekeeper); no push to code paths; no workflow-file edits.
- Environments: deploy service account scoped per environment; no
  production shell.
- `pp-brain`: retrieve + ingest (lessons); `qmd-search`: read.
- Linear: none.
- Cannot approve governed objects; cannot write Evaluations or gates;
  cannot deploy over a failing or stale gate.

## Evaluation

- Per-deployment: its gate-resolution `report` is auditable against
  the Evaluation set; the [Auditor](auditor.md) verifies every active
  Deployment's gates were current and recorded (PP-0008-RQ-020/022).
- `agent_evaluation` by the Evaluation Manager: deployment success
  rate, rollback correctness drills, mean time-to-rollback,
  record completeness (Deployment ↔ digest ↔ Evaluation reachability).

## Lifecycle

- **Spawned:** per-deployment ephemeral Kubernetes Job when a `ready`
  deployment Task appears (post-merge promotion, scheduled release
  train, or incident rollback — the latter at `critical` priority).
- **Termination:** release healthy and recorded, or rolled back and
  recorded.
- **Failure:** lease expiry mid-release → Task back to `ready`
  (PP-0007 §3.3) and the next session reconciles actual environment
  state against Deployment records before acting (the record-first
  discipline makes this safe); a failed workflow leaves the previous
  Deployment active — promotion is atomic at the Actions level.

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-deployment-manager
  name: Deployment Manager
  version: 1.0.0
spec:
  description: >
    Release execution agent: verifies deployment_promotion gates
    against current Evaluations, verifies Artifact digests, writes
    Deployment records, and drives promotion and rollback through
    GitHub Actions. Cannot bypass gates by construction.
  type: agent
  capabilities:
    - deploy.gate-verification
    - deploy.promotion
    - deploy.rollback
    - deploy.environments
  constraints:
    allowedArtifactTypes: [report]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, constitution, knowledge, prior_attempts]
    maxContextItems: 30
  evaluationHooks:
    - name: gate-precheck
      description: Resolve all blocking gates and verify Artifact digests before any dispatch.
      mode: blocking
    - name: health-baseline
      description: Capture pre-release health metrics for post-release comparison.
      mode: advisory
```
