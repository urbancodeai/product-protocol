# Vision

*(Informative. The normative statement of scope is
[PP-0001](pp/PP-0001-vision.md).)*

## Software that knows what it is

Every software product is an accumulation of decisions: what to build,
why, for whom, under what rules, at what quality bar. Today those
decisions live in heads, chat threads, tickets, and stale wikis. When
autonomous systems join the engineering loop, that ambient knowledge
becomes the bottleneck — an agent cannot honor an intention no one wrote
down, and a human cannot audit a decision no one recorded.

Product Protocol's premise: **a product should carry its own definition.**
Structured, versioned, in plain text, next to the code. Its goals. Its
specifications. Its constitution — the rules that always hold. Its task
graph. Its evidence of quality. Its memory.

## From intent to running software, continuously

The protocol describes one loop, executed continuously:

**Product Intent** → **Product Knowledge** → **Product Specification** →
**Product Constitution** → **Task Graph** → **Execution** →
**Evaluation** → **Deployment** → **Telemetry** → **Learning** → *(back
to Knowledge)*

A founder describes a product in conversation. The system distills the
conversation into knowledge, drafts specifications, and proposes them.
The human approves. Planners decompose approved intent into tasks;
workers — agents or humans — execute them under the constitution;
evaluators judge every artifact and attach evidence; gated deployments
ship; telemetry becomes observations; observations become knowledge; and
the next turn of the loop starts better informed than the last.

Humans stay where humans matter: **intent, rules, and judgment**. Agents
take everything mechanical, at machine speed, on the record.

## Why a standard, not a product

The loop above is being built dozens of times right now, incompatibly.
We believe the representation layer must be common:

- **Portability.** Your product's definition outlives any vendor. Switch
  planners, workers, or evaluators without losing your product's mind.
- **Composability.** A market of interoperable planners, workers, and
  evaluators beats any monolith.
- **Auditability.** Regulators, customers, and future maintainers can
  trace every shipped behavior to an approved intent and its evidence.
- **Trust.** The rule that agents cannot approve their own specifications
  or amend their own constitution is only credible if it's a *protocol
  invariant*, not a vendor promise.

## What success looks like

- Writing a `Specification` or `Constitution` is as normal as writing an
  OpenAPI document.
- Two independent runtimes can exchange an entire product — brain,
  specifications, constitution, task graph, evidence — losslessly.
- "Show me why this behavior exists" is answered by following references,
  not by archaeology.
- The protocol remains small enough to read in an afternoon and precise
  enough to implement without asking anyone's permission.

## Non-goals

We are not building an agent framework, a model, a project-management
methodology, or a deployment platform — and the specification never
requires one. See PP-0001 §3.
