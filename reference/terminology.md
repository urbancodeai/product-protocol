# Terminology and Conformance Language

**Status:** Draft · **Version:** 0.1.0 · **Applies to:** all Product Protocol documents

This document defines how Product Protocol (PP) documents use language, and
the conformance classes against which implementations are measured. It is
**normative** for every document in this repository.

## 1. Requirement Keywords

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL
NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**,
**MAY**, and **OPTIONAL** in Product Protocol documents are to be
interpreted as described in [BCP 14][bcp14] ([RFC 2119][rfc2119],
[RFC 8174][rfc8174]) when, and only when, they appear in all capitals, as
shown here.

Lowercase uses of these words ("a planner should generally…") carry their
plain-English meaning and impose no conformance requirement.

## 2. Normative vs. Informative Content

Every PP document classifies its content:

- **Normative** content defines requirements. Implementations are
  conformant or non-conformant with respect to normative content only.
- **Informative** content provides context, rationale, examples, and
  guidance. It never adds, removes, or weakens requirements.

Rules:

1. Sections are normative by default unless labelled *(Informative)*.
2. The following are **always informative**, even inside normative
   sections: examples, example YAML/JSON, diagrams, footnotes, rationale
   callouts, and tutorials.
3. If informative text appears to conflict with normative text, the
   normative text prevails.
4. JSON Schemas under `schemas/` are **normative**. Example documents
   under `examples/` are **informative**.

## 3. Requirement Identifiers

Normative requirements in PP specification documents SHOULD be individually
identifiable using the pattern:

```
[PP-NNNN-RQ-KKK]
```

where `NNNN` is the specification number and `KKK` is a zero-padded
sequence number, e.g. `[PP-0006-RQ-004]`. Identifiers are stable: once
published, a requirement identifier MUST NOT be reused for a different
requirement, even if the original requirement is removed.

## 4. Conformance Classes

Product Protocol is modular. An implementation declares conformance to one
or more **conformance classes**. Each class is defined by the listed
specifications.

| Class | Description | Defining specifications |
| --- | --- | --- |
| **PP/Core** | Object model, envelope, identity, versioning, storage binding | PP-0002 |
| **PP/Brain** | Product Brain storage and knowledge organization | PP-0002, PP-0003, PP-0009 |
| **PP/Spec** | Specification authoring and lifecycle | PP-0002, PP-0004 |
| **PP/Constitution** | Constitution authoring and enforcement | PP-0002, PP-0005 |
| **PP/Planner** | Task decomposition and task-graph management | PP-0002, PP-0006 |
| **PP/Worker** | Task execution contract | PP-0002, PP-0006, PP-0007 |
| **PP/Evaluator** | Evaluation, quality gates, evidence | PP-0002, PP-0008 |
| **PP/Runtime** | Full autonomous engineering loop | All of the above, PP-0010 |

Conformance rules:

- An implementation claiming a class MUST satisfy every MUST/MUST NOT
  requirement of that class's defining specifications.
- `PP/Core` is REQUIRED for every other class.
- An implementation MAY claim any subset of classes; claiming `PP/Runtime`
  implies all other classes.

## 5. Defined Terms

Defined terms (e.g. *Task*, *Worker*, *Product Brain*) are capitalized when
used in their defined sense. The authoritative definitions live in the
[glossary](./glossary.md) and the [object model](./object-model.md). A PP
document MAY restate a definition for readability, but the glossary
prevails on conflict.

## 6. Versioning of the Protocol

The protocol as a whole carries a version (currently `0.1`), declared by
every PP object in its `pp` field. See PP-0002 §4 for the versioning and
compatibility rules, and [`VERSIONING`](../GOVERNANCE.md#versioning) in
governance for how protocol versions are ratified.

[bcp14]: https://www.rfc-editor.org/info/bcp14
[rfc2119]: https://www.rfc-editor.org/rfc/rfc2119
[rfc8174]: https://www.rfc-editor.org/rfc/rfc8174
