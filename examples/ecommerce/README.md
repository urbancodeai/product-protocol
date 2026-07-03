# Example: Aurora Books — an online bookstore

A complete, validating `.product/` tree (per
[PP-0002 §7](../../pp/PP-0002-core-concepts.md)) for **aurora-books**,
an online bookstore with personalized recommendations and reading-club
subscriptions.

This is the *canonical* example: the fictional product used in examples
throughout the specification documents (PP-0001, PP-0002, the root
README) is this one, so the objects shown there — `story-guest-checkout`
at v1.0.0 approved and v1.1.0 proposed, `task-cart-model`,
`task-guest-checkout-api`, `golden-checkout-happy-path`,
`goal-checkout-conversion` — all exist here in full.

## Scenario

Checkout funnel data (`obs-funnel-2026-06`) and customer feedback show
guests abandoning carts when forced to create an account, and Brain
knowledge (`know-cart-abandon-shipping`, `know-early-price-transparency`)
explains why. A guest-checkout capability is specified, approved by a
human Decision (`dec-2026-06-10-guest-checkout`), planned into a
four-task DAG, implemented and evaluated, and shipped behind a gated
production deployment. Meanwhile a recommendations outage on July 1
becomes an Observation → Issue → lesson-Knowledge chain, and a proposed
amendment to the guest-checkout story (v1.1.0) waits in the approval
queue — showing the loop mid-turn.

## What this example demonstrates

- **Approved vs. proposed versions side by side** —
  `story-guest-checkout.yaml` (v1.0.0, `approved`, immutable) next to
  `story-guest-checkout@1.1.0.yaml` (`proposed`), per PP-0002 §6.2/§7.
- **Human approval on the record** — approval Decisions with
  `spec.approves` pinning exact versions (PP-0003 §7), including a
  constitution amendment (`dec-2026-06-20-constitution-v2-1`).
- **A real task DAG** — `task-cart-model` (done) →
  `task-guest-checkout-api` (in progress) → `task-guest-checkout-ui` /
  `task-confirmation-email`, with capability tags, context refs, and
  completion contracts (PP-0006).
- **Evidence-backed evaluation** — acceptance, constitution-audit, and
  performance Evaluations under `evaluation/runs/`, golden tests with a
  `dataset` label, and blocking gates for task acceptance and
  production promotion (PP-0008).
- **The learning loop** — telemetry, user feedback, and an incident as
  Observations; Issues raised and replanned; lessons distilled into
  Brain knowledge with provenance links (PP-0009, PP-0010 §8).
- **UX prototype binding** — the Specification's
  `ux.prototypes` references [`prototypes/guest-checkout.html`](./prototypes/guest-checkout.html),
  an informative HTML mock (PP-0004 §2).

## Tree

```
.product/
├── product.yaml
├── brain/            # brain.yaml + 5 knowledge + 3 decisions
├── specification/    # 2 goals, 2 capabilities, 1 spec, 2 features, 3+1 stories
├── constitution/     # aurora-constitution (8 articles)
├── tasks/            # 4-task DAG + artifacts/
├── workers/          # 1 agent + 1 human
├── evaluation/       # evaluators/, golden/ (3), gates/ (2), runs/ (3)
├── deployments/      # superseded + active production deployments
├── observations/     # funnel, feedback, incident
└── issues/           # cart-loss (resolved path), recs-timeouts (open)
prototypes/           # guest-checkout.html (informative UX mock)
```

Every object validates against the schemas in [`schemas/`](../../schemas/)
(`node scripts/validate-examples.mjs`), and every ref resolves within
the tree. All content is informative (see
[terminology](../../reference/terminology.md)).
