import { Agent } from "@mastra/core/agent";
import { createTaskTool } from "../tools/create-task.js";
import { getCustomerTool } from "../tools/get-customer.js";
import { listCustomerDealsTool } from "../tools/list-customer-deals.js";
import type { ContextFlowAgent } from "./types.js";

export const CRM_ASSISTANT_ID = "crm-assistant";
export const CRM_ASSISTANT_NAME = "CRM Assistant";
export const CRM_ASSISTANT_DESCRIPTION =
  "Specialized assistant for managing customer relationships, deals, and tasks in the reference CRM.";

export const CRM_ASSISTANT_INSTRUCTIONS =
  "You are ContextFlow's reference CRM assistant. You assist with customer inquiries, deal tracking, and task management. Use your assigned CRM tools (get_customer, list_customer_deals, create_task) to retrieve customer details, list deals, or record tasks.";

type AgentConstructorModel = NonNullable<ConstructorParameters<typeof Agent>[0]>["model"];
type AgentToolsInput = NonNullable<ConstructorParameters<typeof Agent>[0]>["tools"];

/**
 * Default tools assigned to CRM Assistant.
 * Statically assigned reference CRM domain tools.
 */
export function getDefaultCrmAssistantTools() {
  return {
    [getCustomerTool.id]: getCustomerTool.toMastraTool(),
    [listCustomerDealsTool.id]: listCustomerDealsTool.toMastraTool(),
    [createTaskTool.id]: createTaskTool.toMastraTool(),
  };
}

/**
 * Creates the underlying Mastra Agent runtime instance for crm-assistant.
 */
export function createMastraCrmAgent(
  modelOverride?: AgentConstructorModel,
  toolsOverride?: AgentToolsInput,
): Agent {
  const tools = toolsOverride ?? getDefaultCrmAssistantTools();

  if (modelOverride) {
    return new Agent({
      id: CRM_ASSISTANT_ID,
      name: CRM_ASSISTANT_NAME,
      instructions: CRM_ASSISTANT_INSTRUCTIONS,
      model: modelOverride,
      tools,
    });
  }

  const rawModel = process.env.MODEL_NAME || "meta/llama-3.2-11b-vision-instruct";
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "";
  const url =
    process.env.MODEL_URL || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";

  if (rawModel.startsWith("openai/") && !process.env.NVIDIA_API_KEY && !process.env.MODEL_URL) {
    return new Agent({
      id: CRM_ASSISTANT_ID,
      name: CRM_ASSISTANT_NAME,
      instructions: CRM_ASSISTANT_INSTRUCTIONS,
      model: rawModel as `${string}/${string}`,
      tools,
    });
  }

  const modelId: `${string}/${string}` = rawModel.startsWith("openai/")
    ? (rawModel as `${string}/${string}`)
    : `openai/${rawModel}`;

  return new Agent({
    id: CRM_ASSISTANT_ID,
    name: CRM_ASSISTANT_NAME,
    instructions: CRM_ASSISTANT_INSTRUCTIONS,
    model: {
      url,
      id: modelId,
      apiKey,
    },
    tools,
  });
}

/**
 * Factory function to create the CRM Assistant definition.
 */
export function createCrmAssistant(
  modelOverride?: AgentConstructorModel,
  toolsOverride?: AgentToolsInput,
): ContextFlowAgent {
  return {
    id: CRM_ASSISTANT_ID,
    name: CRM_ASSISTANT_NAME,
    description: CRM_ASSISTANT_DESCRIPTION,
    agent: createMastraCrmAgent(modelOverride, toolsOverride),
    supportedResourceTypes: ["customer"],
  };
}

/**
 * Default singleton instance of the CRM Assistant agent.
 */
export const crmAssistant: ContextFlowAgent = createCrmAssistant();
