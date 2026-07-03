# The Synchronization Fabric

*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

RA v1 has one canonical store per artifact class and many derived
views. This document specifies every sync relationship: direction,
trigger, transformer, conflict rule, and failure mode. Two principles
govern all of them:

1. **The canonical side always wins.** A derived view is regenerated,
   never merged. An edit made on the non-canonical side is not a
   conflict to resolve — it is an **ingestion event** to route back
   through the [Knowledge Curator](../agents/knowledge-curator.md)
   (PP-0009 §2), after which the view is regenerated from truth.
2. **Stale means degraded, never blocked.** Every derived store is a
   cache. If an index or view lags, retrieval quality drops and
   `90-meta/sync-status.md` says so — but Brain writes, task execution,
   and the product loop ([lifecycle.md](../lifecycle.md)) proceed. No
   sync failure is ever on the critical path of a write.

## The relationships

### 1. Spec repo ↔ vault views

| | |
| --- | --- |
| Direction | Spec repo → vault (one-way); vault edits of generated notes → ingestion events (back-channel, not sync) |
| Trigger | Git push webhook on the spec repo (paths `.product/**`); nightly full-render reconciliation |
| Transformer | `brain-render`: PP objects → markdown views with generated frontmatter and banner ([obsidian-vault.md](./obsidian-vault.md)); commits to the `navigator` repo as the render bot |
| Conflict rule | Canonical wins. Checksum mismatch on a generated note ⇒ diff captured as a synthetic inbox item attributed to the editing author, then the note is regenerated. Human content in `10-human/` is never touched except the appended "distilled ✓" footer |
| Failure mode | Vault shows stale views; approval queue may lag. Lag SLO: p95 < 5 min after push, alert at 30 min. Never blocks spec-repo writes |

### 2. Spec repo → Graphiti temporal graph

| | |
| --- | --- |
| Direction | One-way. The graph is never written directly |
| Trigger | Same push webhook (paths `.product/brain/**`, plus `.product/observations/**` and `.product/evaluation/runs/**` for provenance targets) |
| Transformer | `graph-extract`: objects → entities/edges with validity intervals ([product-brain.md](./product-brain.md)); processes commits in order, one commit = one transaction |
| Conflict rule | None possible — full rebuild from Git history (`graph-rebuild --from-git`) is the recovery path and the arbiter |
| Failure mode | Time-travel and deep traversal unavailable; the Librarian falls back to direct `.product/brain/` reads (flat selectors still work, PP-0009 §3.1). Lag SLO: p95 < 2 min, alert at 15 min |

### 3. Engineering repos → Graphify code graph

| | |
| --- | --- |
| Direction | One-way |
| Trigger | Push webhook per engineering repo, default-branch merges; full re-index weekly |
| Transformer | Graphify indexer: source → symbols, call/dependency edges, service topology; feeds the generated service catalog and C4 views in the vault |
| Conflict rule | None — code is the truth, the graph is derived. Nobody edits the code graph |
| Failure mode | Code-aware retrieval degrades to qmd text search; the service catalog view goes stale. Lag SLO: p95 < 10 min after merge |

### 4. Engineering repos + vault + spec repo → qmd semantic indexes

| | |
| --- | --- |
| Direction | One-way, three sources into per-corpus indexes (code, prose, product objects) |
| Trigger | Push webhooks per source; embedding refresh nightly |
| Transformer | qmd ingestion: chunk, embed, index. Excludes `60-private/` and gitignored paths by construction. Product-object chunks carry `pp://` identity so results cite `id@version` (PP-0009 §3.1 — retrieval never strips identity) |
| Conflict rule | None — search index. Deletions in a source tombstone the chunks on next pass |
| Failure mode | Semantic recall degrades; ref- and category-based retrieval via `pp-brain` is unaffected. Lag SLO: p95 < 10 min for incremental, 24 h for embedding refresh |

### 5. Spec repo ↔ Linear mirror

| | |
| --- | --- |
| Direction | Structurally one-way (spec repo → Linear) with a narrow return channel: Linear **comments and reactions** flow back as ingestion events |
| Trigger | Push webhook (paths `.product/tasks/**`, `.product/issues/**`) for the outbound mirror; Linear webhook for inbound comments |
| Transformer | `linear-mirror`: Task/Issue objects → Linear issues (state, labels, links back to `pp://` ids stamped in the Linear description). Inbound comments become inbox items routed to the Curator or, for review Issues, appended to the Issue thread by the Curator |
| Conflict rule | Canonical wins, strictly. A status change made *in Linear* does not change the Task object — the mirror detects the divergence, reverts the Linear state on next pass, and files the human's evident intent ("Dana moved task-x to Done") as an ingestion event so an agent can verify and effect the real transition through the worker/evaluation flow. Linear is a window, not a control plane |
| Failure mode | Linear board goes stale; PMs see lag, agents see nothing (agents never read Linear). Lag SLO: p95 < 5 min |

### 6. Everything → Claude Code session context (MCP)

| | |
| --- | --- |
| Direction | Read-only pull, on demand |
| Trigger | Session start and per-task context requests ([runtime/mcp-context.md](../runtime/mcp-context.md)) |
| Transformer | The [Librarian](../agents/librarian.md) assembles a budgeted bundle per PP-0009 §3.2 over the MCP servers: `pp-spec` and `pp-brain` (canonical objects), `qmd-search` (semantic), `graphify-code` (code graph), `linear-mirror` and `github` (operational status). Bundles preserve `id@version`, confidence, provenance, contradiction flags |
| Conflict rule | Canonical over derived: if qmd or the graph returns an object version that `pp-brain` says is superseded, the Librarian drops or re-fetches it. Bundles are ephemeral — never cached across sessions, never written anywhere |
| Failure mode | Missing index ⇒ narrower bundle assembled from canonical reads alone; the Librarian annotates the bundle with what was unavailable so the agent can calibrate. Never fabricates; never blocks the session |

## The webhook pipeline

One pipeline shape serves relationships 1, 2, 4 (spec-repo sources);
relationships 3 and 4 (code sources) are the same shape minus the
render and mirror fan-out.

```mermaid
sequenceDiagram
    participant Dev as Writer (Curator commit / agent PR merge)
    participant GH as GitHub (spec repo)
    participant D as sync-dispatcher (K8s)
    participant R as brain-render
    participant X as graph-extract
    participant Q as qmd-indexer
    participant L as linear-mirror
    participant V as navigator repo
    participant S as sync-status

    Dev->>GH: push to main (.product/** changed)
    GH->>D: webhook (commit SHA, changed paths)
    D->>D: enqueue job keyed (repo, SHA); drop if SHA already processed
    par fan-out
        D->>X: extract SHA
        X->>X: objects → entities/edges, validity intervals
        D->>R: render SHA
        R->>V: regenerate affected views (checksum frontmatter)
        R->>R: checksum mismatch? → synthetic inbox item, then overwrite
        D->>Q: index SHA
        D->>L: mirror SHA (tasks/issues paths only)
    end
    X-->>S: graph @ SHA ✓
    R-->>S: vault @ SHA ✓
    Q-->>S: qmd @ SHA ✓
    L-->>S: linear @ SHA ✓
    S->>V: update 90-meta/sync-status.md
```

Each consumer records the last SHA it fully processed. A crashed
consumer resumes from its recorded SHA; missed webhooks are covered by
a reconciliation poll (every 15 min) comparing recorded SHA to the
branch head.

## Idempotency and checksum discipline

- **Keyed by content, not by event.** Every job is keyed
  `(source repo, commit SHA)`; every transformer is a pure function of
  the tree at that SHA. Replaying a webhook, or the whole history, is
  always safe — required, since Git delivery is at-least-once.
- **Deterministic transforms.** Renderers and extractors are
  deterministic: same object version in ⇒ byte-identical view out.
  This is what makes the vault `checksum` meaningful — any mismatch is
  necessarily a foreign edit, not renderer noise. (Corollary: no
  timestamps in rendered *bodies*; `generatedAt` lives only in
  frontmatter, excluded from the checksum.)
- **Version-pinned views.** A generated note names its exact source
  version (`pp://…@2.1.0`). "Is this view current?" is a pure
  comparison against the canonical tree — no clocks, no heuristics.
- **Atomic per object.** Mirroring PP-0009 §1: a transformer commits a
  view/graph transaction per object, whole or not at all; a half-failed
  fan-out leaves some consumers a SHA behind, never a torn artifact.
- **No hidden state.** Every derived store must answer "rebuild from
  scratch" — `graph-rebuild --from-git`, `render --all`,
  `qmd index --full`, `linear-mirror --reconcile` — and the weekly job
  actually runs these, diffing the result against the incremental
  state. Drift found = bug filed, incremental state replaced.

## Single-source-of-truth audit

The full table; anything not listed here does not get stored.

| Artifact class | The one owner | Everything else is… |
| --- | --- | --- |
| Product, Goals, Capabilities, Specifications, Features, Stories, Constitutions | Spec repo `.product/` | views (vault), mirrors (Linear), context (MCP) |
| Knowledge, Decisions, ProductBrain | Spec repo `.product/brain/` | graph slices, vault views, search chunks |
| Tasks, Issues | Spec repo `.product/tasks/`, `.product/issues/` | Linear issues, dashboard rows |
| Observations, Evaluations, Artifact records | Spec repo (append-only trees) | graph provenance nodes, report inputs |
| Prototypes, reports | Spec repo `prototypes/`, `reports/` | vault links, search chunks |
| Source code | Engineering repos | Graphify graph, qmd chunks, catalog views |
| Human notes (inbox, meetings, drafts) | Vault `10-human/` | Curator input; provenance URIs after distillation |
| Prose runbooks, org/process/policy notes | Vault `30/50/70/80/90` | search chunks |
| Personal scratch | Vault `60-private/` (per person) | nothing — excluded from all sync |
| CI/CD state, PRs, review threads | GitHub | dashboard rows; PR discussion is an ingestion source |
| Agent session transcripts | Nowhere (ephemeral) | must be distilled into the Brain to survive — by design |

## Anti-patterns

Things this fabric exists to prevent. Each has been the quiet death of
a knowledge system somewhere.

- **Editing generated views.** Fixing the roadmap by editing
  `roadmap.md` feels productive and changes nothing — the next render
  clobbers it. RA v1 softens the failure (the checksum path turns your
  edit into an ingestion event) but the habit still adds a round-trip.
  Say it to an agent or drop it in the inbox; that *is* the write path.
- **Treating Linear as truth.** Dragging a card to "Done" does not
  complete a Task — completion is Evaluations passing (PP-0008), and
  the mirror will drag the card back. Linear is for visibility and
  conversation; the spec repo is for state.
- **Storing knowledge only in chat history.** A session that uncovers
  a real constraint and doesn't get it distilled has stored that
  knowledge in the one place nothing indexes. Transcripts are
  deliberately ephemeral (PP-0003: the Brain, not archives, is memory);
  if it matters, it must become a Knowledge object — the Curator's
  end-of-session sweep exists for exactly this, but naming the claim
  during the session is more reliable.
- **Enriching the derived layer.** Adding a "just this once" manual
  node to the Graphiti graph or hand-editing a Linear description
  creates state the rebuild erases. If the rebuild would lose it, it
  belongs in a canonical store.
- **Blocking writes on sync.** Requiring "vault rendered + Linear
  mirrored" before a Brain commit lands inverts the architecture:
  caches now gate truth. Every sync here is post-hoc and asynchronous
  on purpose.
- **Bidirectional "smart" merging.** The temptation to reconcile a
  vault edit *into* the YAML directly, skipping the Curator, bypasses
  dedup, confidence rules, and provenance (PP-0009 §2) — the exact
  discipline that keeps the Brain better than a wiki.

Related: [README.md](./README.md) (planes and SSOT matrix) ·
[obsidian-vault.md](./obsidian-vault.md) (checksum/frontmatter detail) ·
[product-brain.md](./product-brain.md) (graph extraction) ·
[architecture.md](../architecture.md) ·
[agents/knowledge-curator.md](../agents/knowledge-curator.md) ·
[agents/librarian.md](../agents/librarian.md) ·
[runtime/mcp-context.md](../runtime/mcp-context.md).
