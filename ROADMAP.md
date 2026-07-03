# Roadmap

*(Informative. Dates are aspirations, not commitments; the
[GOVERNANCE](GOVERNANCE.md) process decides actual releases.)*

## Now — Protocol 0.1 (initial public draft)

The current repository. Goals:

- [x] Core object model, envelope, Git binding (PP-0002)
- [x] Draft specifications PP-0001 through PP-0010
- [x] JSON Schemas for all core kinds
- [x] Four complete example products (ecommerce, saas, mobile, api)
- [x] Glossary, object model, design principles
- [ ] Public review: solicit issues from implementers and product teams
- [ ] Schema validation CI hardening (all examples, all schemas)

## Next — Protocol 0.2

Driven by review feedback. Candidate items:

- **Conformance test suite** — machine-runnable vectors per conformance
  class (import/export round-trip, lifecycle enforcement, gate
  evaluation).
- **Canonical serialization & signing** — deterministic object digests;
  signed Decisions and Evaluations for verifiable approvals/evidence.
- **Interchange API binding** — an optional HTTP binding for Task
  claiming and event streams, complementing the Git binding.
- **Amendment workflow detail** — richer change-proposal objects for
  governed-object evolution.
- **Registry** — process and namespace for extension kinds and
  knowledge/article categories.

## Later — Protocol 1.0

Requirements to declare 1.0:

- Every core PP at `Accepted` or better; PP-0002 at `Stable`.
- Two independent implementations passing the conformance suite for
  PP/Core, PP/Spec, PP/Worker, and PP/Evaluator.
- At least one full PP/Runtime implementation operating a real product.
- Compatibility policy in effect: no breaking changes without a MAJOR
  bump and migration notes.

## Exploratory *(no commitment)*

- Profiles for regulated domains (healthcare, finance) built on
  PP-0005 constitutions.
- Multi-product portfolios and cross-product knowledge sharing.
- Standard telemetry semantic conventions mapping into Observations.
- Human-interface conversation transcript preservation as evidence.

## How to influence this roadmap

Open an issue describing your use case. Implementations reports carry the
most weight — the fastest way to move an item up is to build against the
draft and tell us where it hurts.
