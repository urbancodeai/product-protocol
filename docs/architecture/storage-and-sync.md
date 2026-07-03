# Storage and Synchronization

*(Informative; normative binding: PP-0002 §7, PP-0003 §6, PP-0009.)*

## The `.product/` tree

A Product's entire definition lives in one directory, usually at the
root of its source repository:

```
.product/
├── product.yaml
├── brain/            # brain.yaml, knowledge/, decisions/
├── specification/    # goals, capabilities, specifications, features, stories
├── constitution/
├── tasks/
├── workers/
├── evaluation/       # golden/, gates/, runs/
├── deployments/
├── observations/
└── issues/
```

Why co-located with code: a Story, the commits implementing it, the
Evaluation accepting it, and the Deployment shipping it share one
history. `git log --follow .product/specification/story-x.yaml` *is* the
requirements traceability report.

## Concurrency without locks

The tree is shared state under optimistic concurrency (merge), so the
protocol's write patterns are designed to be conflict-poor:

- **Append-only kinds** (evaluations, observations, decisions,
  artifacts) create new files — no conflicts by construction.
- **Governed kinds** change by adding a new version; the approved file
  is never edited.
- **Tasks** are the contended case; the claim protocol (PP-0007 §3)
  makes a claim a single-field, single-owner write with lease expiry, so
  a lost race is detected as a merge conflict or a stale lease, both
  recoverable.

Implementations running many agents typically serialize writes through
one process or branch-per-worker with fast-forward merges; both are
implementation details invisible to the protocol.

## Synchronization concerns

**Brain ↔ reality.** Knowledge decays. PP-0003 defines staleness
signals (a Knowledge item whose provenance points at superseded objects,
contradicted by newer Observations) and PP-0009 validation turns them
into review work rather than silent rot.

**Spec ↔ tasks.** When a governed object gains a new approved version,
Tasks tracing to the old version must be re-validated (PP-0006 §8) —
the planner treats specification change as a replanning trigger.

**Tree ↔ backends.** Implementations may serve the same objects from a
database or API for speed, but the tree is canonical: lossless
import/export is a conformance requirement (PP-0002 RQ-012), and
"restore the system from a fresh clone" is the recovery model.

## Scale notes

- Thousands of objects are just files; Git handles this comfortably.
- Evaluation evidence payloads and binary artifacts stay out of the
  tree (digest + URI in the record, PP-0007 §6); the tree stores
  testimony, not blobs.
- Cold records (old runs, superseded knowledge) can move to an archive
  prefix without breaking refs, since identity is content-derived, not
  path-derived (PP-0002 RQ-016).
