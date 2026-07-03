# Governance

This document defines how the Product Protocol specification is governed:
who decides what, and how decisions are made and recorded. It applies to
this repository only; it does not govern implementations.

## Roles

| Role | Description | How obtained |
| --- | --- | --- |
| **Contributor** | Anyone who opens issues or pull requests. | Participate. |
| **Reviewer** | Regular contributors trusted to review PRs in a given area. | Nominated by a maintainer; lazy consensus of maintainers. |
| **Maintainer** | Stewards of the specification; merge authority; PP status transitions. | Nominated by a maintainer; two-thirds vote of maintainers. |
| **Editor** | A maintainer responsible for a specific PP document's consistency and requirement numbering. | Assigned per document by maintainers. |

Maintainers are listed in [`.github/CODEOWNERS`](.github/CODEOWNERS).
Maintainers may resign at any time and may be removed for sustained
inactivity (6+ months) or Code of Conduct violations by a two-thirds vote
of the other maintainers.

## Decision Making

1. **Lazy consensus** is the default: a change is accepted when it has the
   required approvals and no unresolved objections after 72 hours.
2. **Objections** must be actionable and grounded in the
   [design principles](reference/design-principles.md) or a concrete
   interoperability/security concern.
3. If consensus fails, maintainers vote; a change passes with a two-thirds
   majority of votes cast within 14 days.

### Approval thresholds

| Change | Requirement |
| --- | --- |
| Editorial (typos, formatting, informative clarifications) | 1 maintainer approval |
| Informative documents (`docs/`, `examples/`, `reference/` prose) | 1 maintainer approval |
| Normative change to a `Draft` PP | Document editor + 1 maintainer |
| PP status transition (`Draft → Review → Accepted → Stable`) | 2 maintainer approvals + lazy consensus |
| Amendment to an `Accepted`/`Stable` PP | 2 maintainer approvals; breaking amendments to `Stable` require a new protocol version |
| Changes to GOVERNANCE.md, LICENSE, CODE_OF_CONDUCT.md | Two-thirds vote of maintainers |

## The PP Process

Specification work happens through numbered PP documents under
[`pp/`](pp/README.md), which defines document statuses and the authoring
process. Governance hooks:

- Maintainers assign PP numbers (never reused).
- `Accepted` requires demonstrated rough consensus and addressed review.
- `Stable` additionally requires **two independent implementations** of
  the document's conformance class.

## Versioning

The protocol version (the `pp` field, e.g. `0.1`) is distinct from
document versions:

- **MINOR** protocol releases bundle compatible changes; declared by
  maintainer vote and recorded in [CHANGELOG.md](CHANGELOG.md).
- **MAJOR** protocol releases may break compatibility and require a
  migration note per breaking change.
- During `0.x`, minor releases may break compatibility (experimental
  period, per PP-0002 §2).

## Intellectual Property

- All contributions are licensed under [Apache 2.0](LICENSE).
- Contributors certify the [Developer Certificate of
  Origin](https://developercertificate.org/) by contributing.
- Contributions must be the contributor's own work or clearly licensed
  compatibly.

## Neutrality

This project is not controlled by any single vendor. Normative documents
naming a vendor product as a requirement violate
[PP-0001-RQ-001](pp/PP-0001-vision.md) and will not be accepted. If the
maintainer group ever falls under majority control of one employer, the
group must rebalance before ratifying further status transitions.

## Amendments

This document is amended by pull request, subject to the two-thirds vote
threshold above.
