import type { Agent } from "@mastra/core/agent";

/**
 * Public agent metadata exposed over the ContextFlow API.\n * Never leaks Mastra internals, model keys, or runtime objects.
 */
export type ContextFlowAgentMetadata = {
  id: string;
  name: string;
  description: string;
};

/**
 * Internal ContextFlow agent representation registered in the in-memory AgentRegistry.
 *
 * NOTE: The `agent` property holds the underlying runtime execution engine
 * (Mastra Agent in V1). This is runtime-private to ContextFlow and intentionally
 * isolated from public API contracts to allow seamless migration to future
 * runtimes without client contract changes.
 */
export type ContextFlowAgent = ContextFlowAgentMetadata & {
  agent: Agent;
  supportedResourceTypes?: string[];
};
