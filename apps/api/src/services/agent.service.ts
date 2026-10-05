import { CONTEXTFLOW_ASSISTANT_ID, contextFlowAssistant } from "../agents/contextflow-assistant.js";

export type AgentInput = {
  message: string;
};

export type AgentResult = {
  agentId: string;
  text: string;
};

export class AgentService {
  /**
   * Resolves an agent by its identifier.
   * In Lego Block 01, resolution is statically mapped to the contextflow-assistant.
   */
  resolveAgent(agentId: string) {
    if (agentId === CONTEXTFLOW_ASSISTANT_ID) {
      return contextFlowAssistant;
    }
    return null;
  }

  /**
   * Executes the resolved agent with user input and returns normalized output.
   */
  async runAgent(agentId: string, input: AgentInput): Promise<AgentResult | null> {
    const agent = this.resolveAgent(agentId);
    if (!agent) {
      return null;
    }

    const output = await agent.generate(input.message);

    return {
      agentId,
      text: output.text ?? "",
    };
  }
}

export const agentService = new AgentService();
