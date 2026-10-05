# ADR-003: V1/V2 Runtime Separation Strategy

## Status
Accepted

## Context
Building an end-to-end agent context layer benefits from two distinct engineering phases:
1. Validating product architecture, context assembly, adapter models, and policies quickly using existing infrastructure (V1).
2. Gaining deep runtime mastery over LLM loops, tool calling, execution limits, and streaming mechanics without heavy framework overhead (V2).

## Decision
Establish an explicit abstraction boundary (`AgentRuntime`) in V1 that isolates ContextFlow's core from the Mastra execution engine. In V2, Mastra will be replaced with a thin, custom execution runtime (e.g., using the Vercel AI SDK) while preserving all other ContextFlow layers intact.

## Consequences
### Positive
* Delivers immediate value in V1 by leveraging Mastra's battle-tested primitives.
* Ensures zero rework of ContextFlow's database schema, vector indexes, tool registry, context engine, and API routes when transitioning to V2.
* Clear educational and engineering progression: V1 focuses on system composition; V2 focuses on runtime internals.

### Negative / Tradeoffs
* Requires architectural discipline during V1 to ensure no Mastra-specific types or constructs leak outside the `AgentRuntime` adapter.

### Mitigations
* Strict linting and boundary verification to ensure application code and routes interface solely with `@contextflow/core` abstractions.
