# Example: Pulseboard — a team analytics SaaS

A complete, validating `.product/` tree (per
[PP-0002 §7](../../pp/PP-0002-core-concepts.md)) for **pulseboard**, a
multi-tenant team analytics SaaS: shared dashboards, integrations that
pull data in and push digests out, and per-workspace usage insights,
with plan-based feature gating.

## Scenario

Users are confused by dashboard sharing (`obs-feedback-share-confusion`)
and trial data shows sharing drives upgrades
(`know-trial-upgrade-trigger`). A dashboard-sharing capability is
specified — link sharing, plan-gated external access, and a weekly
Slack digest — approved (`dec-2026-06-06-approve-share-story`), planned
into a task DAG, and shipped through gated deployments. A share-scope
leak found in evaluation becomes an Issue and a hard `lesson` in the
Brain (`know-share-scope-lesson`); a Slack webhook outage exercises the
incident path.

## What this example demonstrates (SaaS flavor)

- **Multi-tenancy as law** — the Constitution makes tenant isolation a
  blocking security article, continuously verified by the
  `golden-tenant-isolation` test wired into both gates (PP-0005,
  PP-0008 §9).
- **Plan-based feature gating as business rules** — the Specification's
  `businessRules` drive `story-share-plan-gating`, whose acceptance
  criteria bind to golden tests (PP-0004).
- **Architecture decisions with rationale** — row-level security chosen
  in `dec-2026-05-18-postgres-rls`, linked from technical Knowledge
  (`know-tenant-isolation-blast-radius`) (PP-0003 §7).
- **Integration reliability** — Slack rate limits captured as
  Knowledge, webhook failures as an Observation → Issue chain feeding
  replanning (PP-0006 §8, PP-0010).
- **Performance budgets** — a dashboard-load NFR budget checked by a
  scored performance Evaluation (PP-0008 §10).
- **UX prototype binding** — the Specification references
  [`prototypes/dashboard-share.html`](./prototypes/dashboard-share.html).

## Tree

```
.product/
├── product.yaml
├── brain/            # brain.yaml + 5 knowledge + 3 decisions
├── specification/    # 2 goals, 2 capabilities, 1 spec, 2 features, 3 stories
├── constitution/     # pulseboard constitution
├── tasks/            # 4-task DAG + artifacts/
├── workers/          # 1 agent + 1 human
├── evaluation/       # evaluators/, golden/ (3), gates/ (2), runs/ (3)
├── deployments/      # superseded + active production deployments
├── observations/     # load metrics, share confusion, webhook outage
└── issues/           # share-scope leak, webhook failures
prototypes/           # dashboard-share.html (informative UX mock)
```

Every object validates against the schemas in [`schemas/`](../../schemas/)
(`node scripts/validate-examples.mjs`), and every ref resolves within
the tree. All content is informative (see
[terminology](../../reference/terminology.md)).
