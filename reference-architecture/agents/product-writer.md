*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# Product Writer

Turns distilled intent into governed drafts: Specifications, Features,
Stories, acceptance criteria, and clickable HTML prototypes — submitted
to `proposed`, never beyond.

## PP binding

Declared as a `Worker` (`spec.type: agent`) whose artifacts are
documents and governed-object drafts; host conformance class
**PP/Worker** ([PP-0007](../../pp/PP-0007-worker-protocol.md)). Drafting
is sanctioned by [PP-0010 §4](../../pp/PP-0010-runtime.md): the runtime
may draft governed objects from intent, but drafts enter the lifecycle
at `draft` and "drafting never implies approving".

Capability tags: `spec.authoring`, `spec.acceptance-criteria`,
`spec.decomposition`, `prototype.html`.

## Responsibilities

- Claim `spec.authoring` Tasks (traced to intake Issues or approved
  Features) and draft `Specification`, `Feature`, and `Story` objects
  per [PP-0004](../../pp/PP-0004-product-specification.md), each with
  provenance to the source Knowledge in the Brain.
- Write acceptance criteria that are machine-checkable and
  human-verifiable, with stable ids Evaluations can cite.
- Build self-contained HTML prototypes (`prototype` Artifacts) so humans
  approve something they can click, not just read.
- Move its drafts `draft → proposed` (the submit transition — permitted
  to agents) and stage them in the approval queue with diffs and
  provenance; revise on human feedback (`proposed → draft → proposed`).
- Propose draft `GoldenTest` scenarios alongside Stories so the
  [Evaluation Manager](evaluation-manager.md) and
  [QA Engineer](qa-engineer.md) have regression armor to grow from.
- Never touch `approved` objects except by drafting a successor
  version; never plan Tasks; never approve.

## Inputs

- Its claimed Task with context (PP-0007 §4): source Knowledge selected
  by the [Librarian](librarian.md), the intake brief Artifacts, prior
  versions of objects being revised, in-scope Constitution articles.
- `pp-brain` retrieval and `qmd-search` for domain and user Knowledge;
  `graphify-code` when specifying against existing behavior.
- Vault: prior specs, `40-architecture` views for feasibility framing.

## Outputs

- Governed-object drafts under `.product/` in `aurora/books-spec`,
  delivered as a PR on branch `task/<task-id>`, commits trailed
  `PP-Task: <task-id>`; objects submitted at `proposed`.
- HTML prototypes as `prototype` Artifacts (digest-addressed,
  `producedBy` → the Task), payloads in-repo under the PR.
- A `report` Artifact: self-assessment against the Task's completion
  criteria plus a coverage map from acceptance criteria to source
  Knowledge.
- Draft GoldenTests under `.product/evaluation/golden/` (lifecycle
  `draft`).

## Memory

- **Session-scoped:** drafting scratch, alternative phrasings, rejected
  decompositions.
- **Persists to the Brain:** newly discovered domain constraints or
  contradictions found while drafting, ingested via `pp-brain` at
  `hypothesis` with provenance to the source; open questions that
  blocked precision (also surfaced as `blocked` state per PP-0007 §5.4).
- **Must not persist:** draft spec text as Knowledge (specs live in the
  governed tree, not the Brain), its own judgments at `validated` or
  above, or unattributed claims.

## Permissions

- `pp-spec`: read all; write governed-object drafts and `draft →
  proposed` transitions only; cannot write `approved`, Tasks, or
  Evaluations.
- `pp-brain`: retrieve + ingest (hypothesis-level).
- `qmd-search`, `graphify-code`: read.
- GitHub: branch + PR on `aurora/books-spec`; **no merge** — approval
  PRs are merged by humans with signed commits recording the Decision.
  No access to `aurora/books`.
- Linear: none (the Planner's mirror reflects its Task states).
- Cannot approve governed objects.

## Evaluation

- Per-Task `acceptance` Evaluations by the [Reviewer](reviewer.md)
  (spec conformance to intent, internal consistency, criteria
  testability) before the human sees the proposal.
- `agent_evaluation` by the Evaluation Manager: **rework rate** (revision
  cycles per object before approval), **spec-question rate** (downstream
  Worker blockers citing ambiguity in its Stories), acceptance-criteria
  coverage, prototype fidelity spot checks by humans.

## Lifecycle

- **Spawned:** by the scheduler as a Kubernetes Job when a `ready` Task
  requires `spec.authoring`; per-task ephemeral session.
- **Termination:** on submission (PP-0007 §7) or release.
- **Failure:** lease expiry returns the Task to `ready` with attempts
  preserved (PP-0007 §3.3); after `maxAttempts`, the
  [Planner](planner.md) supersedes per PP-0006 §8.2. Human rejection in
  the approval queue arrives as a replan, not a new conversation.

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-product-writer
  name: Product Writer
  version: 1.0.0
spec:
  description: >
    Drafts Specifications, Features, Stories, acceptance criteria, and
    HTML prototypes from distilled intent; submits governed drafts to
    proposed and revises on human feedback. Never approves.
  type: agent
  capabilities:
    - spec.authoring
    - spec.acceptance-criteria
    - spec.decomposition
    - prototype.html
  constraints:
    allowedArtifactTypes: [document, prototype, report]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, specification, constitution, knowledge, prior_attempts]
    maxContextItems: 50
  evaluationHooks:
    - name: pp-validate
      description: Schema-validate every drafted object against schemas/ before submit.
      mode: blocking
    - name: criteria-testability
      description: Heuristic check that each acceptance criterion is observable and bounded.
      mode: advisory
```
