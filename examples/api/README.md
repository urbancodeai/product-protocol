# Example: BrookPay — a payments API service

A complete, validating `.product/` tree (per [PP-0002 §7](../../pp/PP-0002-core-concepts.md))
for **brookpay**, a payments API: charges, refunds, signed webhooks,
and strict idempotency on every mutating endpoint.

## Scenario

BrookPay releases reach **production** through **canary deployments**
gated on contract golden tests and a p99 latency budget, after
verification in **staging**. In June 2026 the first canary of release
0.4.2 is **rolled back automatically**: a merchant's webhook endpoint
goes hard-down, fixed-interval retries synchronize into a storm, the
shared dispatcher pool saturates, and charge p99 blows the 300 ms
budget. The incident is recorded as an Observation, raised as an open
Issue, distilled into a `lesson` Knowledge entry, and the mitigated
canary (same image, dispatcher pool isolated by runtime configuration)
goes out three days later and is now `active`.

## What this example demonstrates (API flavor)

- **No `ux` section** — `Specification.spec.ux` is omitted (it is
  optional per PP-0004 §2). For an API product the interface *is* the
  contract: intent lives in `businessRules` (over-refund guard,
  idempotency-key retention, settlement-aware refund states, webhook
  retry horizon) and strong `nonFunctionalRequirements`.
- **Latency and availability budgets** — `nfr-latency` carries
  `budget: {metric: charge_create_latency_p99, value: 300, unit: ms}`
  and `nfr-availability` a 99.95% SLO; the budget is enforced by the
  canary promotion gate, breached in the incident Observation, and
  re-verified by a scored performance Evaluation with measurement
  Evidence.
- **Compliance articles, stated generically** — `art-comp-chd` is a
  cardholder-data *handling* rule (PANs only at tokenization, never
  stored/logged/echoed) and `art-comp-audit-trail` a ledger rule. This
  example deliberately makes **no claim about PCI or any
  certification**; it shows how such rules are expressed and enforced,
  nothing more.
- **Contract golden tests** — all three GoldenTests are
  `method: automated`; two form the `dataset: contract-fixtures-v3`
  golden dataset that the canary gate selects by label (PP-0008 §6),
  and `golden-webhook-replay` replays the recorded incident traffic.
- **Canary deployment with rollback** — `deploy-canary-042-r1`
  (`rolled_back`, with `status.reason` explaining the automatic
  rollback) and `deploy-canary-042-r2` (`active`) ship the *same*
  container-image Artifact: the mitigation between the two attempts
  was runtime configuration, so no new image was produced — a
  deliberate illustration that Deployments are records of attempts,
  not new builds.
- **A `blocked` Task** — `task-signature-rotation` is blocked on a
  human decision (`status.blockedReason`) because its Story is still
  `proposed`, per the worker contract's honest-blocking rule
  (PP-0007 §5.4).

## Tree

```
api/
├── README.md
└── .product/
    ├── product.yaml                  # Product (PP-0002 §9): envs staging/production
    ├── brain/                        # PP-0003
    │   ├── brain.yaml                # ProductBrain
    │   ├── knowledge/                # 5 Knowledge: technical/user/domain/operational/lesson
    │   │   └── … (lesson derived_from the webhook-storm Observation)
    │   └── decisions/                # 2 ADR-style Decisions + 1 approval Decision
    ├── specification/                # PP-0004: 2 Goals, 2 Capabilities, 1 Specification
    │   └── …                         #   (no ux), 2 Features, 3 Stories (1 proposed)
    ├── constitution/
    │   └── brookpay-constitution.yaml  # PP-0005: 8 articles incl. 2 compliance, reliability
    ├── tasks/                        # PP-0006: 5-task DAG (done/in_progress/ready/blocked/pending)
    │   └── artifacts/                # PP-0007 §6 Artifact records (changeset, report, image)
    ├── workers/                      # PP-0007: one agent, one human
    ├── evaluation/                   # PP-0008
    │   ├── evaluator-brookpay-ci.yaml
    │   ├── golden/                   # 3 automated contract GoldenTests (2 in "contract-fixtures-v3")
    │   ├── gates/                    # task_acceptance + deployment_promotion (canary) gates
    │   └── runs/                     # acceptance, constitution_audit, performance (scored)
    ├── deployments/                  # PP-0010 §6: canary rolled_back + canary active
    ├── observations/                 # telemetry, incident (→ lesson), analytics
    └── issues/                       # planned (linked to a Task) + open (from the incident)
```

## Which PP documents each directory illustrates

| Directory | Spec |
| --- | --- |
| `product.yaml` | PP-0002 §9 (Product kind, environments, repositories) |
| `brain/` | PP-0003 (Knowledge categories & confidence ladder, Decisions incl. `spec.approves` at an exact version) |
| `specification/` | PP-0004 (Goals with metrics, Capabilities `serves`, Specification with businessRules/NFR budgets and no ux, Stories with mixed given/when/then and plain criteria) |
| `constitution/` | PP-0005 (blocking vs advisory enforcement, `evaluatedOn`, monitors) |
| `tasks/` | PP-0006 (DAG via `dependsOn`, `tracesTo` Story/Feature/Issue, blocked state with reason) |
| `tasks/artifacts/`, `workers/` | PP-0007 (worker contract; Artifact records live at `.product/tasks/artifacts/`, matching PP-0007's own example layout) |
| `evaluation/` | PP-0008 (Evaluator, golden datasets via the `dataset` label, QualityGates with selectors and `minScore`, Evaluations with measurement/trace Evidence) |
| `deployments/`, `observations/`, `issues/` | PP-0010 (canary strategy, rollback as a recorded outcome, telemetry → incident → Issue → Task loop) |

## Notes and conventions

- One representative approval Decision (`dec-approve-spec-payments`) is
  included; in a real product every `proposed → approved` transition
  gets its own Decision record (PP-0002 §6.2).
- All refs resolve within this tree; timestamps are causally ordered
  May–July 2026.
