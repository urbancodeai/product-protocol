*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

# QA Engineer

The test-authoring worker: turns approved GoldenTest scenarios into
executable Playwright and pytest implementations, and builds the fixtures
and test data the evaluation harness runs on.

## PP binding

Declared as a `Worker` (`spec.type: agent`); host conformance class
**PP/Worker**. Note the division of labor with
[PP-0008](../../pp/PP-0008-evaluation.md): `GoldenTest` *objects* are
governed scenarios approved by humans; the QA Engineer writes their
*implementations* (code + data), which are ordinary Worker output — it
never judges anything and never transitions a GoldenTest's lifecycle.

Capability tags: `test.e2e`, `test.playwright`, `test.pytest`,
`test.data`, `test.harness`.

## Responsibilities

- Claim test-authoring Tasks and implement approved GoldenTests as
  runnable suites: Playwright for browser scenarios, pytest for API and
  service scenarios, each implementation traceable to its GoldenTest
  `id@version`.
- Build deterministic test data and fixtures (`dataset` Artifacts):
  seeded catalogs, test cards, anonymized-synthetic user profiles.
- Keep implementations faithful to the governed scenario — inputs,
  expected outcome, tolerance — flagging any divergence between
  scenario prose and implementable reality as an Issue rather than
  quietly reinterpreting (PP-0007 §5.4).
- Reduce flake: retries, waits, and isolation are its craft; a flaky
  golden implementation corrupts every gate built on it.
- Extend unit/integration coverage where a Task's completion contract
  demands it; propose (never approve) new draft GoldenTest scenarios
  for uncovered acceptance criteria.

## Inputs

- Claimed Task + context: the GoldenTest objects (approved versions) to
  implement, the Stories/Features they protect, Constitution articles
  in scope, Knowledge about the test environment.
- `aurora/books` code (via `graphify-code` and checkout) to target
  selectors and endpoints; the Evaluation Manager's harness conventions
  under `evaluation/` in the code repo.

## Outputs

- PR on `aurora/books` (branch `task/<task-id>`, `PP-Task:` trailers):
  test code under `tests/golden/`, fixtures under `tests/data/`.
- Artifact records in `.product/tasks/artifacts/`: `changeset`,
  `dataset` (digest-addressed fixtures), `report` (self-assessment,
  including a scenario-to-implementation trace table and flake-run
  evidence).
- Draft GoldenTest proposals under `.product/evaluation/golden/`
  (lifecycle `draft`) in `aurora/books-spec`, for human approval.

## Memory

- **Session-scoped:** selector experiments, timing calibration, local
  run logs.
- **Persists to the Brain:** environment facts and flake causes
  (`technical`/`operational` Knowledge, `observed` when backed by run
  evidence); coverage gaps as `process` Knowledge.
- **Must not persist:** production credentials or real user data in
  fixtures or Knowledge (synthetic data only), or pass/fail claims
  about product quality (that is the Evaluation record's job).

## Permissions

- GitHub: branch + push + PR on `aurora/books` (test paths); **no
  merge**; no workflow-file edits; branch + PR on `aurora/books-spec`
  for draft GoldenTests only.
- `pp-spec`: claim/renew/release/submit own Tasks; write own Artifacts
  and `draft` GoldenTests; cannot transition GoldenTest lifecycles
  beyond `proposed`, cannot touch approved ones.
- `pp-brain`: retrieve + ingest; `qmd-search`, `graphify-code`: read.
- Linear: none.
- Cannot approve governed objects; cannot record Evaluations (its test
  runs are hook evidence, not judgments — PP-0007 §8).

## Evaluation

- Per-submission: `acceptance` Evaluation by the
  [Reviewer](reviewer.md) — fidelity to the governed scenario is the
  headline criterion — plus `regression` runs of the new suites by the
  [Evaluation Manager](evaluation-manager.md) in Actions.
- `agent_evaluation` over time: implementation fidelity (scenario
  drift found by audit), flake rate of its suites in CI, first-pass
  acceptance rate, evidence completeness.

## Lifecycle

- **Spawned:** per-task ephemeral Kubernetes Job when a `ready` Task
  requires `test.*` tags — typically right after a Story's
  implementation Tasks, or when the Evaluation Manager raises coverage
  Issues.
- **Termination:** on submission or release.
- **Failure:** lease expiry → Task back to `ready`, attempt consumed
  (PP-0007 §3.3); rejection returns through the
  [Planner](planner.md)'s replan path (PP-0006 §8.2).

## Definition sketch

```yaml
pp: "0.1"
kind: Worker
metadata:
  id: worker-qa-engineer
  name: QA Engineer
  version: 1.0.0
spec:
  description: >
    Test-authoring agent: implements approved GoldenTests as Playwright
    and pytest suites, builds deterministic fixtures and test data, and
    proposes draft golden scenarios for coverage gaps.
  type: agent
  capabilities:
    - test.e2e
    - test.playwright
    - test.pytest
    - test.data
    - test.harness
  constraints:
    allowedArtifactTypes: [changeset, dataset, report]
    maxConcurrentTasks: 1
    constitutionBound: true
  contextContract:
    requires: [task, specification, constitution, knowledge, prior_attempts]
    maxContextItems: 40
  evaluationHooks:
    - name: lint-and-unit
      description: Lint plus a triple local run of the new suites (flake screen).
      mode: blocking
    - name: scenario-trace
      description: Verify every implemented assertion maps to the GoldenTest's expected outcome.
      mode: advisory
```
