import { type AgentRegistry, agentRegistry } from "../agents/registry.js";
import type { ContextFlowAgent, ContextFlowAgentMetadata } from "../agents/types.js";
import {
  AgentContextNotSupportedError,
  type ContextService,
  contextService as defaultContextService,
  type ResourceReference,
  type TrustedExecutionContext,
} from "../context/index.js";

export type AgentInput = {
  message: string;
  resource?: ResourceReference;
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
 * Assembles minimal application context before agent invocation.
 */
export class AgentService {
  constructor(
    private readonly registry: AgentRegistry = agentRegistry,
    private readonly contextService: ContextService = defaultContextService,
  ) {}

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
   * Executes the resolved agent with user input, resolving optional application
   * context before model invocation, and returns normalized output.
   */
  async runAgent(agentId: string, input: AgentInput): Promise<AgentResult | null> {
    const contextFlowAgent = this.resolveAgent(agentId);
    if (!contextFlowAgent) {
      return null;
    }

    let prompt = input.message;

    // Resolve application context if a resource reference was provided
    if (input.resource) {
      const supported = contextFlowAgent.supportedResourceTypes ?? [];
      if (!supported.includes(input.resource.type)) {
        throw new AgentContextNotSupportedError(agentId, input.resource.type);
      }

      const trustedContext: TrustedExecutionContext = { agentId };
      const resolvedContext = await this.contextService.resolveContext(
        input.resource,
        trustedContext,
      );
      const formattedContext = this.contextService.formatContext(resolvedContext);

      prompt = `${formattedContext}\n\nUser request:\n${input.message}`;
    }

    const output = await contextFlowAgent.agent.generate(prompt);

    return {
      agentId,
      text: output.text ?? "",
    };
  }
}

export const agentService = new AgentService();
