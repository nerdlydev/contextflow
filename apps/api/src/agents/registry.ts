import { contextFlowAssistant } from "./contextflow-assistant.js";
import { crmAssistant } from "./crm-assistant.js";
import { knowledgeAssistant } from "./knowledge-assistant.js";
import type { ContextFlowAgent, ContextFlowAgentMetadata } from "./types.js";

/**
 * In-memory registry responsible for cataloging and resolving ContextFlow agents.
 *
 * Owned exclusively by ContextFlow. Does not expose underlying runtime internals.
 */
export class AgentRegistry {
  private readonly agents = new Map<string, ContextFlowAgent>();

  /**
   * Registers a ContextFlow agent into the catalog.
   * Throws an error if an agent with the same ID is already registered.
   */
  register(agent: ContextFlowAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID '${agent.id}' is already registered`);
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Resolves a registered agent by its unique identifier.
   * Returns undefined if the agent is not found.
   */
  resolve(agentId: string): ContextFlowAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Returns public metadata for all registered agents.
   * Excludes runtime implementation details.
   */
  listMetadata(): ContextFlowAgentMetadata[] {
    return Array.from(this.agents.values()).map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }
}

/**
 * Creates and populates the default ContextFlow AgentRegistry with initial agents.
 */
export function createDefaultAgentRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  registry.register(contextFlowAssistant);
  registry.register(knowledgeAssistant);
  registry.register(crmAssistant);
  return registry;
}

/**
 * Default singleton instance of AgentRegistry for standard application use.
 */
export const agentRegistry = createDefaultAgentRegistry();
