# Product

The root object: a software product under Product Protocol management,
anchoring identity, Goals, Brain, and Constitution set
([glossary](../../reference/glossary.md)).

## Definition

A `Product` is the single object at the root of a Product Protocol
tree. It declares what the product is (a one-paragraph summary), and
wires up the top-level machinery: the one
[ProductBrain](./product-brain.md), the active
[Constitution](./constitution.md) set, the top-level
[Goals](./goal.md), and optionally the environments and repositories
the product deploys to and lives in. Every other object in the tree
belongs to it implicitly — a tree contains exactly one `Product`
object ([PP-0002 §9](../../pp/PP-0002-core-concepts.md#9-the-product-kind)).

A Product is not a project plan, a repository, or a deployment. It is
an identity anchor: the stable thing that Goals, Specifications, Tasks,
and Observations are all *about*. File paths are a projection of it,
never its identity — consumers derive identity from object content
([PP-0002 §7](../../pp/PP-0002-core-concepts.md#7-git-storage-binding)).

## Responsibilities

- Anchor the fully qualified identity of every object in the tree
  (`pp://<product-id>/<kind>/<id>@<version>`,
  [PP-0002 §3.2](../../pp/PP-0002-core-concepts.md#32-identity)).
- Reference exactly one ProductBrain via `spec.brain`.
- List the active Constitutions via `spec.constitutions` (at least one
  once past bootstrap).
- List the top-level Goals via `spec.goals`.
- Declare deployment environments and associated repositories, when
  the runtime layer is in use
  ([PP-0010](../../pp/PP-0010-runtime.md)).

## Lifecycle

`Product` is not a governed object and has no state machine of its own
in protocol version 0.1 — the governed lifecycle of
[PP-0002 §6.2](../../pp/PP-0002-core-concepts.md#62-governed-objects)
and the work-object lifecycle of the
[object model §4](../../reference/object-model.md#4-lifecycles) both
list the kinds they cover, and `Product` is in neither list. In
practice the Product object is created at bootstrap (together with its
ProductBrain, [PP-0003 §1.3](../../pp/PP-0003-product-brain.md#13-lifecycle))
and lives as long as the product does; PP-0003 speaks of the Product
being archived, at which point its Brain is archived with it. The
Product object itself is versioned like any object
([PP-0002 §6.1](../../pp/PP-0002-core-concepts.md#61-object-versioning)):
rewiring a Constitution ref or adding an environment is a new
`metadata.version`.

## Inputs / Outputs

| Direction | What | From / To |
| --- | --- | --- |
| In | Human intent at bootstrap: name, summary, initial wiring | Human Interface ([PP-0010](../../pp/PP-0010-runtime.md)) |
| In | New refs as Goals, Constitutions, environments are added | Humans / agents drafting, humans approving referenced objects |
| Out | Root resolution for every `pp://` identity and Ref in the tree | All consumers and validators |
| Out | The active Constitution set to enforce | Evaluators ([PP-0008](../../pp/PP-0008-evaluation.md)), runtime ([PP-0010](../../pp/PP-0010-runtime.md)) |
| Out | Environment declarations | Deployments ([PP-0010](../../pp/PP-0010-runtime.md)) |

## Relationships

- Has exactly one [ProductBrain](./product-brain.md) via `spec.brain`
  ([PP-0002-RQ-015](../../pp/PP-0002-core-concepts.md#normative-requirements)).
- Activates one or more [Constitutions](./constitution.md) via
  `spec.constitutions`; only listed Constitutions bind
  ([PP-0005 §1](../../pp/PP-0005-product-constitution.md#1-overview-and-role)).
- Lists top-level [Goals](./goal.md) via `spec.goals`.
- Declares the environments that [Deployments](./deployment.md) target.
- Every other kind — [Specifications](./specification.md),
  [Tasks](./task.md), [Observations](./observation.md), … — belongs to
  exactly one Product ([object model §3](../../reference/object-model.md#3-relationships)).

## Example

`.product/product.yaml`:

```yaml
pp: "0.1"
kind: Product
metadata:
  id: aurora-books
  name: Aurora Books
  version: 1.2.0
  labels:
    domain: ecommerce
  owners:
    - { type: human, id: dana@example.com, name: Dana Ito }
  createdAt: 2026-05-01T09:00:00Z
  updatedAt: 2026-07-03T12:00:00Z
spec:
  summary: >
    Online bookstore with personalized recommendations and
    subscription-based reading clubs.
  brain: { ref: { kind: ProductBrain, id: aurora-brain } }
  constitutions:
    - ref: { kind: Constitution, id: aurora-constitution, version: ">=2.0.0" }
  goals:
    - ref: { kind: Goal, id: goal-checkout-conversion }
  environments:
    - name: staging
      classification: pre_production
    - name: production
      classification: production
  repositories:
    - { name: main, uri: "https://git.example.com/aurora/books.git", role: source }
```

## Where it's defined

- Specification: [PP-0002 §9 — The Product Kind](../../pp/PP-0002-core-concepts.md#9-the-product-kind)
- Schema: [`schemas/product/product.schema.json`](../../schemas/product/product.schema.json)
- Glossary: [Product](../../reference/glossary.md)
