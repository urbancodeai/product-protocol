# The Obsidian Vault (`navigator`)

*Part of the [Reference Architecture v1](../README.md) — an opinionated, informative implementation blueprint. The normative standard is the [Product Protocol](../../README.md).*

The vault is RA v1's **human navigation layer**: a single git-backed
Obsidian vault, one repo (`navigator`) for the whole organization. It is
where humans *read* everything and *write* almost nothing. The canonical
truth for product knowledge lives in each product spec repo's
`.product/brain/` tree ([product-brain.md](./product-brain.md)); the
vault holds generated read views of it, plus the prose knowledge that
genuinely belongs to humans — notes, runbooks, org context.

The operating assumption, inherited from the RA as a whole
([architecture.md](../architecture.md)): **humans rarely edit markdown
directly**. They converse with agents, and agents write. The one
deliberate exception is the human inbox, which exists precisely to be
consumed.

## Design goals

1. **One place to look.** Every product, decision, runbook, and agent
   manual is reachable from the vault home note by wikilinks. Obsidian's
   graph view over those links is the navigation win — the org's
   knowledge topology becomes visible and explorable without any query
   language.
2. **Truth is elsewhere.** Generated notes are projections of PP objects.
   A human can always trace a view to its source object via its
   frontmatter `source` ref.
3. **Nothing proprietary for correctness.** The vault must remain a
   plain folder of markdown. Obsidian (and Dataview, and the graph view)
   improve the experience; `grep` and a git clone are sufficient to use
   it. No plugin is load-bearing.
4. **CI-checked.** The vault repo runs frontmatter validation on every
   push: generated notes must carry the full generated-note schema; human
   notes must not claim to be generated.

## Folder structure

```
navigator/
├── 00-home/                       # Entry points and dashboards
│   ├── home.md                    #   The front door: links to every area
│   ├── approval-queue.md          #   Generated: pending human approvals across products
│   │                              #   (proposed governed objects, canonical promotions,
│   │                              #    unresolved contradictions awaiting review)
│   └── product-dashboards/        #   Generated per-product status dashboards
│       └── aurora-books.md
├── 10-human/                      # THE ONLY AREA HUMANS WRITE
│   ├── inbox/                     #   Drop zone: thoughts, feedback, links, voice-memo
│   │   └── 2026-07-03-pricing-thought.md      # transcripts — Curator ingestion source
│   ├── meetings/                  #   Human-authored meeting notes (also ingested)
│   │   └── 2026-07-01-roadmap-review.md
│   └── drafts/                    #   Long-form thinking in progress; ingested only
│                                  #   when the author marks `status: ready`
├── 20-product-brain/              # GENERATED read views of Brain objects, per product
│   └── aurora-books/
│       ├── vision.md              #   Rendered from Goals + domain Knowledge
│       ├── roadmap.md             #   Rendered from Capabilities/Features + process Knowledge
│       ├── research/              #   market + user category Knowledge views
│       ├── personas/              #   user category Knowledge views (persona-labelled)
│       ├── architecture-decisions/#   Decision objects in ADR profile, one note each
│       ├── customer-feedback/     #   Observation-sourced Knowledge views
│       ├── meeting-summaries/     #   What was distilled from each ingested meeting
│       ├── business-rules/        #   domain Knowledge that refs Specifications
│       ├── knowledge/             #   The full per-object Knowledge views (by category)
│       └── evolution.md           #   Product evolution timeline: supersession chains
│                                  #   and Decision history rendered chronologically
├── 30-engineering/                # Engineering knowledge (mixed: some generated, some prose)
│   ├── runbooks/                  #   Operational runbooks (agent-written prose, reviewed)
│   ├── service-catalog/           #   Generated from Graphify: services, owners, deps
│   └── postmortems/               #   Views of Issue + lesson-Knowledge chains
├── 40-architecture/               # Cross-cutting architecture
│   ├── adr-index.md               #   Generated index of all Decision objects (ADR profile)
│   └── c4/                        #   C4-style context/container maps (Mermaid, generated
│                                  #   from Graphify + architectural Knowledge)
├── 50-company/                    # Org knowledge (prose, agent-maintained)
│   ├── org.md                     #   Teams, people, responsibilities
│   ├── processes/                 #   How the org runs its loop (mirrors process Knowledge)
│   └── policies/                  #   Security, data handling, review policies
├── 60-private/                    # Per-person scratch space
│   └── <person>/                  #   Gitignored (or per-person separate sync);
│                                  #   never ingested, never indexed by qmd
├── 70-agents/                     # Agent runtime knowledge
│   ├── operating-manuals/         #   One manual per agent (Curator, Librarian, workers)
│   ├── capability-registry.md     #   Generated: which agent may do what, MCP tools held
│   └── session-playbooks/         #   Reusable task recipes agents load at session start
├── 80-templates/                  # Note templates
│   ├── inbox-note.md              #   Frontmatter skeleton for 10-human/inbox
│   ├── meeting-note.md
│   └── generated-view.md          #   The template renderers must conform to
└── 90-meta/                       # The vault about itself
    ├── conventions.md             #   This document's rules, in-vault
    └── sync-status.md             #   Generated: last sync per source, lag, failures
```

Per-folder ownership, in one line each:

| Folder | Writer | Reader | Nature |
| --- | --- | --- | --- |
| `00-home` | render pipeline | humans | generated |
| `10-human` | **humans** | Curator | authored, ingestion source |
| `20-product-brain` | render pipeline | humans, qmd | generated from `.product/brain/` + `.product/specification/` |
| `30-engineering` | agents (runbooks), render pipeline (catalog, postmortems) | humans, qmd | mixed |
| `40-architecture` | render pipeline | humans, qmd | generated |
| `50-company` | agents via conversation | humans, qmd | authored-by-agents prose |
| `60-private` | each person | that person | out of scope for everything |
| `70-agents` | agents (manuals via conversation), render pipeline (registry) | agents, humans | mixed |
| `80-templates` | agents | humans, renderers | authored |
| `90-meta` | render pipeline + agents | everyone | mixed |

## Frontmatter schema

### Generated notes

Every generated note carries this frontmatter, validated in CI:

```yaml
---
type: generated-view
source: pp://aurora-books/Knowledge/know-cart-abandon-shipping@2.1.0
sourceRepo: aurora-books-spec
generatedAt: 2026-07-03T09:15:00Z
generator: brain-render/1.4.2
checksum: sha256:7f3a9c02e1…        # over the note body below the frontmatter
editable: false
confidence: validated                # mirrored from the object, for Dataview
category: user                       # mirrored PP-0003 §2 category
tags: [pp/knowledge, pp/category/user, product/aurora-books]
---
```

- `source` is the fully qualified PP identity URI (PP-0002 §3.2),
  pinned to the exact rendered version. A view is stale exactly when a
  newer version of that id exists.
- `checksum` covers the rendered body. It is how edits are detected
  (below).
- `editable: false` is advisory to humans and binding on agents: no
  agent may write to a note carrying it, except the renderer
  regenerating it wholesale.

Immediately below the frontmatter, every generated note begins with the
banner:

> ⚠️ **Generated view — edits will be overwritten.** This note renders
> `pp://…` from the product spec repo. To change what it says, talk to
> the product agents or drop a note in `10-human/inbox/` — the
> [Knowledge Curator](../agents/knowledge-curator.md) will take it from
> there.

The banner is not decoration; it is the contract that makes one-way sync
honest. Generated content that *invites* editing (a wiki) inevitably
forks from its source. Generated content that *declares* itself a
rendering, and visibly survives being clobbered, teaches humans where
truth lives — and the checksum mechanism below ensures that even when
someone edits anyway, their edit is treated as input rather than lost.

### Human notes

Inbox and meeting notes use a minimal schema (template in
`80-templates/`):

```yaml
---
type: inbox            # or: meeting, draft
author: dana@example.com
createdAt: 2026-07-03T08:40:00Z
products: [aurora-books]   # routing hint for the Curator; optional
status: open               # open | distilled | ignored
---
```

When the Curator distills a note, it appends a generated footer section
— **distilled ✓** — listing wikilinks to the Brain-object views the
note produced (e.g. `[[know-club-renewal-gift]]`), sets
`status: distilled`, and records the Knowledge ids in a
`distilledInto:` frontmatter list. The human's original text is never
altered; the note becomes a provenance source
(`type: document`, `uri:` pointing at the vault path at the ingested
commit) per PP-0009 §2.1.

## Edit detection: checksum → ingestion, never clobber

Humans will sometimes edit generated notes anyway. The pipeline treats
that as a feature:

1. On every render pass (and every vault push), the renderer recomputes
   the body checksum of each generated note and compares it to the
   frontmatter `checksum`.
2. **Match** → the note is pristine; regenerate freely if the source
   object changed.
3. **Mismatch** → a human (or misbehaving agent) edited a view. The
   renderer does **not** silently overwrite. It:
   - diffs the edited body against the pristine rendering,
   - files the diff as an **ingestion event** — a synthetic inbox item
     in `10-human/inbox/` attributed to the editing commit's author,
     tagged with the `source` object it annotates,
   - then regenerates the view from truth.
4. The Curator processes the ingestion event like any inbox note: the
   edit's substance becomes a new Knowledge version, a `contradicts`
   link, or a comment on a review Issue — whatever it actually was.

Net effect: the canonical side always wins the file, but the human's
intent always survives as input. Nothing a human types into the vault
is ever simply lost.

## Wikilinks and PP refs

Vault links mirror PP refs so the two graphs stay isomorphic:

- Every generated view's filename is the object `id`:
  `know-cart-abandon-shipping.md`, `dec-2026-06-24-search-engine.md`.
  Because PP ids are unique per (product, kind) and the vault nests by
  product, `[[know-cart-abandon-shipping]]` resolves unambiguously.
- When a Brain object's `links[]` or `affects` reference another object,
  the renderer emits a wikilink to that object's view — so Knowledge
  Graph edges (PP-0003 §8) appear as Obsidian graph edges. The edge type
  is rendered as link text: `supports → [[know-early-price-transparency]]`.
- Refs to objects without views (e.g. raw Observations) render as plain
  `pp://` code spans, not dead wikilinks.

This is why the graph view works as navigation: the Obsidian graph of
`20-product-brain/` *is* a faithful projection of the PP Knowledge
Graph, with prose areas (`30-`, `50-`) attached at their citation
points.

## Index notes and tags

- Each folder that holds many views gets a generated **index note**
  (`_index.md`) — a Dataview-style table over frontmatter: id, name,
  category, confidence, updatedAt. The renderer *also* materializes the
  table as static markdown so the index works without Dataview
  installed (rule 3: no plugin is load-bearing).
- Tags map one-to-one onto PP taxonomy:
  - `#pp/knowledge`, `#pp/decision`, `#pp/goal` … per kind;
  - `#pp/category/domain` … `#pp/category/lesson` for the eight
    PP-0003 §2 categories;
  - `#pp/confidence/hypothesis` … `#pp/confidence/canonical`;
  - `#product/<id>` for product scoping.
- The approval queue (`00-home/approval-queue.md`) is a generated index
  over: governed objects in `proposed` lifecycle, Knowledge awaiting
  `canonical` sign-off, and unresolved `contradicts` pairs (PP-0009 §5's
  review obligation, surfaced where humans actually look).

## Git and CI

- The vault is an ordinary git repo. Humans who use Obsidian sync via
  the git plugin or a background committer; agents commit through the
  same pipeline as any repo.
- `60-private/` is gitignored (or mapped to per-person sync); it is
  excluded from qmd indexing and Curator ingestion by construction.
- CI on every push validates:
  - frontmatter parses and matches the schema for its `type`;
  - every `type: generated-view` note has `source`, `generatedAt`,
    `checksum`, `editable: false`;
  - checksums match bodies (mismatches trigger the ingestion path
    above rather than failing the build);
  - no file outside `10-human/` and `60-private/` was authored by a
    human without an agent co-commit (soft warning — process signal,
    not a gate).
- Failure mode: a broken render or failed vault push means humans see
  slightly stale views (`90-meta/sync-status.md` says how stale). It
  never blocks Brain writes or the engineering loop — see
  [synchronization.md](./synchronization.md).

## What the vault is not

- Not the Brain. PP-0003 §1.1: renderings are Artifacts, never Brain
  content. Deleting the entire vault loses no product knowledge; a
  render pass rebuilds `00-`, `20-`, `40-` and the generated parts of
  `30-`/`70-` from the spec repos and Graphify.
- Not a task tracker. Tasks and Issues live in the spec repo and are
  mirrored to Linear; the vault links to them, it does not manage them.
- Not an archive of conversations. Chat history is ephemeral; anything
  worth keeping is distilled into the Brain (see the anti-patterns in
  [synchronization.md](./synchronization.md)).

Related: [README.md](./README.md) (the three planes) ·
[product-brain.md](./product-brain.md) (what the views render) ·
[agents/knowledge-curator.md](../agents/knowledge-curator.md) ·
[agents/librarian.md](../agents/librarian.md) ·
[lifecycle.md](../lifecycle.md).
