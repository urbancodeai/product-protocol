# ADR-0004: Modular conformance classes

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Product Protocol maintainers

## Context

Few adopters will implement the full autonomous loop on day one. A team
might only want the Specification format; a vendor might only build an
Evaluator. Monolithic conformance ("you implement all of PP or none")
would guarantee fragmentation-by-partial-implementation with no honest
way to label it (P11).

## Options Considered

1. **Named conformance classes per role** — PP/Core, PP/Brain, PP/Spec,
   PP/Constitution, PP/Planner, PP/Worker, PP/Evaluator, PP/Runtime.
2. **Single conformance level** — simple, but see above.
3. **Feature-flag matrix** — maximum granularity, unverifiable claims,
   meaningless marketing ("87% conformant").

## Decision

Option 1 (terminology.md §4). Classes map to the actor roles of the
loop, so a claim like "conformant PP/Evaluator" states exactly what a
component can do in a mixed-vendor deployment. PP/Core is the shared
substrate every class requires; PP/Runtime is the whole loop.

## Consequences

- Honest, testable interop claims; conformance suites can be built per
  class (roadmap).
- Mixed deployments (vendor A planner, vendor B workers, in-house
  evaluator) have a defined contract surface.
- Costs: cross-class interactions must be specified at class boundaries
  (e.g. PP/Worker depends on the Task model of PP/Planner's spec), which
  the `Requires` header of each PP tracks.

## References

- reference/terminology.md §4; design principle P11; ROADMAP
  "Conformance test suite".
