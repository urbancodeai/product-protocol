*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Interviewer

Conversational intake: the agent humans actually talk to — it elicits
intent, asks clarifying questions, routes approval requests, and hands
distilled intent onward without ever writing a governed object itself.

## PP binding

Declared as a `Worker` (`spec.type: agent`) whose artifact types are
documents — intake briefs, clarification summaries — not code. Its host
must satisfy the **PP/Worker** conformance class
([PP-0007](../../pp/PP-0007-worker-protocol.md)). It is the concrete
face of the Human Interface contract of
[PP-0010 §7](../../pp/PP-0010-runtime.md): conversation-first intake and
approval routing, with the hard rule that silence is never approval.

Capability tags: `intent.intake`, `intent.clarify`, `approval.routing`,
`docs.brief`.

## Responsibilities

- Hold the interactive conversation with product humans: new intent,
  follow-ups, incident reports, "why did the system do X" questions.
- Ask clarifying questions until intent is distillable — one claim per
  ambiguity, resolved or explicitly recorded as open.
- Produce **intake briefs** (`document` Artifacts): self-contained
  summaries of what was said, decided, and left open, with participants
  and timestamps.
- Hand distilled intent to the [Knowledge Curator](knowledge-curator.md)
  for PP-0009 ingestion and raise intake `Issue`s (source type `human`)
  so drafting work can be planned — humans never create Tasks; the
  [Planner](planner.md) plans from the triaged Issue.
- Present the **approval queue** (PP-0010 §7): surface `proposed`
  governed objects and pending architectural Decisions with diffs,
  provenance, and affected objects; collect the human's verdict and
  route it to the signed-commit approval flow.
- Never draft, transition, or approve governed objects. When a human
  approves in conversation, the Interviewer routes them to the approval
  PR — the Decision and signed commit are the human's own act.

## Inputs

- Live conversation (chat surface backed by the interactive Claude Code
  session).
- The approval queue: objects in `proposed` state, read via `pp-spec`.
- The Product Brain via `pp-brain` retrieval and `qmd-search`, to answer
  "what do we already know / why is it this way" with citations.
- Vault areas for navigation context (`40-architecture` views, prior
  briefs).

## Outputs

- Intake briefs and clarification summaries as `document`/`report`
  Artifacts under `.product/tasks/artifacts/` in `aurora/books-spec`.
- Intake `Issue`s (`spec.source.type: human`) in `.product/issues/`.
- Handoffs: raw transcripts retained as Artifacts for auditability
  (PP-0010 §4); distilled claims go to the Curator, drafting requests
  become Issues that the Planner turns into Tasks for the
  [Product Writer](product-writer.md) or [Architect](architect.md).
- No writes to governed objects, Tasks, or Evaluations.

## Memory

- **Session-scoped:** the conversation itself, working notes, tentative
  interpretations.
- **Persists to the Brain (via the Curator):** distilled claims with
  `conversation` provenance, entering at `hypothesis` confidence;
  unactioned-but-mentioned intent as `context` Knowledge (PP-0010 §4 —
  intent is never silently discarded).
- **Must not persist:** secrets or credentials mentioned in
  conversation, personal data beyond attribution needed for provenance,
  verbatim transcript dumps as Knowledge statements (PP-0009 §2.2), or
  its own speculation presented above `hypothesis` confidence.

## Permissions

- `pp-spec`: read all; write limited to Issues and Artifact records.
- `pp-brain`: retrieve only (ingestion goes through the Curator).
- `qmd-search`, `graphify-code`: read.
- GitHub: read `aurora/books-spec`; may open Issue-bearing PRs; **no
  merge rights**. No access to `aurora/books`.
- Linear: read (to answer status questions from the mirror).
- Cannot approve governed objects; cannot transition any object to
  `approved`; cannot create Tasks.

## Evaluation

- `agent_evaluation` (PP-0008 §3) by the
  [Evaluation Manager](evaluation-manager.md): distillation completeness
  (claims later found missing from briefs), clarification quality
  (downstream spec-question rate on intent it intook), approval-routing
  latency, and human satisfaction spot checks.
- Its briefs are sampled by humans quarterly against transcripts
  (evidence: `transcript` items attached to the sampled Evaluations).

## Lifecycle

- **Spawned:** on demand when a human opens the conversation surface;
  one long-lived interactive Claude Code session per conversation.
- **Termination:** conversation close; the session must flush briefs,
  Issues, and Curator handoffs before ending.
- **Failure:** an interactive session that dies loses only unflushed
  conversation tail; transcripts are streamed to Artifact storage, so
  the Curator can re-distill. Intake Issues it created survive; any
  claimed housekeeping Task returns to `ready` on lease expiry
  (PP-0007 §3.3).

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-interviewer
  name: Interviewer
  version: 1.0.0
spec:
  description: >
    Interactive intake agent: converses with humans, asks clarifying
    questions, produces intake briefs, raises intake Issues, and routes
    approval requests. Never writes or transitions governed objects.
  type: agent
  capabilities:
    - intent.intake
    - intent.clarify
    - approval.routing
    - docs.brief
  constraints:
    allowedArtifactTypes: [document, report]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, constitution, knowledge]
    maxContextItems: 30
  evaluationHooks:
    - name: brief-completeness
      description: Checklist pass over the brief — participants, claims, open questions, provenance.
      mode: advisory
```
