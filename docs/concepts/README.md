# Concept Guides

*(Informative. The normative definitions live in the PP documents and
schemas cited from each guide; nothing here adds or changes
requirements.)*

One guide per Product Protocol object kind. Each guide explains what
the kind is (and is not), what it is responsible for, how it moves
through its lifecycle, what creates and consumes it, how it relates to
the other kinds, and what a complete object looks like on disk. For
the authoritative kind index, relationships, and state machines, see
the [object model](../../reference/object-model.md); for terms, the
[glossary](../../reference/glossary.md).

Kinds are grouped below by the layers of the
[object model kind index](../../reference/object-model.md#2-kind-index).

## Identity

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Product` | [product.md](./product.md) | The root object; a software product under autonomous management | [PP-0002](../../pp/PP-0002-core-concepts.md) |

## Intent

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Goal` | [goal.md](./goal.md) | A measurable business or user outcome the Product pursues | [PP-0004](../../pp/PP-0004-product-specification.md) |
| `Capability` | [capability.md](./capability.md) | A durable ability the Product offers in service of Goals | [PP-0004](../../pp/PP-0004-product-specification.md) |

## Definition

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Specification` | [specification.md](./specification.md) | Structured, versioned statement of what to build | [PP-0004](../../pp/PP-0004-product-specification.md) |
| `Constitution` | [constitution.md](./constitution.md) | Immutable, continuously evaluated product rules | [PP-0005](../../pp/PP-0005-product-constitution.md) |
| `Feature` | [feature.md](./feature.md) | A coherent unit of user-facing functionality within a Capability | [PP-0004](../../pp/PP-0004-product-specification.md) |
| `Story` | [story.md](./story.md) | A narrow, testable slice of a Feature with acceptance criteria | [PP-0004](../../pp/PP-0004-product-specification.md) |

## Execution

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Task` | [task.md](./task.md) | The atomic unit of schedulable work | [PP-0006](../../pp/PP-0006-task-graph.md) |
| `Worker` | [worker.md](./worker.md) | An actor (agent or human) that executes Tasks under the worker contract | [PP-0007](../../pp/PP-0007-worker-protocol.md) |
| `Planner` | [planner.md](./planner.md) | The actor that decomposes intent into the Task Graph | [PP-0006](../../pp/PP-0006-task-graph.md) |
| `Artifact` | [artifact.md](./artifact.md) | A content-addressed output produced by a Task | [PP-0007](../../pp/PP-0007-worker-protocol.md) |

## Quality

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Evaluator` | [evaluator.md](./evaluator.md) | The actor that judges work against criteria and Constitutions | [PP-0008](../../pp/PP-0008-evaluation.md) |
| `Evaluation` | [evaluation.md](./evaluation.md) | The recorded outcome of an evaluation run, with Evidence | [PP-0008](../../pp/PP-0008-evaluation.md) |
| `GoldenTest` | [golden-test.md](./golden-test.md) | A canonical, versioned scenario the Product must always satisfy | [PP-0008](../../pp/PP-0008-evaluation.md) |
| `QualityGate` | [quality-gate.md](./quality-gate.md) | A named predicate over Evaluations that gates a transition | [PP-0008](../../pp/PP-0008-evaluation.md) |

## Operation

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `Deployment` | [deployment.md](./deployment.md) | A release of Artifacts into an environment | [PP-0010](../../pp/PP-0010-runtime.md) |
| `Observation` | [observation.md](./observation.md) | A telemetry-derived fact about the running Product | [PP-0010](../../pp/PP-0010-runtime.md) |
| `Issue` | [issue.md](./issue.md) | A tracked defect, risk, or anomaly requiring resolution | [PP-0006](../../pp/PP-0006-task-graph.md), [PP-0010](../../pp/PP-0010-runtime.md) |

## Knowledge

| Kind | Guide | One-line definition | Specification |
| --- | --- | --- | --- |
| `ProductBrain` | [product-brain.md](./product-brain.md) | The structured knowledge store of a Product | [PP-0003](../../pp/PP-0003-product-brain.md) |
| `Knowledge` | [knowledge.md](./knowledge.md) | A single validated unit of product knowledge | [PP-0003](../../pp/PP-0003-product-brain.md), [PP-0009](../../pp/PP-0009-knowledge-protocol.md) |
| `Decision` | [decision.md](./decision.md) | An immutable record of a choice, its context, and its authority | [PP-0003](../../pp/PP-0003-product-brain.md) |

## Reading the guides

The examples in these guides describe one running product — *Aurora
Books*, the same fictional bookstore used throughout the PP documents —
so objects on different pages reference each other the way a real
`.product/` tree would. Every example is a complete object with its
full envelope, valid against the kind's JSON Schema under
[`schemas/`](../../schemas/).
