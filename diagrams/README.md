# Diagram Sources

Editable sources for the diagrams used across the Product Protocol
documentation.

## Layout

| File | Diagram |
| --- | --- |
| `architecture.mmd` | Component/actor architecture with data flows |
| `lifecycle.mmd` | The full autonomous engineering loop |
| `state-machines-governed.mmd` | Governed-object lifecycle (PP-0002 §6.2) |
| `state-machines-task.mmd` | Task state machine (PP-0006 §5) |
| `sequence-loop.mmd` | Sequence diagram of one loop turn |
| `*.drawio` | Simplified draw.io equivalents (diagrams.net) |

Note: Mermaid renders one diagram per `.mmd` file, so the two protocol
state machines live in two files (`state-machines-governed.mmd` and
`state-machines-task.mmd`) rather than a single `state-machines.mmd`.
The draw.io counterpart `state-machines.drawio` holds both as two pages
of one file.

## How diagrams are used

Documents embed Mermaid directly in fenced ` ```mermaid ` blocks —
GitHub renders these natively, so most readers never need this
directory. The `.mmd` files here are the editable sources of truth;
when you change a diagram in a document, update the matching source
here (and vice versa). A rendered gallery lives in
[`docs/diagrams/README.md`](../docs/diagrams/README.md).

## Rendering locally

Render any source to SVG/PNG with
[mermaid-cli](https://github.com/mermaid-js/mermaid-cli):

```bash
npx --yes @mermaid-js/mermaid-cli -i diagrams/lifecycle.mmd -o lifecycle.svg
npx --yes @mermaid-js/mermaid-cli -i diagrams/architecture.mmd -o architecture.png
```

## draw.io contributions

Contributions of [diagrams.net](https://www.diagrams.net/) (draw.io)
exports are welcome; store them alongside the Mermaid sources as
`.drawio` files with the same base name. Keep the Mermaid source and
the draw.io file telling the same story — the Mermaid embedded in the
specification documents is authoritative on conflict.
