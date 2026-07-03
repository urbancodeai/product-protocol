# RA v1 — Roadmap

*Part of the [Reference Architecture v1](./README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../README.md).*

RA v1 describes a complete loop; this page lists what the reference
architecture does not yet describe well, in rough priority order. Items
here are RA future work — protocol-level futures live in the PP
documents' own Future Work sections and the repo
[ROADMAP](../ROADMAP.md).

## Planned work

1. **Conformance self-test harness.** A runnable suite that exercises an
   RA deployment against the normative requirements it claims —
   atomic-claim races, lease expiry, gate currency, approval-signature
   enforcement, append-only checks — and emits a conformance report per
   class ([terminology §4](../reference/terminology.md#4-conformance-classes)).
2. **Multi-product portfolios.** Several product spec repos sharing one
   vault and one agent fleet: cross-product knowledge boundaries,
   per-product MCP scoping, portfolio-level reports, and shared
   constitution articles without violating one-Product ownership
   ([PP-0003 §1.2](../pp/PP-0003-product-brain.md)).
3. **Human-latency SLOs on approval queues.** The approval queue is the
   loop's slowest stage. Define queue-age telemetry, reminder and
   escalation policy, and standing-approval patterns that stay within
   "silence is not approval" ([PP-0010 §7](../pp/PP-0010-runtime.md)).
4. **Cost governance.** Token and compute budgeting per Task
   (`x-` cost fields on Task/Artifact), per-Worker burn-rate metrics
   beside rework rate, budget-aware scheduling, and cost lines in the
   weekly quality report.
5. **Richer agent-evaluation loops.** Close the `agent_evaluation` loop
   ([evaluation.md §6](./evaluation.md)): calibrate the Reviewer against
   human-spot-checked samples, score Planner decomposition quality by
   downstream rework, and feed results into capability-tag assignment
   and context-recipe tuning by the Librarian.
6. **GitHub coupling reduction.** GitHub is the accepted single point of
   coupling ([architecture.md §5](./architecture.md)); document a mirror
   strategy (secondary Git remote + queued object writes) for degraded
   operation.
7. **Signed everything.** Extend human-signature verification to agent
   bot commits (workload identity), and evidence-digest countersigning
   by the Evaluation Manager, anticipating protocol-level signing.

## The swap table

Every component below can be replaced without leaving conformance, as
long as the replacement honors the listed PP contract. This is the test
of the architecture, not a concession.

| RA v1 choice | Known-good alternates | Contract the replacement honors |
| --- | --- | --- |
| Linear (task mirror) | Jira, GitHub Projects, none at all | Mirror-only: reads Task objects, writes only annotations; never source of truth |
| Obsidian (vault) | Any git-backed markdown (Logseq, plain tree + static site) | Prose in, PP-0009 ingestion out; views derived from Brain objects |
| Kubernetes (scheduler substrate) | Nomad, ECS, a cron loop on one machine | Atomic claims, finite leases, expiry → `ready` ([PP-0007 §3](../pp/PP-0007-worker-protocol.md)) |
| Claude Code (workers) | Any agent honoring the worker contract | Claim/context/submit obligations, Artifacts + self-assessment ([PP-0007](../pp/PP-0007-worker-protocol.md)) |
| GitHub + Actions | GitLab + CI, Gitea + external CI | Git binding ([PP-0002 §7](../pp/PP-0002-core-concepts.md)), human-signed approvals, required-check gate wiring |
| Playwright / pytest / LLM evals | Any harness producing durable evidence | Evaluation records with locatable, digest-verifiable Evidence ([PP-0008 §8](../pp/PP-0008-evaluation.md)) |
| Graphiti-style graph, qmd, Graphify | Any retrieval index | Derived and rebuildable; bounded, provenance-preserving retrieval ([PP-0009 §3](../pp/PP-0009-knowledge-protocol.md)) |

If a swap forces a change to any `.product/` object format — rather than
to tooling around it — that is a bug in the swap, or a gap in the
protocol worth filing upstream.
