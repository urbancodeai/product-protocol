# RA v1 — Product Lifecycle

*Part of the [Reference Architecture v1](./README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../README.md).*

This document walks one full turn of the loop
([PP-0010 §1](../pp/PP-0010-runtime.md)) through the RA v1 stack:

**Idea → Conversation → Specification → Constitution → Human Approval →
Planning → Linear → Claude Code Workers → Pull Request → Evaluation →
Deployment → Production → Telemetry → Knowledge Update → Continuous
Improvement.**

Each stage lists who acts, what PP objects are created or transitioned,
what tools are touched, and the exit condition that hands off to the
next stage. The running example is `aurora-books` adding guest checkout
(the same thread as [`examples/ecommerce`](../examples/ecommerce/)).

## 1. Idea and Conversation

- **Who:** Human (founder, product owner) with the
  [Interviewer](./agents/interviewer.md).
- **Objects:** none yet — raw prose.
- **Tools:** chat surface; notes land in the Obsidian vault inbox
  (`inbox/2026-07-03-guest-checkout.md`) with attribution and date.
- **Exit:** the Interviewer has asked its clarifying questions ("guest
  orders create no account, correct? what about email receipts?") and
  the human has answered; the note is marked ready for ingestion.

## 2. Brain ingestion

- **Who:** [Knowledge Curator](./agents/knowledge-curator.md).
- **Objects:** `Knowledge` objects (category per
  [PP-0003 §2](../pp/PP-0003-product-brain.md)) in `.product/brain/knowledge/`,
  each with provenance pointing at the vault note; deduplicated and
  confidence-rated per [PP-0009 §2](../pp/PP-0009-knowledge-protocol.md).
- **Tools:** `pp-brain` MCP server; temporal knowledge graph rebuild;
  vault views regenerated ([knowledge/synchronization.md](./knowledge/synchronization.md)).
- **Exit:** the conversation's factual content exists as versioned
  Knowledge; contradictions with existing Knowledge are flagged for the
  Curator's review queue.

## 3. Specification drafting

- **Who:** [Product Writer](./agents/product-writer.md), consulting the
  Brain; [Architect](./agents/architect.md) contributes prototypes and
  architecture notes.
- **Objects:** governed objects in `draft` → `proposed`: `Goal`,
  `Capability`, `Feature`, `Story` (with acceptance criteria),
  `Specification` ([PP-0004](../pp/PP-0004-product-specification.md));
  QA-relevant `GoldenTest` drafts; HTML prototypes committed under
  `prototypes/` and referenced from Stories.
- **Tools:** `pp-spec` MCP server; spec repo branch + PR; schema
  validation in CI.
- **Exit:** objects sit in `proposed` and appear in the approval queue.

## 4. Constitution

- **Who:** Product Writer / Architect drafting; the
  [Auditor](./agents/auditor.md) reviews coverage.
- **Objects:** a new `Constitution` version or amendment
  ([PP-0005 §6](../pp/PP-0005-product-constitution.md)) when the idea
  implies standing rules (e.g. "guest data is deleted after 30 days" →
  `compliance` article with `enforcement.evaluatedOn: [task_submission, schedule]`).
- **Tools:** same as stage 3.
- **Exit:** amendment in `proposed`, queued for approval. If no new
  rules are needed, this stage is a no-op — the existing constitution
  already constrains the work.

## 5. Human approval

- **Who:** Human, and only a human.
- **Objects:** a `Decision` object in `.product/brain/decisions/` whose
  `spec.approves` references each approved object at its exact version;
  the approved objects flip `proposed → approved`
  ([PP-0002 §6.2](../pp/PP-0002-core-concepts.md)).
- **Tools:** approval queue view in the vault; GitHub PR review; the
  approval commit is signed by the human's key, verified by a required
  check; CODEOWNERS backstop ([architecture.md §2](./architecture.md)).
- **Exit:** approved, immutable governed objects on `main`. Nothing
  downstream starts before this.

## 6. Planning

- **Who:** [Planner](./agents/planner.md) (PP/Planner).
- **Objects:** `Task` objects in `.product/tasks/` — the DAG
  ([PP-0006 §4](../pp/PP-0006-task-graph.md)). Each Task traces to
  exactly one Story/Feature/Issue, declares `dependsOn`, capabilities
  (e.g. `code.python`, `code.react`, `test.e2e`), context refs, and its
  completion contract (criteria + required GoldenTest evaluations)
  *before* it is claimable. Roots become `ready`; dependents `pending`.
- **Tools:** `pp-spec` MCP; Brain retrieval for lessons and prior
  Decisions (the Planner is required to see relevant Knowledge,
  [PP-0010 §8.2](../pp/PP-0010-runtime.md)).
- **Exit:** an acyclic Task Graph on `main` with a non-empty ready queue.

## 7. Linear mirror

- **Who:** `linear-mirror` sync service (no agent judgment involved).
- **Objects:** none created; each Task gains
  `metadata.annotations["linear.app/issue"]` pointing at its mirror.
- **Tools:** Linear API. Status flows one way: spec repo → Linear.
  Human comments on Linear issues flow back only as vault inbox notes,
  never as state changes ([runtime/linear-integration.md](./runtime/linear-integration.md)).
- **Exit:** humans can watch execution on a board they already know.

## 8. Execution — Claude Code workers

- **Who:** [Backend](./agents/backend-engineer.md) /
  [Frontend](./agents/frontend-engineer.md) /
  [QA Engineer](./agents/qa-engineer.md) workers — ephemeral Claude Code
  sessions launched as Kubernetes Jobs by the Agent Scheduler.
- **Objects:** Task transitions `ready → claimed → in_progress`
  (atomic claim + lease, [PP-0007 §3](../pp/PP-0007-worker-protocol.md));
  on completion, `Artifact` records (changeset ref + self-assessment
  report) and `in_progress → submitted`.
- **Tools:** the session claims via `pp-spec`, assembles bounded context
  via MCP (task, exact-version specs, constitution articles, Knowledge,
  prior attempts; qmd + Graphify for code context, curated by the
  [Librarian](./agents/librarian.md)); reads the repo's
  [CLAUDE.md](./repositories/claude-md.md); implements on branch
  `task/<task-id>`; runs its evaluation hooks (local pytest, lint,
  constitution self-check) before submitting; opens a PR titled with the
  Task id.
- **Exit:** PR open, Artifacts recorded, Task `submitted`. If the
  session dies instead, the lease expires and the Task returns to
  `ready` ([architecture.md §5](./architecture.md)).

## 9. Pull request and evaluation

- **Who:** GitHub Actions harnesses, the [Reviewer](./agents/reviewer.md)
  (agentic evaluator), and the
  [Evaluation Manager](./agents/evaluation-manager.md).
- **Objects:** Task `submitted → evaluating`; `Evaluation` records
  (acceptance, regression, visual, business_validation,
  constitution-scoped checks) appended to `.product/evaluation/runs/`
  with digest-referenced evidence; verdict drives
  `evaluating → done` (accepted) or `evaluating → rejected`.
- **Tools:** pytest, Playwright, LLM evaluations, performance budgets in
  Actions; evidence to the CI artifact store; gate results as required
  checks. Full detail: [evaluation.md](./evaluation.md).
- **Exit:** all blocking `task_acceptance` gates pass → PR merges →
  **merge is task done**. On rejection, the Planner replans or retries
  ([PP-0006 §8.2](../pp/PP-0006-task-graph.md)) and the loop re-enters
  stage 8.

## 10. Deployment

- **Who:** [Deployment Manager](./agents/deployment-manager.md).
- **Objects:** `Deployment` records ([PP-0010 §6](../pp/PP-0010-runtime.md))
  — first into `staging`, then `production` — with `status.evaluations`
  carrying the gate-check Evaluations (golden datasets re-run against
  the release candidate).
- **Tools:** GitHub environments with protection rules mapped to
  blocking `deployment_promotion` gates; Kubernetes rollout;
  `blue_green` for aurora-books.
- **Exit:** Deployment `active` in production; the previous one
  `superseded`. A failed rollout ends `failed` or `rolled_back` with a
  reason, and a compensating release is a *new* Deployment.

## 11. Production, telemetry, knowledge update

- **Who:** telemetry pipeline; Knowledge Curator; Planner.
- **Objects:** `Observation` records distilled from metrics, alerts, and
  user feedback; incidents always produce a `lesson` Knowledge object
  ([PP-0010 §8.2](../pp/PP-0010-runtime.md)); anomalies raise `Issue`
  objects, which the Planner triages into new Tasks — closing the loop
  into stage 6.
- **Tools:** telemetry → Observation exporter; `pp-brain` MCP ingestion;
  vault views for humans.
- **Exit:** there is none — this is the steady state. Each turn starts
  better informed than the last.

## One full turn

```mermaid
sequenceDiagram
    actor H as Human
    participant IV as Interviewer
    participant V as Vault
    participant SR as Spec repo (.product/)
    participant PW as Product Writer
    participant PL as Planner
    participant LN as Linear
    participant KS as k8s Scheduler
    participant CC as Claude Code worker
    participant GH as GitHub / Actions
    participant EM as Evaluation Manager
    participant DM as Deployment Mgr
    participant PR as Production
    participant KC as Curator

    H->>IV: idea (conversation)
    IV->>V: inbox note + clarifying Q&A
    KC->>SR: Knowledge (ingestion, provenance)
    PW->>SR: draft Spec/Stories/GoldenTests (proposed)
    SR->>V: approval queue view
    H->>SR: Decision + lifecycle flip (signed commit)
    PL->>SR: Task DAG (ready roots)
    SR->>LN: mirror sync (annotations)
    KS->>SR: claim task (atomic, lease)
    KS->>CC: launch ephemeral session (Job)
    CC->>SR: context via MCP (spec, constitution, knowledge)
    CC->>GH: branch task/&lt;id&gt; → PR + Artifacts
    GH->>GH: Actions: pytest · Playwright · LLM evals
    GH->>EM: harness results + evidence digests
    EM->>SR: Evaluation records (verdict + evidence)
    EM->>GH: gates pass (required checks)
    GH->>SR: merge ⇒ task done
    DM->>PR: Deployment (staging → production, env protection)
    PR->>SR: telemetry → Observations
    KC->>SR: lessons → Knowledge
    SR->>PL: informs replanning — next turn
```

## The human workflow

Humans in RA v1 do exactly five things:

1. **Discuss ideas** — free-form conversation with the Interviewer;
   no format required, the system does the structuring.
2. **Answer clarifying questions** — from the Interviewer during
   drafting, or from blocked workers (a Task's `blockedReason` surfaces
   as a vault question and a Linear comment).
3. **Approve specifications** — Goals, Capabilities, Features, Stories,
   Specifications, GoldenTests.
4. **Approve constitutions** — new versions and amendments.
5. **Approve architecture decisions** — Decisions the Architect proposes
   for choices that outlive any one task.

### How approval requests reach a human

- **Conversation:** the Interviewer says "two Stories are ready for your
  review" and can walk through the diff verbally.
- **Approval queue in the vault:** a generated view listing every
  `proposed` object with its diff against the prior approved version,
  provenance (which conversation, which Knowledge), and affected
  objects — the context [PP-0010 §7](../pp/PP-0010-runtime.md) requires.
- **GitHub PR review:** the Decision commit rides a PR the human
  reviews and merges, so the approval is also a familiar code-review
  motion.

### What "approve" concretely does

One signed commit that: writes the `Decision` object (with
`spec.approves` refs at exact versions, context, and rationale), flips
each approved object's `metadata.lifecycle` to `approved`, and merges to
`main` past the CODEOWNERS + human-signature checks. From that commit
onward the objects are immutable; change means a new version through the
same queue.

### What humans never do

- **Humans never create tasks.** The Planner derives all work from
  approved intent and triaged Issues. A human with a task-shaped idea
  expresses it as intent (stage 1) — or files feedback that becomes an
  Issue — and the Planner does the decomposing.
- **Humans never edit task state.** Not in Linear (mirror writes don't
  flow back), not in the spec repo. State moves only through the claim,
  submission, and evaluation protocols.
- **Humans rarely edit markdown or YAML directly.** They may — the
  protocol allows human authorship — but the RA v1 default is that
  agents write and humans judge. Silence is never approval; the queue
  waits.
