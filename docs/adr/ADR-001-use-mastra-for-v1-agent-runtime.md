# ADR-001: Use Mastra for V1 Agent Runtime

## Status
Accepted

## Context
ContextFlow is an application-agnostic AI agent execution and context layer. It requires an underlying engine to execute agent loops, call tools, manage memory, and handle model communication. Building these low-level agent primitives from scratch in V1 would require significant engineering effort on generic framework plumbing rather than ContextFlow's core value: context synthesis, tool governance, policies, and application adapters.

## Decision
Use **Mastra** as the underlying agent execution runtime for ContextFlow V1.

## Consequences
### Positive
* Delivers complete agent primitives in TypeScript: reasoning loops, tool calling, conversation memory, workflows, and MCP support.
* Focuses engineering bandwidth on ContextFlow's differentiators: context assembly, application adapters, policy enforcement, and execution metadata.
* Provides a fast, robust path to a working proof-of-concept.

### Negative / Tradeoffs
* Couples V1 to Mastra's conventions and release lifecycle.

### Mitigations
* Isolate all Mastra interactions behind an internal `AgentRuntime` interface in `@contextflow/core`.
* Prevent Mastra types and internal APIs from leaking into ContextFlow's public API or application adapter contracts.
* Paves the way for a thin, custom runtime in V2 via this boundary.
