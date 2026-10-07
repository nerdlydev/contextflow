import { Agent } from "@mastra/core/agent";
import type { ContextFlowAgent } from "./types.js";

export const CONTEXTFLOW_ASSISTANT_ID = "contextflow-assistant";
export const CONTEXTFLOW_ASSISTANT_NAME = "ContextFlow Assistant";
export const CONTEXTFLOW_ASSISTANT_DESCRIPTION =
  "General development assistant for ContextFlow architecture and operations.";

export const CONTEXTFLOW_ASSISTANT_INSTRUCTIONS =
  "You are ContextFlow's development assistant. Answer clearly and concisely. You are currently running as an experimental agent in ContextFlow.";

type AgentConstructorModel = NonNullable<ConstructorParameters<typeof Agent>[0]>["model"];

/**
 * Creates the underlying Mastra Agent runtime instance for contextflow-assistant.
 */
export function createMastraAssistantAgent(modelOverride?: AgentConstructorModel): Agent {
  if (modelOverride) {
    return new Agent({
      id: CONTEXTFLOW_ASSISTANT_ID,
      name: CONTEXTFLOW_ASSISTANT_NAME,
      instructions: CONTEXTFLOW_ASSISTANT_INSTRUCTIONS,
      model: modelOverride,
    });
  }

  const rawModel = process.env.MODEL_NAME || "meta/llama-3.2-11b-vision-instruct";
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "";
  const url =
    process.env.MODEL_URL || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";

  // If using OpenAI provider string directly (e.g. "openai/gpt-4o-mini") without custom NIM URL
  if (rawModel.startsWith("openai/") && !process.env.NVIDIA_API_KEY && !process.env.MODEL_URL) {
    return new Agent({
      id: CONTEXTFLOW_ASSISTANT_ID,
      name: CONTEXTFLOW_ASSISTANT_NAME,
      instructions: CONTEXTFLOW_ASSISTANT_INSTRUCTIONS,
      model: rawModel as `${string}/${string}`,
    });
  }

  // Default: Route to NVIDIA NIM OpenAI-compatible endpoint
  const modelId: `${string}/${string}` = rawModel.startsWith("openai/")
    ? (rawModel as `${string}/${string}`)
    : `openai/${rawModel}`;

  return new Agent({
    id: CONTEXTFLOW_ASSISTANT_ID,
    name: CONTEXTFLOW_ASSISTANT_NAME,
    instructions: CONTEXTFLOW_ASSISTANT_INSTRUCTIONS,
    model: {
      url,
      id: modelId,
      apiKey,
    },
  });
}

/**
 * Factory function to create the ContextFlow Assistant definition.
 */
export function createContextFlowAssistant(
  modelOverride?: AgentConstructorModel,
): ContextFlowAgent {
  return {
    id: CONTEXTFLOW_ASSISTANT_ID,
    name: CONTEXTFLOW_ASSISTANT_NAME,
    description: CONTEXTFLOW_ASSISTANT_DESCRIPTION,
    agent: createMastraAssistantAgent(modelOverride),
  };
}

/**
 * Default singleton instance of the ContextFlow Assistant agent.
 */
export const contextFlowAssistant: ContextFlowAgent = createContextFlowAssistant();
