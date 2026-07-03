# Contributing to Product Protocol

Thank you for helping build an open standard. This repository contains a
**specification**, not software — contributions are documents, schemas,
examples, and diagrams. Decision authority is defined in
[GOVERNANCE.md](GOVERNANCE.md); community expectations in
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Ways to Contribute

- **Discuss** — open an issue with questions, use cases, or problems.
- **Fix** — editorial corrections and broken links; small PRs welcome
  without a prior issue.
- **Improve** — clarify informative docs, add examples, add diagrams.
- **Specify** — propose normative changes or new PP documents (see
  [the PP process](pp/README.md)). Open an issue first.
- **Implement** — build against the spec and report friction. Two
  independent implementations are required for any PP to reach `Stable`.

## Ground Rules for Specification Text

1. **Normative vs. informative is explicit.** Use BCP 14 keywords (MUST,
   SHOULD, MAY…) in capitals only for requirements, per
   [reference/terminology.md](reference/terminology.md). Examples,
   rationale, and tutorials are informative.
2. **Requirements are enumerable.** Every normative statement in a PP
   belongs in that document's *Normative Requirements* section with a
   stable `[PP-NNNN-RQ-KKK]` identifier. Never renumber or reuse one.
3. **Vendor neutrality.** No normative text may require a named vendor
   product ([PP-0001-RQ-001](pp/PP-0001-vision.md)). Vendors may be named
   in informative text only as examples.
4. **Schemas ship with specs.** A PR that defines or changes an object
   kind must update the JSON Schema under `schemas/` and at least one
   validating example under `examples/`.
5. **Glossary is authoritative.** New terms go in
   [reference/glossary.md](reference/glossary.md); reuse existing terms
   rather than coining synonyms.

## Repository Conventions

### Documents

- Markdown (CommonMark + GitHub tables), wrapped at ~78 columns for prose.
- One sentence per requirement where possible; number sections (§1, §2…)
  so they can be cited.
- Diagrams are Mermaid embedded in documents; editable sources live in
  `diagrams/`.
- Links between documents are relative paths.

### Files and naming

- PP documents: `pp/PP-NNNN-short-kebab-title.md`.
- Schemas: `schemas/<domain>/<kind-kebab>.schema.json`, JSON Schema
  draft 2020-12, `$id` of the form
  `https://productprotocol.org/schemas/<domain>/<kind>.schema.json`.
- Examples: `examples/<product>/.product/**` mirroring the Git binding
  in PP-0002 §7. Example objects must validate against the schemas.
- YAML: 2-space indent, no tabs, `snake_case` enum values, `camelCase`
  field names.

### Decision records

Significant decisions about *this repository or the protocol's design*
are recorded in `docs/decisions/` as ADRs
(`NNNN-short-title.md`). Propose one in your PR when a change settles a
contested question.

## Pull Request Checklist

- [ ] Issue reference (except trivial editorial fixes)
- [ ] Normative/informative language audited (capitals only where meant)
- [ ] Requirement IDs added/updated, none renumbered
- [ ] Schemas and examples updated together; examples validate
- [ ] Glossary and object model updated if terms or kinds changed
- [ ] CHANGELOG.md entry under *Unreleased* for normative changes

## Local Validation

Schema validation of all examples runs in CI. To run locally you need any
JSON Schema 2020-12 validator; for instance with Node.js:

```bash
npx --yes ajv-cli@5 validate --spec=draft2020 \
  -r "schemas/common/*.schema.json" \
  -s schemas/task/task.schema.json \
  -d "examples/*/.product/tasks/*.yaml"
```

## Certificate of Origin

By contributing you certify the
[Developer Certificate of Origin](https://developercertificate.org/) and
license your contribution under [Apache 2.0](LICENSE). Sign commits with
`git commit -s` if you wish to make the certification explicit.
