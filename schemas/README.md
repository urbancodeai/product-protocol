# Product Protocol Schemas

**Normative.** JSON Schemas (draft 2020-12) for every core object kind.
An object is schema-valid when it validates against
`common/envelope.schema.json` **and** the kind-specific schema for its
`kind`. Schemas validate the YAML documents after parsing to the JSON
data model (PP-0002 §1).

## Layout

```
common/          Envelope, metadata, ref, shared value types
specification/   Goal, Capability, Specification, Feature, Story
constitution/    Constitution
evaluation/      Evaluator, Evaluation, GoldenTest, QualityGate
task/            Task, Planner, Issue
worker/          Worker, Artifact
deployment/      Deployment, Environment, Observation
knowledge/       ProductBrain, Knowledge, Decision
product/         Product
```

## Conventions

- `$id`: `https://productprotocol.org/schemas/<domain>/<name>.schema.json`
- One kind per file, named `<kind-kebab>.schema.json`.
- Kind schemas constrain `kind` (const) and `spec`; the envelope schema
  owns `pp`, `metadata`, and the top-level shape.
- `additionalProperties: false` on `spec` objects, with
  `patternProperties` admitting `^x-` extension fields (PP-0002 §8).
- Enum values are `snake_case`; field names are `camelCase`.
- Schemas are normative; on conflict with specification prose, the
  prose of the defining PP prevails and the schema has a bug — file it.

## Validating

Any JSON Schema 2020-12 validator works. Example (Node.js):

```bash
npx --yes ajv-cli@5 validate --spec=draft2020 \
  -r "schemas/common/common.schema.json" \
  -s "schemas/task/task.schema.json" \
  -d "examples/ecommerce/.product/tasks/*.yaml"
```

CI validates every example object in `examples/**/.product/` against the
schema for its `kind`.
