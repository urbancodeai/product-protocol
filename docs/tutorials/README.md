# Tutorials

Hands-on walkthroughs of Product Protocol, in order. All four follow
one running example: **Notely**, a small note-taking web app for
teams, whose `.product/` tree you build up by hand from an empty
repository to one full turn of the autonomous engineering loop.

Everything here is informative. The normative sources are the
specifications in [`pp/`](../../pp/README.md) and the JSON Schemas in
[`schemas/`](../../schemas/README.md); where a tutorial states a rule,
it links the document that actually requires it.

## The tutorials

| # | Tutorial | You will |
| --- | --- | --- |
| 1 | [Your first Product](./01-getting-started.md) | Bootstrap a valid `.product/` tree by hand — Product, Brain, a Goal, a Knowledge item — and validate it against the schemas. |
| 2 | [From intent to approved Story](./02-writing-a-specification.md) | Distill a conversation into a Capability, a Feature, two Stories with acceptance criteria, and a Specification, then walk the governed lifecycle to a human-approved version. |
| 3 | [Rules that always hold](./03-defining-a-constitution.md) | Write a five-article Constitution with enforcement bindings, see what a violation produces, and amend it the only way it can be amended. |
| 4 | [One turn of the loop, by hand](./04-running-the-loop.md) | Play planner, worker, and evaluator yourself: Tasks, a claim, an Artifact, an Evaluation with evidence, a gate check, a Deployment, an Observation, and a lesson back into the Brain. |

Each tutorial ends with a tree you can diff against, and every YAML
snippet validates against the schemas as written.

## Prerequisites

- A Git repository to work in (any project; the tree lives in
  `.product/` beside your code).
- A text editor that is comfortable editing YAML.
- Node.js 18+ for schema validation with `ajv` (tutorial 1 shows the
  exact commands; nothing else is installed).
- A local checkout of this repository, for the schemas.

No runtime, agent framework, or vendor tool is required — that is the
point. The protocol is files; the tutorials are you writing them.

## Where to go next

- [`examples/`](../../examples) — complete example products
  (ecommerce, saas, mobile, api) to compare your tree against.
- [`pp/`](../../pp/README.md) — the numbered specifications. Start
  with [PP-0001](../../pp/PP-0001-vision.md) for scope and
  [PP-0002](../../pp/PP-0002-core-concepts.md) for the object model
  the tutorials lean on constantly.
- [`docs/concepts/`](../concepts/) — one guide per object kind.
- [`reference/glossary.md`](../../reference/glossary.md) — the
  authoritative vocabulary.
