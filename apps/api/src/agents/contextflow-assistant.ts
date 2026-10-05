import { Agent } from "@mastra/core/agent";

export const CONTEXTFLOW_ASSISTANT_ID = "contextflow-assistant";

export const CONTEXTFLOW_ASSISTANT_INSTRUCTIONS =
  "You are ContextFlow's development assistant. Answer clearly and concisely. You are currently running as the first experimental agent in ContextFlow.";

type AgentConstructorModel = NonNullable<ConstructorParameters<typeof Agent>[0]>["model"];

/**
 * Factory function to create the ContextFlow Assistant Mastra agent.
 *
 * Configured by default for NVIDIA NIM:
 * ContextFlow → Hono → AgentService → Mastra Agent → NVIDIA NIM → NVIDIA-hosted model
 *
 * Supports:
 * 1. Explicit model override (e.g. for testing)
 * 2. NVIDIA NIM via NVIDIA_API_KEY (default: https://integrate.api.nvidia.com/v1 + meta/llama-3.2-11b-vision-instruct)
 * 3. OpenAI or any other provider via MODEL_NAME and OPENAI_API_KEY
 */
export function createContextFlowAssistant(modelOverride?: AgentConstructorModel) {
  if (modelOverride) {
    return new Agent({
      id: CONTEXTFLOW_ASSISTANT_ID,
      name: "ContextFlow Assistant",
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
      name: "ContextFlow Assistant",
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
    name: "ContextFlow Assistant",
    instructions: CONTEXTFLOW_ASSISTANT_INSTRUCTIONS,
    model: {
      url,
      id: modelId,
      apiKey,
    },
  });
}

/**
 * Default instance of the first ContextFlow agent.
 */
export const contextFlowAssistant = createContextFlowAssistant();
