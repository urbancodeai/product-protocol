# Example Products

Four complete, fictional products managed under Product Protocol. Each
is a full `.product/` tree per the Git binding
([PP-0002 §7](../pp/PP-0002-core-concepts.md)) — product, brain,
specifications, constitution, task DAG, workers, evaluations with
evidence, deployments, observations, and issues — with a coherent
story told across the objects: intent arriving, approvals recorded,
work planned and executed, quality gated, incidents observed, lessons
learned.

Everything here is **informative** (see
[terminology §2](../reference/terminology.md)); the normative contracts
live in [`pp/`](../pp/) and [`schemas/`](../schemas/). But the examples
are machine-checked: CI validates every object against the envelope and
its kind schema, so they double as test vectors for the schemas.

| Example | Product | Flavor it demonstrates |
| --- | --- | --- |
| [`ecommerce/`](./ecommerce/) | **aurora-books** — online bookstore | The canonical example used throughout the spec documents: approved vs. proposed versions, human approval Decisions, a mid-turn loop |
| [`saas/`](./saas/) | **pulseboard** — team analytics | Multi-tenancy as constitutional law, plan-based business rules, performance budgets, integration incidents |
| [`mobile/`](./mobile/) | **trailkit** — hiking & fitness app | App-store release trains, offline-first NFRs, battery budgets, visual golden tests |
| [`api/`](./api/) | **brookpay** — payments API | Contract golden tests, latency/availability SLOs, cardholder-data handling rules, canary + rollback deployments |

## Validating

```bash
npm install --no-save ajv@8 ajv-formats@3 js-yaml@4
node scripts/validate-examples.mjs
```

The validator checks every YAML object under `examples/*/.product/`
against `schemas/common/envelope.schema.json` plus its kind schema, and
fails on unknown kinds. Run it after any edit to an example.

## Conventions

- Object ids, refs, enums, and timestamps follow the conventions of
  PP-0002 §3–§5; all refs resolve within their own tree.
- Governed objects carry `metadata.lifecycle`; approvals are recorded
  as Decisions with `spec.approves` pinning exact versions.
- HTML files under `<example>/prototypes/` are informative UX mocks
  referenced from each Specification's `ux.prototypes`
  (PP-0004 §2).
- Timelines are causally ordered (May–July 2026) so the history reads
  as a plausible product trajectory.
