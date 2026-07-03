# ADR-0001: YAML objects with a common envelope

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

The protocol needs a serialization for ~20 object kinds that is human
readable, machine validatable, diffable in code review, and familiar to
both product and platform engineers (design principles P4, P5). It also
needs a uniform outer shape so generic tooling (validators, indexers,
sync engines) can process any kind without kind-specific code.

## Options Considered

1. **YAML with a `pp`/`kind`/`metadata`/`spec`/`status` envelope** —
   familiar declarative-config shape; excellent diffs; JSON-compatible.
2. **Pure JSON** — simpler parsing, but hostile to hand-authoring and
   comments; noisy diffs.
3. **Markdown with front matter** — great for prose-heavy kinds, but
   validation of body content is heuristic, violating P5.
4. **A custom DSL** — maximum precision, but a new parser per language
   and a learning curve for every adopter.

## Decision

YAML 1.2 restricted to the JSON data model, with a fixed five-field
envelope (PP-0002 §3). Prose lives *inside* designated string fields
(Markdown permitted), giving prose-heavy kinds readability without
sacrificing schema validation. The envelope deliberately echoes
well-known declarative-config practice so the shape needs no training,
while remaining orchestrator-independent.

## Consequences

- One generic validator covers every kind (envelope + kind schema).
- Any YAML/JSON toolchain in any language can process objects.
- YAML footguns (implicit typing) are neutralized by restricting to the
  JSON data model and RFC 3339 timestamp *strings* (PP-0002 §1).
- Long prose in YAML strings is less pleasant than Markdown files; we
  accept this for validatability, and allow HTML/Markdown *prototype
  files* to live beside objects as referenced artifacts (PP-0004).

## References

- PP-0002 §1, §3; design principles P4, P5, P8.
