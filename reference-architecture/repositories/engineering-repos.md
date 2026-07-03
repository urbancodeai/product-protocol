*Part of the [Reference Architecture v1](../README.md) — an opinionated,
informative implementation blueprint. The normative standard is the
[Product Protocol](../../README.md).*

# Engineering Repositories

Engineering repos hold the application code that implements the
product. They are ordinary software repositories — the protocol never
looks inside them; it sees only Artifact records referencing commits by
digest (PP-0007 §6). RA v1 standardizes their scaffold so that any
[Claude Code session](../runtime/claude-code-sessions.md) landing in
any repo of the fleet finds the same shape.

For `aurora-books`: `aurora-storefront` (Next.js frontend),
`aurora-catalog-service`, `aurora-checkout-service` (TypeScript
services).

## Standard scaffold

```
aurora-checkout-service/
├── pp.yaml                        # product binding (below)
├── CLAUDE.md                      # repo-layer agent context (see claude-md.md)
├── .claude/
│   ├── agents/                    # generated role definitions (from vault 70-agents)
│   ├── settings.json              # permissions, MCP server wiring
│   └── hooks/                     # pre-submit hooks: lint, typecheck, golden subset
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # lint + typecheck + unit + integration
│   │   ├── evaluate.yml           # golden suites; reports to Evaluation Manager
│   │   └── deploy.yml             # env-protected; writes Deployment records
│   └── pull_request_template.md   # PP-Task / Story fields (below)
├── graphify.yml                   # code-graph indexing config (graphify-code)
├── .qmd/config.yaml               # qmd search index config for this repo
├── src/
└── tests/
    ├── unit/
    ├── integration/
    └── golden/                    # golden suites — Playwright specs + fixtures
        ├── checkout-happy-path.spec.ts   # implements golden-checkout-happy-path
        └── datasets -> (pulled from spec repo datasets/ at pinned version)
```

Conventions:

- `tests/golden/` is the executable half of the spec repo's
  `.product/evaluation/golden/` objects: each GoldenTest names, in its
  spec, the repo and spec file that implements it, and `evaluate.yml`
  is what [QualityGates](../evaluation.md) ultimately run. Golden specs
  are Playwright for user-facing flows, pytest for API/service-level
  suites.
- `.claude/agents/` and parts of `CLAUDE.md` are **generated** from the
  vault's `70-agents` operating manuals — edited at the source, synced
  by the vault pipeline, never hand-patched here
  ([claude-md.md](claude-md.md#operating-manuals-and-generated-copies)).
- `deploy.yml` is the only path to production and runs under GitHub
  environment protection; worker sessions never hold deploy
  credentials ([GitHub integration](../runtime/github-integration.md)).

## Binding a repo to its product

Every engineering repo carries a `pp.yaml` at its root — the pointer
that lets any session (or tool) locate the product it serves:

```yaml
# pp.yaml — Product Protocol binding (RA v1 convention, not a PP object)
product: aurora-books
specRepo: https://github.com/aurora/aurora-books-product
specPath: .product
role: source            # matches Product.spec.repositories[].role
```

The inverse edge lives in the spec repo:
`Product.spec.repositories` lists this repo with the same `role`
(PP-0002 §9). Sessions resolve context in one hop: clone workspace →
read `pp.yaml` → open the spec repo via `pp-spec` → assemble the task
context ([session lifecycle §1](../runtime/claude-code-sessions.md)).
Tools treat a missing or dangling `pp.yaml` as a configuration error,
not a guess-and-continue.

## Commits and PRs

- **Branch:** `task/<task-id>`, cut from the SHA pinned in the task's
  execution context.
- **Trailer:** every commit made in service of a task ends with
  `PP-Task: <task-id>`. This is the join key between Git history and
  the Task Graph — the traceability report and Graphify both index it.

  ```
  Add guest checkout endpoint with cart validation

  PP-Task: task-guest-checkout-api
  ```

- **One PR per task.** The PR is the deliverable a `changeset`
  Artifact record points at (by merge-commit digest, not branch name —
  PP-0007 §6). The PR template requires:

  | Field | Content |
  | --- | --- |
  | `PP-Task` | Task id (link into the spec repo) |
  | `Traces to` | The Story/Feature/Issue behind the task |
  | `Completion` | Checklist mirroring `Task.spec.completion.criteria` |
  | `Self-assessment` | Link to the `report` Artifact (PP-0007 §7) |
  | `Evidence` | CI run links / digests backing the self-assessment |

- No force pushes, no rebases of pushed history on task branches;
  conflict resolution is rebase-and-retry *before* pushing, per the
  [scaling policy](../runtime/claude-code-sessions.md#scaling-and-concurrency).

## Monorepo vs polyrepo

RA v1 defaults to **polyrepo — one repo per independently deployable
service** — because the runtime's unit of checkout, permission, and
concurrency control is the repo:

- Smaller clones and sparser context per session (cost, speed).
- Per-repo concurrency caps limit merge contention between parallel
  workers ([scaling](../runtime/claude-code-sessions.md#scaling-and-concurrency)).
- GitHub App permissions can be scoped per repo per role.

Choose a monorepo (`aurora-platform`) when services share one release
cadence and heavy internal libraries. If you do:

- Keep one `pp.yaml` at the root; per-package `CLAUDE.md` files carry
  folder-level guidance ([claude-md.md](claude-md.md#layering)).
- Use sparse checkout driven by the task's declared paths, and path
  filters in `ci.yml`/`evaluate.yml`.
- Halve the default per-repo concurrency cap: contention on a shared
  trunk is the dominant failure mode for agent fleets in monorepos.

Do not mix classes: the spec repo is never folded into a monorepo —
its permission model, CODEOWNERS, and merge queues are different by
design ([specification-repo.md](specification-repo.md)).

## Code-knowledge indexing

Two indexes keep code findable without stuffing context windows
([knowledge layer](../knowledge/README.md)):

- **Graphify** (`graphify.yml`) — a code graph: symbols, dependencies,
  ownership, PP-Task trailers. Exposed to sessions via the
  `graphify-code` MCP server (`symbol_lookup`, `dependency_graph`,
  `impact_of`).
- **qmd** (`.qmd/config.yaml`) — semantic search over code and docs in
  the repo, exposed via `qmd-search`.

Refresh hooks:

- A post-merge workflow step in `ci.yml` calls the Graphify and qmd
  refresh endpoints for the merged range, so indexes trail `main` by
  minutes, not days.
- Sessions never index; they only query. A session that notices index
  staleness (symbol missing that `git log` shows merged) records an
  Observation rather than working around it silently.

The [Librarian](../agents/README.md) composes these indexes with the
Product Brain when assembling worker context — see the
[MCP layer](../runtime/mcp-context.md#context-assembly-with-the-librarian).
