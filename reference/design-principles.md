# Design Principles

**Status:** Draft · **Version:** 0.1.0

These principles guide every design decision in Product Protocol. They are
**informative**, but a proposed change that violates one of them carries a
high burden of justification (see [GOVERNANCE](../GOVERNANCE.md)).

## P1. Implementation Agnostic

The protocol defines **interfaces and contracts**, never implementations.
No specification may require a particular model provider, agent framework,
issue tracker, code host, orchestrator, or editor. Named products may
appear only in informative text as examples of *possible* implementations.

## P2. Vendor Neutral

No conformance requirement may be satisfiable only by a single vendor's
product. Extension points (§P8) exist precisely so vendors can innovate
without forking the standard.

## P3. AI-Native, Human-Governed

The protocol assumes autonomous agents are the primary *executors* and
humans are the primary *governors*. Objects are designed to be produced and
consumed by machines, while approval authority over Goals, Specifications,
Constitutions, and architectural Decisions rests with humans (PP-0010 §7).
Agents MUST NOT modify approved objects directly; they propose changes.

## P4. Git-Native

The canonical storage binding is a version-controlled file tree. Every
object is a plain-text file; every state change is a commit; history is the
audit log. Implementations MAY offer other storage backends, but MUST be
able to round-trip through the Git binding (PP-0002 §7) without loss.

## P5. Human Readable, Machine Readable

Every artifact is simultaneously readable by a person in a text editor and
parseable by a machine without heuristics. Concretely: Markdown for prose,
YAML for objects, JSON Schema for validation. If a document cannot be
diffed meaningfully in a code review, it does not belong in the protocol.

## P6. Everything Traceable

Every Task traces to a Story or Feature; every Feature traces to a
Capability and Goal; every Artifact traces to the Task that produced it;
every Evaluation traces to the evidence that justifies its score. A
conformant system can answer "why does this exist?" for any object by
following references.

## P7. Evaluation Is Not Optional

Work without evidence is not done. The protocol treats evaluation as a
first-class phase of the loop, not a bolt-on. Quality gates and
Constitution checks are continuously evaluated, and Evaluations produce
durable, inspectable Evidence.

## P8. Extensible by Default

Every object carries `metadata.labels`, `metadata.annotations`, and an
`x-` extension namespace in its body. Unknown `x-` fields MUST be
preserved by conformant implementations (PP-0002 §8). New object kinds and
conformance classes are added through the PP process, not by overloading
existing ones.

## P9. Versioned Everything

The protocol is versioned; every object is versioned; every Specification,
Constitution, and Knowledge item is versioned. Approved versions are
immutable — change means a new version, never an edit in place.

## P10. Small Core, Sharp Edges

The core object model stays minimal. Anything that can live in an
extension, a profile, or an implementation SHOULD stay out of the core.
Where the core does specify behavior, it specifies it precisely enough
that two independent implementations interoperate.

## P11. Progressive Conformance

Adopters should get value from the first document they write. Conformance
classes ([terminology §4](./terminology.md#4-conformance-classes)) let a
team adopt the Specification format alone, or the full autonomous runtime,
without an all-or-nothing cliff.

## P12. Failure Is Data

Rejected evaluations, failed deployments, and reverted decisions are
recorded as Observations and Knowledge, not deleted. The learning loop
(PP-0010 §8) depends on an honest record.
