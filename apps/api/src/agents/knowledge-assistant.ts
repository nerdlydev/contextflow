import { Agent } from "@mastra/core/agent";
import type { ContextFlowAgent } from "./types.js";

export const KNOWLEDGE_ASSISTANT_ID = "knowledge-assistant";
export const KNOWLEDGE_ASSISTANT_NAME = "Knowledge Assistant";
export const KNOWLEDGE_ASSISTANT_DESCRIPTION =
  "Specialized assistant for synthesizing structured knowledge, definitions, and technical concepts.";

export const KNOWLEDGE_ASSISTANT_INSTRUCTIONS =
  "You are ContextFlow's knowledge assistant. Explain concepts systematically with precision and structured summaries. You are currently running as an experimental agent in ContextFlow.";

type AgentConstructorModel = NonNullable<ConstructorParameters<typeof Agent>[0]>["model"];

/**
 * Creates the underlying Mastra Agent runtime instance for knowledge-assistant.
 */
export function createMastraKnowledgeAgent(modelOverride?: AgentConstructorModel): Agent {
  if (modelOverride) {
    return new Agent({
      id: KNOWLEDGE_ASSISTANT_ID,
      name: KNOWLEDGE_ASSISTANT_NAME,
      instructions: KNOWLEDGE_ASSISTANT_INSTRUCTIONS,
      model: modelOverride,
    });
  }

  const rawModel = process.env.MODEL_NAME || "meta/llama-3.2-11b-vision-instruct";
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "";
  const url =
    process.env.MODEL_URL || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";

  if (rawModel.startsWith("openai/") && !process.env.NVIDIA_API_KEY && !process.env.MODEL_URL) {
    return new Agent({
      id: KNOWLEDGE_ASSISTANT_ID,
      name: KNOWLEDGE_ASSISTANT_NAME,
      instructions: KNOWLEDGE_ASSISTANT_INSTRUCTIONS,
      model: rawModel as `${string}/${string}`,
    });
  }

  const modelId: `${string}/${string}` = rawModel.startsWith("openai/")
    ? (rawModel as `${string}/${string}`)
    : `openai/${rawModel}`;

  return new Agent({
    id: KNOWLEDGE_ASSISTANT_ID,
    name: KNOWLEDGE_ASSISTANT_NAME,
    instructions: KNOWLEDGE_ASSISTANT_INSTRUCTIONS,
    model: {
      url,
      id: modelId,
      apiKey,
    },
  });
}

/**
 * Factory function to create the Knowledge Assistant definition.
 */
export function createKnowledgeAssistant(modelOverride?: AgentConstructorModel): ContextFlowAgent {
  return {
    id: KNOWLEDGE_ASSISTANT_ID,
    name: KNOWLEDGE_ASSISTANT_NAME,
    description: KNOWLEDGE_ASSISTANT_DESCRIPTION,
    agent: createMastraKnowledgeAgent(modelOverride),
  };
}

/**
 * Default singleton instance of the Knowledge Assistant agent.
 */
export const knowledgeAssistant: ContextFlowAgent = createKnowledgeAssistant();
