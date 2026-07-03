*Part of the [Reference Architecture v1](../README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../../README.md).*

# Kubernetes Runtime

RA v1 runs the [session fleet](claude-code-sessions.md) on Kubernetes:
a small control plane that reconciles against the
[spec repo](../repositories/specification-repo.md), and disposable
Jobs that each execute one task. Kubernetes was chosen for exactly the
properties PP-0010 demands from a runtime: declarative reconciliation,
lease-friendly Job semantics (`activeDeadlineSeconds`), workload
identity, and cattle-not-pets pod lifecycles.

## Namespace layout

| Namespace | Contains | Notes |
| --- | --- | --- |
| `pp-system` | Scheduler, MCP gateway, telemetry ingest, sync workers (Linear, vault, index refresh) | Long-running Deployments; NetworkPolicy allows egress to GitHub, Linear, evidence store |
| `pp-sessions` | Session Jobs only | No long-running workloads; default-deny network except MCP gateway + Git hosts; ResourceQuota bounds the fleet |

One cluster can host many products; sessions are labeled
`pp.dev/product`, `pp.dev/task`, `pp.dev/role`, `pp.dev/pool` for
selection, quota, and observability.

## Scheduler

The scheduler is a reconciliation loop whose desired state is the Task
Graph and whose actual state is the set of running Jobs. It holds no
state of its own — restart it anywhere, it re-derives everything
([failure philosophy](README.md#failure-philosophy)).

- **Inputs:** a poll of the spec repo (default every 30s) *and* GitHub
  webhooks fanned in from spec-repo pushes
  ([github-integration.md](github-integration.md#webhook-fan-in)) —
  webhooks for latency, polling for truth.
- **Reconcile step:** for each `ready` Task, in `priority_fifo` order
  (PP-0006 §6.2): match `spec.capabilities` to a pool (exact tag
  coverage, PP-0006 §7); check the pool's ceiling, the per-repo
  concurrency cap, and the Worker's `maxConcurrentTasks`
  (PP-0007 §3.2); spawn a session Job or leave the task queued.
- **Capability → pool mapping** is label-driven: each Worker
  declaration in `.product/workers/` compiles to a pool spec
  (`pp.dev/pool: backend-ts`, capability tag list, resource class
  defaults). A `ready` task no pool covers is surfaced as an Issue
  rather than left silently unclaimable (PP-0006 §7).
- **Priority classes:** Task `spec.priority` maps to pod
  PriorityClasses `pp-critical` > `pp-high` > `pp-medium` > `pp-low`,
  so cluster pressure preempts low-priority sessions first — whose
  leases then expire harmlessly.
- **Lease bookkeeping:** the scheduler is also the lease enforcer: it
  expires claims whose heartbeat lapsed and returns tasks to `ready`
  (PP-0007 §3.3, PP-0010 §5), independent of what the pod is doing.

## Session Jobs

Each granted claim runs as a Job with two containers:

- an **init container** that clones the engineering repo at the pinned
  SHA (sparse where possible) and stages the context bundle;
- the **main container** running Claude Code headless with the role's
  agent definition, talking to the world only through the
  [MCP gateway](mcp-context.md) and Git-over-HTTPS.

Resource classes derive from `spec.constraints.effortBudget`:

| Class | effortBudget | CPU / memory | activeDeadlineSeconds |
| --- | --- | --- | --- |
| S | ≤ PT1H | 1 / 2Gi | lease TTL (1h) |
| M | ≤ PT4H | 2 / 4Gi | lease TTL (4h) |
| L | > PT4H | 4 / 8Gi | lease TTL (8h) |

`activeDeadlineSeconds` is set from the lease TTL: Kubernetes kills
what the lease no longer covers, so a runaway session cannot outlive
its claim.

Illustrative Job sketch (trimmed):

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sess-task-guest-checkout-api-a3
  namespace: pp-sessions
  labels:
    pp.dev/product: aurora-books
    pp.dev/task: task-guest-checkout-api
    pp.dev/role: backend-engineer
    pp.dev/pool: backend-ts
spec:
  backoffLimit: 0                 # retries are scheduler decisions, not kubelet's
  activeDeadlineSeconds: 14400    # = lease TTL (class M)
  ttlSecondsAfterFinished: 300
  template:
    metadata:
      labels: { pp.dev/pool: backend-ts }
    spec:
      priorityClassName: pp-high
      serviceAccountName: pp-worker-backend-engineer   # workload identity
      restartPolicy: Never
      initContainers:
        - name: checkout
          image: ghcr.io/ra/pp-checkout:1
          args: ["--repo=aurora/aurora-checkout-service",
                 "--sha=9fceb02", "--sparse=src/api,src/domain/orders,tests"]
          volumeMounts: [{ name: workspace, mountPath: /workspace }]
      containers:
        - name: session
          image: ghcr.io/ra/pp-claude-session:1   # Claude Code + dotfiles + global CLAUDE.md
          env:
            - { name: PP_TASK_ID, value: task-guest-checkout-api }
            - { name: PP_ROLE, value: backend-engineer }
            - { name: MCP_GATEWAY, value: https://mcp.pp-system.svc }
          resources:
            requests: { cpu: "2", memory: 4Gi }
            limits:   { cpu: "2", memory: 4Gi }
          volumeMounts: [{ name: workspace, mountPath: /workspace }]
      volumes:
        - { name: workspace, emptyDir: {} }       # ephemeral by construction
```

## Autoscaling

Pools scale KEDA-style on **ready-queue depth per pool**: a scaler
polls the scheduler's `pp_ready_tasks{pool=…}` metric and adjusts the
pool ceiling between 0 and its max. Scale-up is aggressive (queue age
also feeds the trigger, so old `medium` tasks still get capacity);
scale-down is passive — ceilings drop, running sessions finish, nothing
is preempted for economy. Cluster-level bounds come from the
`pp-sessions` ResourceQuota and the cost budget per product per day;
when either binds, tasks simply wait in `ready`
([backpressure](claude-code-sessions.md#scaling-and-concurrency)).

## Retries and failure classes

`backoffLimit: 0` — the kubelet never retries; the scheduler decides,
because *why* a session died matters (PP-0006 §8.2):

- **Infra failure** (OOM, node loss, image pull, deadline hit without
  submission): lease expires, task returns to `ready`, attempt counted.
  The scheduler requeues silently with exponential backoff
  (1m, 5m, 15m) while `status.attempts < maxAttempts`; an OOM bumps
  the next attempt one resource class.
- **Work rejection** (Evaluator says no): never auto-requeued by the
  scheduler. Rejection is a planning event — the Planner retries,
  amends, or supersedes per PP-0006 §8.2, with the rejecting
  Evaluations in the next attempt's context.
- **Attempts exhausted:** the scheduler stops; the Planner must
  supersede (the task is never silently abandoned in `rejected`).

## Cancellation

When the Planner needs a claimed task stopped (superseded spec,
priority preemption), the scheduler **revokes the lease** via
`pp-spec`, then SIGTERMs the pod with a 60s grace period. The
session's shutdown handler pushes any committed work, appends its
session report annotation, and exits; on grace expiry SIGKILL follows
and the lease-expiry path cleans up identically. Either way the task
lands in `ready` (or is cancelled by the Planner from there —
`pending|ready → cancelled` only, PP-0006 §5.3).

## Secrets and identity

- **Workload identity per role.** Each role has a ServiceAccount
  (`pp-worker-backend-engineer`, …) bound via OIDC workload identity
  to exactly its external permissions. Pods mount no long-lived
  secrets.
- **Short-lived GitHub tokens.** The MCP gateway mints a GitHub App
  installation token per session, scoped to the repos the task names,
  expiring with the lease
  ([identities](github-integration.md#identities)). The producing
  role's App and the evaluating role's App are distinct installations.
- **No production credentials in worker pods — ever.** Deploys happen
  only in GitHub Actions under environment protection
  (PP-0010 §6.1); the Deployment Manager role requests promotion, it
  does not hold keys. Anthropic API credentials reach sessions as
  short-lived tokens from the gateway, metered per pool.
- NetworkPolicy in `pp-sessions` allows egress only to the MCP
  gateway, Git hosts, and the package registries the repo class needs.

## Observability

- **Traces:** one OTel trace per session, a span per
  [lifecycle stage](claude-code-sessions.md#the-nine-stages) (claim,
  context, checkout, execute, hooks, submit, cleanup), linked to the
  task id — so "where do M-class backend tasks lose time" is a query.
- **Metrics:** `pp_ready_tasks{pool}` (queue depth) and age
  percentiles; claim latency (ready → claimed); attempt success rate
  (submitted → done, per pool and per role); lease expiries;
  rebase-retry rate; token and dollar cost per task attempt. Cost and
  velocity roll up into the spec repo's generated
  `reports/velocity.md`.
- **Transcripts:** full session transcripts and tool-call audit logs
  stream to the evidence store by digest; Evaluations and audits cite
  them ([evaluation](../evaluation.md)). Nothing observability-grade
  stays on the pod.
- **Alerts** page humans on: queue age past deadline thresholds
  (PP-0006 §6.3 raises the Issue; the alert raises the human), lease
  expiry spikes, attempt-success collapse in a pool, and cost budget
  burn.
