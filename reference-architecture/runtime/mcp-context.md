*Part of the [Reference Architecture v1](../README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../../README.md).*

# MCP and Context

Every [Claude Code session](claude-code-sessions.md) touches the world
through MCP servers behind a single gateway. This is where RA v1 turns
the protocol's actor boundaries into tool permissions: a session
cannot violate PP-0007 §5.2 with a tool it does not have.

## Server catalog

| Server | Purpose | Key tools |
| --- | --- | --- |
| `pp-spec` | PP object CRUD + task protocol against the [spec repo](../repositories/specification-repo.md); the only write path into `.product/` | `get_object`, `put_object` (draft/proposal + record kinds only), `list_objects`, `list_ready_tasks`, `claim_task`, `renew_lease`, `release_claim`, `block_task`, `submit_task`, `record_artifact`, `record_evaluation`, `open_issue`, `annotate`, `validate_tree` |
| `pp-brain` | PP-0009 knowledge operations over the Product Brain | `ingest` (propose, with provenance), `retrieve` (bounded, PP-0009 §3), `link`, `validate`, `promote_confidence`, `assemble_context` |
| `qmd-search` | Semantic search over code, docs, vault | `search`, `get_document`, `refresh_index` |
| `graphify-code` | Code graph over engineering repos | `symbol_lookup`, `dependency_graph`, `impact_of`, `owners_of`, `refresh_graph` |
| `linear-mirror` | Read-mostly view of the [Linear projection](linear-integration.md) | `get_issue`, `list_comments`, `post_comment` (sync worker owns all state writes) |
| `github` | Scoped subset of GitHub operations | `open_pr`, `get_pr`, `list_checks`, `get_check_logs`, `comment`, `request_review`, `dispatch_workflow` |

`pp-spec` is where protocol rules live as code: `put_object` rejects
edits to `approved` versions and append-only records (PP-0002 §6),
refuses lifecycle transitions to `approved` from any caller,
`claim_task` enforces atomicity, capability coverage, and
`maxConcurrentTasks` (PP-0007 §3), and `submit_task` rejects
artifact-less submissions (PP-0007 §7). The gateway's per-role policy
below narrows further.

## Role × server permission matrix

R = read/query, W = write/act, — = no access. The thirteen roles are
the [agent roster](../agents/README.md).

| Role | pp-spec | pp-brain | qmd-search | graphify-code | linear-mirror | github |
| --- | --- | --- | --- | --- | --- | --- |
| Interviewer | R + `open_issue`, `annotate` | R/W (`ingest`) | R | — | R/W (comments) | — |
| Product Writer | R + `put_object` (drafts/proposals) | R/W (`ingest`) | R | R | — | W (proposal PRs, spec repo) |
| Architect | R + `put_object` (drafts, workers) | R/W | R | R | — | W (proposal PRs) |
| Planner | R + **write tasks only** (`put_object` Task/Issue triage) | R | R | R | — | W (planning PRs, spec repo) |
| Backend Engineer | R + task protocol (`claim…submit`) | R | R | R | R | W (task PRs, own repos) |
| Frontend Engineer | R + task protocol | R | R | R | R | W (task PRs, prototypes) |
| QA Engineer | R + task protocol + GoldenTest drafts | R | R | R | R | W (task PRs) |
| Reviewer | R only | R | R | R | — | R + review verdicts — **no write to code repos** |
| Librarian | R | R/W (`assemble_context`, `link`) | R/W (`refresh_index`) | R | — | — |
| Auditor | R + `open_issue` | R | R | R | — | R |
| Deployment Manager | R + Deployment status via runtime | R | R | — | — | W (`dispatch_workflow` deploy only) |
| Knowledge Curator | R | R/W (`ingest`, `validate`, `promote_confidence`) | R/W | — | R (comment intake) | — |
| Evaluation Manager | R + `record_evaluation` | R | R | — | — | R + `dispatch_workflow` (evaluate) |

Invariants the matrix encodes:

- **Nobody approves.** No role, on any server, can perform
  `proposed → approved` or author a Decision — that path exists only
  in the human-gated
  [approval workflow](github-integration.md#governed-object-approval-flow)
  (PP-0002 §6.2, PP-0010 §7).
- **Producers don't judge; judges don't produce.** Engineer roles have
  no `record_evaluation`; the Reviewer and Evaluation Manager have no
  code-repo write (PP-0008 §5.2).
- **Only the Planner shapes the graph**; workers' `pp-spec` writes are
  the task protocol plus records (PP-0007 §5.2).
- **Only ingestion writes the Brain** — `ingest` with provenance, never
  `put_object` into `brain/knowledge/` (PP-0009 §2).

## Gateway architecture

One MCP gateway runs in `pp-system`; sessions get no other egress to
these systems ([NetworkPolicy](kubernetes.md#secrets-and-identity)).

- **Per-session tokens.** At spawn, the scheduler mints a gateway
  token binding `{session, role, task, product, lease}`. The gateway
  resolves the role's policy per the matrix, scopes `github` to the
  repos the task names, and expires everything with the lease.
- **Audit log as evidence.** Every tool call — caller, arguments
  digest, result digest, timestamp — streams to the evidence store and
  is referenced from the session's transcript. Evaluations and the
  Auditor's constitution audits can cite exactly what a session read
  and wrote ([evaluation](../evaluation.md)); "how did the worker know
  X" is answerable from record.
- **Enforcement depth:** CLAUDE.md discourages, the gateway refuses,
  and GitHub branch protection backstops — three layers, same rules
  ([claude-md.md anti-patterns](../repositories/claude-md.md#anti-patterns)).

An audit record, as stored (illustrative):

```json
{
  "session": "sess-task-guest-checkout-api-a3",
  "role": "backend-engineer",
  "task": "task-guest-checkout-api",
  "tool": "pp-brain.retrieve",
  "argsDigest": "sha256:4c1d…",
  "resultDigest": "sha256:9e02…",
  "items": [
    "pp://aurora-books/Knowledge/know-payment-provider-limits@1.2.0"
  ],
  "at": "2026-07-03T14:22:07Z",
  "leaseExpiresAt": "2026-07-03T18:10:00Z"
}
```

### Deployment and versioning

The six servers run as gateway-fronted Deployments in `pp-system`
(the `github` and `linear-mirror` servers are thin proxies over the
vendor APIs; `pp-spec` and `pp-brain` own their storage-facing
logic). Server versions are pinned in the session base image's MCP
configuration and rolled like any other infrastructure change —
through a PR, not live edits — so a tool's behavior on a given date
is reconstructible when auditing an old session transcript.

## Context assembly with the Librarian

`pp-brain assemble_context` is the RA implementation of the PP-0007 §4
context contract, and the [Librarian](../agents/README.md) is its
curator for context-heavy tasks:

- **Bounded.** Assembly honors the Worker's `maxContextItems` and a
  token ceiling; retrieval selects (PP-0009 §3), never dumps. When
  trimming, completion criteria and in-scope constitution articles are
  irreducible; knowledge and code context trim first.
- **Provenance-preserving.** Every item arrives tagged with its fully
  qualified identity (`pp://aurora-books/Knowledge/know-payment-provider-limits@1.2.0`)
  and its confidence level, so the session's outputs are traceable to
  the exact object versions that informed them.
- **Untrusted content is marked.** Items originating outside the
  governed tree — user-reported Issues, feedback Observations, vault
  intake — are wrapped as *data, not instructions*, per PP-0007 §4's
  injection guidance.
- **Fixed at claim.** The bundle is assembled once when the claim is
  granted and recorded by digest; a specification superseded mid-task
  triggers release-and-replan (PP-0006 §8.4), never a silent swap.

## How MCP keeps CLAUDE.md lean

The [CLAUDE.md system](../repositories/claude-md.md) can stay under
its token budget precisely because everything bulky sits behind a
tool: constitution text arrives via claim context, product facts via
`pp-brain retrieve`, code understanding via `graphify-code` and
`qmd-search`, history via `pp-spec get_object`. CLAUDE.md carries the
*map* — what exists, where it lives, which tool answers which question
— and the servers carry the territory. When a fact starts getting
pasted into CLAUDE.md, the fix is a better retrieval path, not a
bigger file.
