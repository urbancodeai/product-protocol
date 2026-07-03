# Glossary

**Status:** Draft · **Version:** 0.1.0 · **Normative**

Authoritative definitions of Product Protocol terms. Capitalized use of
these terms anywhere in this repository refers to these definitions. On
conflict with prose elsewhere, this glossary and the kind's own
specification prevail. See also the [object model](./object-model.md).

---

**Acceptance Criteria** — Machine-checkable and human-verifiable conditions
attached to a Story or Task that define when it is complete. (PP-0004 §7)

**Actor** — A participant in the loop: a Worker, Planner, Evaluator, or
Human. Actors are declared as objects but hold no work state.

**Approval** — A human authorization recorded as a Decision that moves a
governed object from `proposed` to `approved`. (PP-0010 §7)

**Artifact** — A content-addressed, immutable output of a Task: code
changeset, document, image, binary, report. Every Artifact references the
Task that produced it. (PP-0007 §6)

**Capability** — A durable ability the Product offers (e.g. "accept
payments"), serving one or more Goals and containing Features. (PP-0004 §4)

**Conformance Class** — A named subset of the protocol an implementation
may claim: PP/Core, PP/Brain, PP/Spec, PP/Constitution, PP/Planner,
PP/Worker, PP/Evaluator, PP/Runtime. (terminology.md §4)

**Constitution** — A versioned set of Articles: rules that hold for the
entire Product at all times, continuously evaluated, changeable only by
human-approved amendment. (PP-0005)

**Constitution Article** — A single rule within a Constitution, with a
category, a normative statement, and an enforcement binding. (PP-0005 §4)

**Decision** — An immutable record of a choice: context, options
considered, outcome, authority, and affected objects. Architecture
Decision Records are one profile of Decision. (PP-0003 §7)

**Deployment** — The act and record of releasing Artifacts into an
Environment, gated by Evaluations. (PP-0010 §6)

**Environment** — A named target where the Product runs (e.g.
`production`, `staging`). Declared per Product. (PP-0010 §6.1)

**Evaluation** — The recorded outcome of judging a subject against
criteria: score, verdict, Evidence, and traceability. Append-only.
(PP-0008)

**Evaluator** — The actor that performs Evaluations. May be automated,
agentic, or human. (PP-0008 §5)

**Evidence** — Durable, inspectable material attached to an Evaluation
that justifies its verdict: logs, screenshots, test output, traces,
measurements. (PP-0008 §8)

**Feature** — A coherent unit of user-facing functionality within a
Capability, decomposed into Stories. (PP-0004 §5)

**Goal** — A measurable business or user outcome with a metric and a
target, owned by humans. (PP-0004 §3)

**Golden Dataset** — A versioned collection of Golden Tests. (PP-0008 §6)

**Golden Test** — A canonical scenario, with fixed inputs and expected
outcomes, that the Product must always satisfy; regression armor for
autonomous change. (PP-0008 §6)

**Governed Object** — An object subject to the draft → proposed → approved
lifecycle and human approval: Goal, Capability, Specification,
Constitution, Feature, Story, GoldenTest. (object-model.md §4)

**Human Interface** — The conversational surface through which humans
express intent and grant approvals. The protocol constrains its contract,
not its form. (PP-0010 §7)

**Intent** — Unstructured human input (conversation, documents) from which
structured objects are derived. Intent itself is not an object; its
distillation is. (PP-0010 §4)

**Issue** — A tracked defect, risk, or anomaly, typically raised from
Observations or rejected Evaluations, resolved by replanning into Tasks.
(PP-0010 §6.4)

**Knowledge** — A single validated, versioned unit of product knowledge
with a category, confidence, provenance, and links. Lives in the Product
Brain. (PP-0003, PP-0009)

**Knowledge Graph** — The link structure over Knowledge, Decisions, and
other objects that makes the Product Brain navigable and queryable.
(PP-0003 §8)

**Object** — Any YAML document conforming to the PP envelope. (PP-0002 §3)

**Observation** — A telemetry-derived fact about the running Product
(metric reading, incident, user signal), append-only, feeding the learning
loop. (PP-0010 §6.3)

**Planner** — The actor that decomposes approved intent into the Task
Graph, maintains dependencies, priorities, and scheduling. (PP-0006)

**PP Document** — A numbered specification document (PP-0001…) in the
`pp/` directory, following the PP-0000 template and process.

**Product** — The root object: a software product under Product Protocol
management, anchoring identity, Goals, Brain, and Constitution set.
(PP-0002 §9)

**Product Brain** — The structured, versioned knowledge store of a
Product: Knowledge, Decisions, and their graph. Not documentation — the
machine-usable memory of the Product. (PP-0003)

**Quality Gate** — A named predicate over Evaluations that must pass
before a transition (e.g. Task acceptance, Deployment promotion) is
permitted. (PP-0008 §9)

**Specification** — The structured, versioned statement of what to build:
goals, requirements, UX, business rules, acceptance criteria, constraints.
(PP-0004)

**Story** — The narrowest governed unit of functionality: a testable slice
of a Feature with acceptance criteria, small enough to plan into Tasks.
(PP-0004 §6)

**Task** — The atomic unit of schedulable work, produced by a Planner,
executed by a Worker, judged by an Evaluator. (PP-0006)

**Task Graph** — The directed acyclic graph of Tasks and their
dependencies for a Product. (PP-0006 §4)

**Traceability** — The property that every object's existence and state
can be justified by following references to intent and evidence.
(design-principles.md P6)

**Worker** — An actor that claims and executes Tasks under the worker
contract: declared capabilities, bounded context, produced Artifacts,
completion criteria, evaluation hooks. (PP-0007)
