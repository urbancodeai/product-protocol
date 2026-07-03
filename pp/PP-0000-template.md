# PP-0000: Specification Template

| Field | Value |
| --- | --- |
| **PP** | 0000 |
| **Title** | Specification Template |
| **Status** | Living |
| **Authors** | Product Protocol Contributors |
| **Created** | 2026-07-03 |
| **Updated** | 2026-07-03 |
| **Version** | 0.1.0 |
| **Requires** | — |

## Abstract

*(2–5 sentences. What does this specification define, and why does it
exist? A reader must be able to decide from the abstract alone whether
this document is relevant to them.)*

This document is the template for all Product Protocol specification
documents. Copy it to `pp/PP-NNNN-short-title.md`, fill in every section,
and delete the italicized guidance. Sections marked *(Informative)* never
carry requirements; all other sections are normative by default (see
[terminology](../reference/terminology.md)).

## Motivation *(Informative)*

*(Why is this specification needed? What breaks or fragments without it?
What prior art exists? Motivation is informative: it explains, it does not
require.)*

## Terminology

*(List the defined terms this document introduces or relies on. Link each
to the [glossary](../reference/glossary.md). Then include the BCP 14
boilerplate below verbatim.)*

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL
NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**,
**MAY**, and **OPTIONAL** in this document are to be interpreted as
described in BCP 14 [RFC 2119] [RFC 8174] when, and only when, they appear
in all capitals, as shown here.

## Specification

*(The body. Define the objects, fields, state machines, and behaviors.
Structure with numbered subsections (§1, §2, …) so other documents can
cite them. For each object kind defined here, cover: Definition,
Responsibilities, Lifecycle (with state diagram), Inputs, Outputs,
Relationships, and a schema reference. Use Mermaid for diagrams. Field
tables use this form:)*

| Field | Type | Req | Description |
| --- | --- | --- | --- |
| `spec.example` | string | MUST | *(what it means, constraints)* |

## Normative Requirements

*(Enumerate every requirement as a stable, citable identifier. This
section is the conformance checklist; the Specification section is its
explanation. Never renumber a published requirement.)*

- **[PP-NNNN-RQ-001]** An implementation MUST …
- **[PP-NNNN-RQ-002]** A Worker SHOULD …
- **[PP-NNNN-RQ-003]** A Planner MAY …

## Examples *(Informative)*

*(At least one complete, valid YAML example per object kind defined. Each
example MUST validate against the corresponding schema in `schemas/` —
CI treats examples as test vectors even though their content is
informative.)*

```yaml
pp: "0.1"
kind: Example
metadata:
  id: example-1
  version: 1.0.0
spec: {}
```

## Security Considerations

*(Every PP document has this section, even if only to state "This
specification introduces no new security considerations beyond PP-0002."
Consider: prompt-injection surfaces, privilege boundaries between actors,
secrets in objects, integrity of evidence, supply-chain of artifacts.)*

## Future Work *(Informative)*

*(Known gaps deliberately left open, with pointers to issues or draft
PPs.)*

## References

*(Normative references first — documents an implementer must read to
conform — then informative references.)*

- [PP-0002 — Core Concepts and Object Model](./PP-0002-core-concepts.md)
- [BCP 14 / RFC 2119 / RFC 8174](https://www.rfc-editor.org/info/bcp14)

---

## Template Rules (normative for authors)

- **[PP-0000-RQ-001]** Every PP document MUST contain all of the sections
  above, in this order: header table, Abstract, Motivation, Terminology,
  Specification, Normative Requirements, Examples, Security
  Considerations, Future Work, References.
- **[PP-0000-RQ-002]** The header table MUST include: PP number, Title,
  Status, Authors, Created, Updated, Version, Requires.
- **[PP-0000-RQ-003]** Status MUST be one of: `Draft`, `Review`,
  `Accepted`, `Stable`, `Deprecated`, `Superseded`, `Living`.
- **[PP-0000-RQ-004]** Requirement identifiers MUST follow
  `[PP-NNNN-RQ-KKK]` and MUST NOT be reused or renumbered after
  publication.
- **[PP-0000-RQ-005]** All diagrams SHOULD be Mermaid embedded in the
  document; exported/editable sources live in `diagrams/`.
- **[PP-0000-RQ-006]** Every YAML example MUST validate against its schema
  under `schemas/`.
