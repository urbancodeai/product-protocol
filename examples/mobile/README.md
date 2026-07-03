# Example: TrailKit — a mobile hiking & fitness companion

A complete, validating `.product/` tree (per [PP-0002 §7](../../pp/PP-0002-core-concepts.md))
for **trailkit**, a mobile app for offline trail maps, GPS activity
tracking, and scheduled safety check-ins with contact escalation.

## Scenario

TrailKit ships to app stores on a **two-week release train**. Because
store review takes days and "roll forward fast" does not exist on
mobile, the promotion gate is strict: visual golden-screen tests,
battery and cold-start budgets, and a constitution audit must all pass
on the internal **test** track before a build boards the train to
**production**. In June 2026 a production incident (continuous GPS
during check-in windows tripling battery drain) is recorded as an
Observation, raised as an Issue, and distilled into a `lesson`
Knowledge entry that later Tasks cite in their context.

## What this example demonstrates (mobile flavor)

- **App-store release trains** — `Product.spec.environments` declares
  `test` + `production`; a `recreate` deploy to the test track (now
  `superseded`) and a `rolling`/phased train release to production
  (`active`), both gated by the same `deployment_promotion` gate
  (PP-0010 §6).
- **Offline-first NFRs** — the Specification's
  `nonFunctionalRequirements` make offline operation a reliability
  requirement, and the Constitution's `art-arch-offline-first` makes it
  a blocking architecture rule (PP-0004 §2, PP-0005).
- **Battery budget as a performance budget** —
  `nfr-battery` carries `budget: {metric: battery_drain_per_hour_tracking,
  value: 5, unit: percent}`, enforced by the `golden-battery-budget`
  GoldenTest and the `art-perf-battery` article, and violated by the
  incident Observation (closing the loop budget → gate → telemetry).
- **Accessibility articles** — `art-a11y-trail-actions` (WCAG 2.2 AA,
  48dp glove-friendly targets) evaluated on task submission.
- **Visual golden tests** — `golden-offline-map-render` is
  `method: agentic` and produces a `category: visual` Evaluation with a
  screenshot Evidence item and an SSIM score (PP-0008 §6, §8).
- **UX prototypes** — `Specification.spec.ux.prototypes` references two
  self-contained HTML mocks in [`prototypes/`](./prototypes/) by path
  (relative to this example's root, i.e. the product repository root)
  with `format: html`.
- **Governed lifecycle** — most governed objects are `approved` (with a
  representative approval Decision pinning the exact Specification
  version); `story-checkin-sms-fallback` sits in `proposed`, awaiting a
  human Decision (PP-0002 §6.2).

## Tree

```
mobile/
├── README.md
├── prototypes/                       # referenced by Specification ux.prototypes
│   ├── trail-map.html
│   └── safety-checkin.html
└── .product/
    ├── product.yaml                  # Product (PP-0002 §9): envs test/production
    ├── brain/                        # PP-0003
    │   ├── brain.yaml                # ProductBrain
    │   ├── knowledge/                # 5 Knowledge: domain/user/technical/operational/lesson
    │   │   └── … (lesson derived_from the battery incident Observation)
    │   └── decisions/                # 2 ADR-style Decisions + 1 approval Decision
    ├── specification/                # PP-0004: 2 Goals, 2 Capabilities, 1 Specification,
    │   └── …                         #   2 Features, 3 Stories (1 proposed)
    ├── constitution/
    │   └── trailkit-constitution.yaml  # PP-0005: 7 articles incl. accessibility & battery
    ├── tasks/                        # PP-0006: 5-task DAG (done/in_progress/ready/pending)
    │   └── artifacts/                # PP-0007 §6 Artifact records (changeset, report, binary)
    ├── workers/                      # PP-0007: one agent, one human
    ├── evaluation/                   # PP-0008
    │   ├── evaluator-trailkit-quality.yaml
    │   ├── golden/                   # 3 GoldenTests (2 in dataset "mobile-core"; 1 visual agentic)
    │   ├── gates/                    # task_acceptance + deployment_promotion gates
    │   └── runs/                     # acceptance, visual (scored), constitution_audit
    ├── deployments/                  # PP-0010 §6: test-track (superseded) + train (active)
    ├── observations/                 # telemetry, incident (→ lesson), user_feedback
    └── issues/                       # planned (linked to a Task) + open (from the incident)
```

## Which PP documents each directory illustrates

| Directory | Spec |
| --- | --- |
| `product.yaml` | PP-0002 §9 (Product kind, environments, repositories) |
| `brain/` | PP-0003 (ProductBrain, Knowledge categories & confidence, Decisions incl. `spec.approves`) |
| `specification/` | PP-0004 (Goals with metrics, Capabilities `serves`, Specification with personas/FR/NFR budgets/ux prototypes, Features, Stories with mixed acceptance-criteria forms) |
| `constitution/` | PP-0005 (articles with `enforcement.mode` / `evaluatedOn`) |
| `tasks/` | PP-0006 (DAG via `dependsOn`, `tracesTo`, lifecycle states) |
| `tasks/artifacts/`, `workers/` | PP-0007 (worker contract; Artifact records live at `.product/tasks/artifacts/`, matching PP-0007's own example layout) |
| `evaluation/` | PP-0008 (Evaluator, GoldenTests & datasets, QualityGates, Evaluations with Evidence) |
| `deployments/`, `observations/`, `issues/` | PP-0010 (environments, deployment states, telemetry → incident → Issue → Task loop) |

## Notes and conventions

- Prototype `path`s in the Specification are relative to this example's
  root (`examples/mobile/`), which plays the role of the product
  repository root.
- One representative approval Decision (`dec-approve-spec-mvp`) is
  included; in a real product every `proposed → approved` transition
  gets its own Decision record (PP-0002 §6.2).
- All refs resolve within this tree; timestamps are causally ordered
  May–July 2026.
