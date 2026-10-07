import { type AgentRegistry, agentRegistry } from "../agents/registry.js";
import type { ContextFlowAgent, ContextFlowAgentMetadata } from "../agents/types.js";

export type AgentInput = {
  message: string;
};

export type AgentResult = {
  agentId: string;
  text: string;
};

/**
 * Service orchestrating agent resolution, discovery, and execution.
 *
 * Agnostic to individual agent definitions; delegates resolution and
 * metadata discovery entirely to the AgentRegistry.
 */
export class AgentService {
  constructor(private readonly registry: AgentRegistry = agentRegistry) {}

  /**
   * Discovers and lists metadata for all registered agents.
   */
  listAgents(): ContextFlowAgentMetadata[] {
    return this.registry.listMetadata();
  }

  /**
   * Resolves a registered agent by ID via the registry.
   */
  resolveAgent(agentId: string): ContextFlowAgent | undefined {
    return this.registry.resolve(agentId);
  }

  /**
   * Executes the resolved agent with user input and returns normalized output.
   */
  async runAgent(agentId: string, input: AgentInput): Promise<AgentResult | null> {
    const contextFlowAgent = this.resolveAgent(agentId);
    if (!contextFlowAgent) {
      return null;
    }

    const output = await contextFlowAgent.agent.generate(input.message);

    return {
      agentId,
      text: output.text ?? "",
    };
  }
}

export const agentService = new AgentService();
