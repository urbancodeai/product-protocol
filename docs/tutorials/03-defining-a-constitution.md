# Tutorial 3 — Rules that always hold

*(Informative. Normative sources:
[PP-0005](../../pp/PP-0005-product-constitution.md) for the
Constitution kind, enforcement, and amendment;
[PP-0008](../../pp/PP-0008-evaluation.md) for GoldenTests,
QualityGates, Evaluators, and Evaluations;
[PP-0002](../../pp/PP-0002-core-concepts.md) for the governed
lifecycle.)*

Specifications say what to build; nothing in them says what must never
be violated while building it. That is the Constitution: Articles that
apply to the entire Product at all times, are continuously checked at
declared enforcement points, and change only by human-approved
amendment. Here you grow Notely's bootstrap constitution into five
real articles, wire their enforcement, watch a violation get handled,
and amend the document the only way it can be amended.

## 1. Five articles

The bootstrap file is still a `draft`, so you may edit it in place —
only approved versions are immutable. Replace
`.product/constitution/notely-constitution.yaml` with:

```yaml
pp: "0.1"
kind: Constitution
metadata:
  id: notely-constitution
  name: Notely Constitution
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-03T09:15:00Z"
  updatedAt: "2026-07-12T10:00:00Z"
  owners:
    - { type: human, id: alex@notely.dev, name: Alex Rivera }
spec:
  preamble: >
    Notely holds its users' working notes — sometimes their most
    sensitive drafts. These Articles hold for every task, every
    deployment, and the running product, at all times.
  articles:
    - id: SEC-1
      category: security
      rule: >
        Secrets, credentials, and API keys MUST NOT appear in source
        code, files under version control, or logs.
      enforcement:
        mode: blocking
        evaluatedOn: [task_submission, deployment]
        evaluations:
          - ref: { kind: QualityGate, id: gate-secret-scan }
    - id: PERF-1
      category: performance
      rule: >
        The 95th-percentile time from opening a note to it being
        editable MUST remain at or below 1500 ms in production.
      enforcement:
        mode: blocking
        evaluatedOn: [deployment, observation]
        monitor: >
          p95 note-open-to-editable from production telemetry, 1-hour
          window; violation when above 1500 ms for two consecutive
          windows.
    - id: A11Y-1
      category: accessibility
      rule: >
        Every user-facing view MUST satisfy WCAG 2.2 level AA, and
        creating, editing, and sharing a note MUST be operable by
        keyboard alone.
      enforcement:
        mode: blocking
        evaluatedOn: [task_submission]
        evaluations:
          - ref: { kind: GoldenTest, id: golden-keyboard-only }
    - id: ARCH-1
      category: architecture
      rule: >
        Browser code MUST NOT access the data store directly; all
        reads and writes MUST go through the published API layer.
      rationale: >
        Keeps permission checks (who may see a note) in one place.
      enforcement:
        mode: blocking
        evaluatedOn: [task_submission]
    - id: CODE-1
      category: coding_standards
      rule: >
        All TypeScript MUST compile under strict mode, and the `any`
        type SHOULD NOT be introduced.
      enforcement:
        mode: advisory
        evaluatedOn: [task_submission]
```

Anatomy of an Article (PP-0005 §4): a stable `id` (never reused for a
different rule — Evaluations and Issues cite it across versions),
exactly one `category` from the closed list, a `rule` phrased with
BCP 14 keywords so its force is unambiguous, and an `enforcement`
binding. PERF-1 is a performance article carrying its budget in the
rule, with `monitor` telling the runtime what to watch at the
`observation` point. The binding's two required parts:

- **`mode`** — `blocking`: a violation prevents the guarded transition
  (SEC-1 failing stops a Task from being accepted and a Deployment
  from proceeding). `advisory`: recorded and raised, never blocks —
  CODE-1's entire force is the paper trail it creates.
- **`evaluatedOn`** — where the rule is checked: one or more of
  `task_submission`, `deployment`, `schedule`, `observation`. An
  article is checked at *every* listed point, every time (PP-0005 §5).

`enforcement.evaluations` optionally pins the executable check. SEC-1
and A11Y-1 reference objects that do not exist yet — write them now,
or the refs dangle.

## 2. The checks behind the articles

A11Y-1 is operationalized by a GoldenTest — a canonical scenario the
product must always satisfy. GoldenTests are governed objects like
Stories: agents may draft them, but only a human approval (with its
own Decision) puts one in force, because a system that can weaken its
own regression armor grades its own homework (PP-0008 §6). Write
`.product/evaluation/golden/golden-keyboard-only.yaml`:

```yaml
pp: "0.1"
kind: GoldenTest
metadata:
  id: golden-keyboard-only
  name: Create and share a note by keyboard alone
  version: 1.0.0
  lifecycle: approved
  createdAt: "2026-07-12T09:00:00Z"
spec:
  scenario: >
    A signed-in teammate who cannot use a pointing device creates a
    note, writes a paragraph, and shares it with the team — using
    only the keyboard.
  expected: >
    Every step is reachable in a logical focus order, focus is
    visible throughout, the share dialog traps focus while open,
    and the flow completes without a pointing device.
  steps:
    - step: Sign in and move focus to "New note" using only Tab/Enter.
    - step: Type a title and a paragraph of content, then save.
    - step: Open the share dialog and create a share link by keyboard.
    - step: Verify focus order, visible focus, and dialog focus trap.
  method: agentic
  appliesTo:
    - ref: { kind: Feature, id: feat-note-sharing }
    - ref: { kind: Constitution, id: notely-constitution }
  tolerance: >
    Visual styling of the focus ring may vary; skipped or trapped
    focus, or steps requiring a pointer, may not.
```

(Its approval Decision — `dec-2026-07-12-golden-keyboard-only` —
follows the tutorial 2 pattern.) SEC-1 points at a QualityGate, a
named predicate over Evaluations. Write
`.product/evaluation/gates/gate-secret-scan.yaml`:

```yaml
pp: "0.1"
kind: QualityGate
metadata:
  id: gate-secret-scan
  name: Secret scan gate
  version: 1.0.0
  createdAt: "2026-07-12T09:10:00Z"
spec:
  description: >
    No task is accepted while its changeset contains anything that
    looks like a credential. Operationalizes Article SEC-1.
  trigger: task_acceptance
  mode: blocking
  requires:
    - description: >
        A current security evaluation of the submitted work reports
        no secrets, keys, or credentials in the changeset.
      selector:
        category: security
      verdict: pass
```

Declare who runs these checks at
`.product/evaluation/evaluators/eval-notely-auditor.yaml`:

```yaml
pp: "0.1"
kind: Evaluator
metadata:
  id: eval-notely-auditor
  name: Notely Constitution Auditor
  version: 1.0.0
  createdAt: "2026-07-12T09:20:00Z"
spec:
  description: >
    Automated auditor: runs the secret scanner, the strict-mode
    typecheck, and the architecture boundary check over submitted
    changesets and the repository on a schedule.
  type: automated
  categories:
    - constitution_audit
    - security
```

Then propose and approve the constitution exactly as in tutorial 2:
`lifecycle: proposed`, human review, `lifecycle: approved`, plus
`.product/brain/decisions/dec-2026-07-12-constitution-v1.yaml`:

```yaml
pp: "0.1"
kind: Decision
metadata:
  id: dec-2026-07-12-constitution-v1
  name: Approve notely-constitution v1.0.0
  version: 1.0.0
  createdAt: "2026-07-12T10:00:00Z"
spec:
  context: >
    The bootstrap constitution held a single secrets rule. This
    version adds performance, accessibility, architecture, and
    coding-standard articles before autonomous execution begins.
  outcome: >
    Approved. All five articles are in force from this decision.
  authority: { type: human, id: alex@notely.dev, name: Alex Rivera }
  decidedAt: "2026-07-12T10:00:00Z"
  affects:
    - ref: { kind: Constitution, id: notely-constitution, version: "1.0.0" }
  approves: { ref: { kind: Constitution, id: notely-constitution, version: "1.0.0" } }
```

From this moment the articles bind every Task, Artifact, and
Deployment — and they outrank any Specification, Story, or Task
instruction that conflicts with them (PP-0005 §7).

## 3. What a violation produces

Suppose the auditor finds browser code querying the data store
directly. Every detected violation — blocking or advisory — must
produce two records (PP-0005 §5.3). First, an Evaluation with verdict
`fail`, citing the Constitution at its exact version and the violated
article id, with evidence
(`.product/evaluation/runs/ev-2026-07-13-arch-sweep-001.yaml`):

```yaml
pp: "0.1"
kind: Evaluation
metadata:
  id: ev-2026-07-13-arch-sweep-001
  name: Constitution audit — ARCH-1 violation in note list
  version: 1.0.0
  createdAt: "2026-07-13T07:00:00Z"
spec:
  subject:
    ref: { kind: Product, id: notely }
  category: constitution_audit
  criteria:
    - source:
        ref: { kind: Constitution, id: notely-constitution, version: "1.0.0" }
      description: >
        Article ARCH-1: browser code must not access the data store
        directly. Violated — src/web/note-list.ts opens a database
        connection instead of calling the notes API.
  verdict: fail
  evidence:
    - type: diff
      description: The offending import and query in note-list.ts.
      path: evaluation/runs/evidence/ev-2026-07-13-arch-sweep-001/note-list.diff
      digest: sha256:51c70cbd164662c07a7d8a711d97283fa18ab22f678984af5f511829c07ad572
  evaluator:
    ref: { kind: Evaluator, id: eval-notely-auditor }
  evaluatedAt: "2026-07-13T07:00:00Z"
```

Second, an Issue referencing that Evaluation, so the violation enters
the planning loop and cannot be silently dropped
(`.product/issues/issue-arch-1-note-list.yaml`):

```yaml
pp: "0.1"
kind: Issue
metadata:
  id: issue-arch-1-note-list
  name: note-list.ts bypasses the API layer
  version: 1.0.0
  createdAt: "2026-07-13T07:01:00Z"
spec:
  title: note-list.ts bypasses the API layer
  description: >
    The note list view queries the data store directly, violating
    Article ARCH-1. Permission checks in the API layer are skipped,
    so restricted notes could be listed to the wrong teammates.
  severity: high
  source:
    type: constitution_violation
    ref: { ref: { kind: Evaluation, id: ev-2026-07-13-arch-sweep-001 } }
  affects:
    - ref: { kind: Feature, id: feat-note-sharing }
status:
  state: open
```

Because ARCH-1 is `blocking`, the next guarded transition of the
affected work stays blocked until the violation is resolved. Had this
been advisory CODE-1, the same two records would exist and nothing
would block. The only sanctioned bypass is an exception on the article
itself: described, bounded, expiring — and, for a blocking article,
carrying `approvedBy` with a ref to a human Decision (PP-0005 §4.2).
An exception without that Decision unblocks nothing.

## 4. Amendment

Suppose the team later tightens PERF-1's budget to 1200 ms. Approved
versions are immutable, so a Constitution changes only by amendment
(PP-0005 §6): a new version of the same `id`, entering the lifecycle
at `draft`, proposed with its diff, approved by a human Decision —
after which the superseded version moves to `deprecated`:

```yaml
# notely-constitution across the amendment
metadata: { id: notely-constitution, version: 1.0.0, lifecycle: deprecated }  # was in force
metadata: { id: notely-constitution, version: 1.1.0, lifecycle: approved }    # in force now
```

The amendment Decision (`dec-2026-08-01-constitution-v1-1`, say) has
the same shape as the approval above, with `approves` pinning
`version: "1.1.0"`. Tightening enforcement is a MINOR bump; removing
or weakening an article is MAJOR; article ids are never recycled.
Anyone — human or agent — may *draft* an amendment; no agent may ever
approve one. That asymmetry is the point: the Constitution is the one
place an autonomous system cannot loosen its own constraints.

Validate the new files (schemas: `constitution/constitution.schema.json`,
`evaluation/golden-test.schema.json`, `evaluation/quality-gate.schema.json`,
`evaluation/evaluator.schema.json`, `evaluation/evaluation.schema.json`,
`task/issue.schema.json`, `knowledge/decision.schema.json`), commit,
and continue to [tutorial 4](./04-running-the-loop.md), where these
articles and gates do their real job during one turn of the loop.
