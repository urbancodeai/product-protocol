# Changelog

All notable changes to the Product Protocol specification are documented
here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions refer to the **protocol version** (the `pp` field), governed per
[GOVERNANCE.md](GOVERNANCE.md#versioning).

## [Unreleased]

## [0.1.0] — 2026-07-03

Initial public draft of the Product Protocol specification.

### Added

- **Process**: PP document template and process (PP-0000, `pp/README.md`);
  governance, contributing guide, code of conduct, roadmap.
- **PP-0001** *Vision and Scope* — the autonomous engineering loop, scope
  boundary, vendor-neutrality invariants.
- **PP-0002** *Core Concepts and Object Model* — object envelope,
  identity, references, SemVer object versioning, governed-object
  lifecycle with human-only approvals, append-only records, Git storage
  binding (`.product/` tree), `x-` extension mechanism, `Product` kind.
- **PP-0003** *Product Brain* — structured product knowledge store:
  purpose, ownership, knowledge categories, Decision records, knowledge
  graph, synchronization.
- **PP-0004** *Product Specification* — Goal, Capability, Specification,
  Feature, Story kinds; requirements, personas, UX artifacts and HTML
  prototypes, business rules, acceptance criteria, constraints.
- **PP-0005** *Product Constitution* — Articles, categories (security,
  performance, accessibility, compliance, architecture, coding
  standards, UX, reliability), enforcement bindings, amendment process.
- **PP-0006** *Task Graph and Planning* — Task kind and lifecycle,
  dependency DAG, decomposition, priority, scheduling, allocation,
  Planner contract.
- **PP-0007** *Worker Protocol* — worker declaration, task claim
  protocol, execution context, Artifacts, completion criteria,
  evaluation hooks.
- **PP-0008** *Evaluation System* — Evaluator contract, GoldenTest and
  golden datasets, Evaluation records, scores, Evidence, quality gates,
  traceability.
- **PP-0009** *Knowledge Protocol* — knowledge ingestion, retrieval,
  update, linking, validation, versioning operations.
- **PP-0010** *Runtime* — end-to-end execution lifecycle, environments,
  deployments, observations, issues, human approval surface, learning
  loop.
- **Reference** — glossary, terminology and conformance classes, object
  model, design principles.
- **Schemas** — JSON Schema (2020-12) for the envelope and all core
  kinds under `schemas/`.
- **Examples** — four complete informative example products:
  `ecommerce`, `saas`, `mobile`, `api`.
- **Docs & diagrams** — architecture overview, concept guides,
  tutorials, decision records, Mermaid diagram sources.
- **Reference Architecture v1** (`reference-architecture/`, informative)
  — a complete opinionated implementation blueprint: Obsidian vault and
  Graphiti-style knowledge graph over the Product Brain, Claude Code
  worker sessions on Kubernetes, Linear execution mirror, GitHub +
  Actions evaluation pipeline, MCP context layer, 13-role agent
  architecture, and CLAUDE.md layering conventions.

[Unreleased]: https://github.com/urbancodeai/product-protocol/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/urbancodeai/product-protocol/releases/tag/v0.1.0
