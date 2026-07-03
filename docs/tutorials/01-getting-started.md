# Tutorial 1 — Your first Product

*(Informative. Normative sources:
[PP-0002](../../pp/PP-0002-core-concepts.md) for the envelope, identity,
and the Git binding; [PP-0003](../../pp/PP-0003-product-brain.md) for the
Brain; [PP-0004](../../pp/PP-0004-product-specification.md) for Goals;
[PP-0005](../../pp/PP-0005-product-constitution.md) for Constitutions.)*

In this tutorial you bootstrap a Product Protocol tree by hand inside
an existing repository. The running example is **Notely**, a small
note-taking web app for teams. At the end you have a `.product/`
directory that validates against the schemas: a Product, its Brain, a
first Goal, a bootstrap Constitution, and one Knowledge item.

You need a Git repository (Notely's application code, or any project),
a YAML editor, Node.js for validation, and a local checkout of the
product-protocol repository. Set an environment variable pointing at
that checkout; the validation step uses it:

```bash
export PP=~/src/product-protocol   # adjust to your checkout
```

## 1. Create the tree

Everything lives under `.product/` at the repository root — that name
and layout are fixed by the Git storage binding (PP-0002 §7), which is
what lets any conformant tool find and read your Product.

```bash
mkdir -p .product/brain/knowledge .product/brain/decisions \
         .product/specification .product/constitution
```

## 2. The Product object — and the envelope

Every PP object is one YAML document with the same five-field envelope
(PP-0002 §3). Write the root object first, as
`.product/product.yaml`:

```yaml
pp: "0.1"
kind: Product
metadata:
  id: notely
  name: Notely
  version: 1.0.0
  createdAt: "2026-07-03T09:00:00Z"
  updatedAt: "2026-07-03T09:00:00Z"
  owners:
    - { type: human, id: alex@notely.dev, name: Alex Rivera }
spec:
  summary: >
    Notely is a note-taking web app for small teams: capture notes
    during meetings, organize them into shared spaces, and share
    individual notes with teammates by link.
  brain: { ref: { kind: ProductBrain, id: notely-brain } }
  constitutions:
    - ref: { kind: Constitution, id: notely-constitution }
  goals:
    - ref: { kind: Goal, id: goal-team-adoption }
  environments:
    - name: staging
      classification: pre_production
    - name: production
      classification: production
  repositories:
    - { name: main, uri: "https://git.example.com/notely/notely.git", role: source }
```

Reading the envelope top to bottom:

- **`pp`** — the protocol version this object conforms to, as
  `"MAJOR.MINOR"`. Quote it: unquoted, YAML would parse `0.1` as a
  number, and the schema requires a string.
- **`kind`** — the registered kind name. It decides which schema the
  `spec` must satisfy.
- **`metadata`** — identity and lifecycle. `id` is the stable
  identifier (lowercase, digits, hyphens), unique per kind within the
  Product; `version` is SemVer and changes when the object's meaning
  does; `owners` are the accountable actors. The full identity of any
  object is `(product, kind, id, version)` — file paths are just a
  projection, never identity (PP-0002 §7).
- **`spec`** — the kind-specific body: what you declare.
- **`status`** — observed state, written only by a managing
  implementation. You will not write `status` in this tutorial;
  consumers must tolerate its absence.

Only these five top-level fields are allowed. Note the timestamps are
quoted: PP-0002 §1 makes timestamps RFC 3339 *strings*, and quoting
keeps YAML parsers from turning them into native date values.

The `spec` refs (`brain`, `constitutions`, `goals`) point at objects
you have not written yet. Dangling references are validation errors
(PP-0002 §5), so the next steps create every target. The
`environments` list matters later, in tutorial 4, when a Deployment
must name a declared environment.

## 3. The Product Brain

The Brain is the Product's memory: Knowledge and Decisions, rooted in
one `ProductBrain` object, created at bootstrap so the very first
conversations have somewhere to distill into (PP-0003 §1). Write
`.product/brain/brain.yaml`:

```yaml
pp: "0.1"
kind: ProductBrain
metadata:
  id: notely-brain
  name: Notely Product Brain
  version: 1.0.0
  lifecycle: active
  createdAt: "2026-07-03T09:05:00Z"
spec:
  summary: >
    Knowledge store for Notely: how small teams capture and share
    notes, sharing and permission rules, architecture commitments,
    and lessons from operating the product.
  retention:
    reviewInterval: P90D
```

`retention.reviewInterval` is a hint (an ISO 8601 duration): Knowledge
not reviewed within 90 days should be flagged stale — flagged, never
auto-deleted (PP-0003 §5).

## 4. A first Goal

A Goal states a measurable outcome — the *why* above everything else.
Goals are **governed objects** (PP-0002 §6.2): they carry
`metadata.lifecycle` and move `draft → proposed → approved` with a
human recording the approval. Yours starts life as a `draft`. Write
`.product/specification/goal-team-adoption.yaml`:

```yaml
pp: "0.1"
kind: Goal
metadata:
  id: goal-team-adoption
  name: Teams keep using Notely weekly
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-03T09:10:00Z"
  owners:
    - { type: human, id: alex@notely.dev, name: Alex Rivera }
spec:
  statement: >
    Teams that try Notely should still be using it a month later.
    Grow the number of teams active in a given week.
  metric:
    name: weekly_active_teams
    description: Teams with at least three note edits or shares in a week.
    unit: teams
    baseline: 4
    target: 25
    direction: increase
  timeframe: 2026-Q4
  rationale: >
    Retention, not signups, is the constraint: pilot teams sign up
    readily but drift back to chat threads within weeks.
```

The metric's `name`, `target`, and `direction` are required
(PP-0004 §3): later, Observations from the running product are read
against exactly this target. Tutorial 2 walks this object — and its
siblings — through the approval lifecycle.

## 5. A bootstrap Constitution

The Product schema requires at least one entry in
`spec.constitutions`, and refs must resolve, so a brand-new tree needs
a Constitution object from day one. Start with the smallest honest
one: a single secrets rule. Write
`.product/constitution/notely-constitution.yaml`:

```yaml
pp: "0.1"
kind: Constitution
metadata:
  id: notely-constitution
  name: Notely Constitution
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-03T09:15:00Z"
  owners:
    - { type: human, id: alex@notely.dev, name: Alex Rivera }
spec:
  articles:
    - id: SEC-1
      category: security
      rule: >
        Secrets, credentials, and API keys MUST NOT appear in source
        code, files under version control, or logs.
      enforcement:
        mode: blocking
        evaluatedOn: [task_submission, deployment]
```

A `draft` Constitution binds nothing — only approved versions are in
force (PP-0005 §2.3). Tutorial 3 grows this draft into a real
constitution and approves it.

## 6. A first Knowledge item

Record what you already know. Each Knowledge object is one claim, with
a category, a confidence level, and provenance — all three required
(PP-0003 §3). Write
`.product/brain/knowledge/know-meeting-capture.yaml`:

```yaml
pp: "0.1"
kind: Knowledge
metadata:
  id: know-meeting-capture
  name: Notes are captured in meetings and shared right after
  version: 1.0.0
  createdAt: "2026-07-03T09:20:00Z"
spec:
  category: user
  subcategory: behavior
  statement: >
    Pilot teams capture most notes during meetings and want to share
    them with absent teammates immediately afterwards; friction at
    that sharing moment decides whether the team keeps using the app.
  confidence: hypothesis
  provenance:
    - type: conversation
      description: Founder interviews with two pilot teams, 2026-07-01.
  links:
    - rel: relates_to
      target: { ref: { kind: Goal, id: goal-team-adoption } }
```

`confidence: hypothesis` is where uncorroborated claims enter the
trust ladder (PP-0003 §4); telemetry can later promote it. The
`links` entry puts the claim into the Knowledge Graph, tied to the
Goal it informs.

## 7. Validate

Adapt the validator invocation from
[CONTRIBUTING](../../CONTRIBUTING.md) to point at the spec checkout's
schemas and your own tree. Install once, then validate each file
against its kind's schema:

```bash
npm install --no-save ajv-cli@5 ajv-formats@3

npx ajv validate --spec=draft2020 --strict=false -c ajv-formats \
  -r "$PP/schemas/common/*.schema.json" \
  -s "$PP/schemas/product/product.schema.json" \
  -d ".product/product.yaml"
```

Repeat with the matching schema for each file —
`knowledge/product-brain.schema.json`, `specification/goal.schema.json`,
`constitution/constitution.schema.json`,
`knowledge/knowledge.schema.json`. Two flags differ from the
CONTRIBUTING one-liner, deliberately: `-c ajv-formats` teaches ajv the
`date-time` and `uri` formats the schemas use, and `--strict=false`
matches how the repository's own CI compiles them. If a timestamp is
reported as `must be string`, it is unquoted in your YAML — see step 2.

Every file should print `valid`. Then commit:

```bash
git add .product
git commit -m "Bootstrap Product Protocol tree for Notely"
```

## The tree so far

```
.product/
├── product.yaml
├── brain/
│   ├── brain.yaml
│   ├── decisions/              (empty — first Decision in tutorial 2)
│   └── knowledge/
│       └── know-meeting-capture.yaml
├── constitution/
│   └── notely-constitution.yaml
└── specification/
    └── goal-team-adoption.yaml
```

Five objects, no tooling, and your repository now carries its own
definition. Next: turn a conversation into an approved Story in
[tutorial 2](./02-writing-a-specification.md).
