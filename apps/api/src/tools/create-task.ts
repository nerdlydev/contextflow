import { z } from "@hono/zod-openapi";
import { type ReferenceApplicationAdapter, referenceCrmAdapter } from "../reference-app/index.js";
import { createContextFlowTool } from "./types.js";

export const CREATE_TASK_TOOL_ID = "create_task";

export const CreateTaskToolInputSchema = z.object({
  title: z.string().min(1).max(200).describe("The title or description of the task to create"),
  relatedCustomerId: z
    .string()
    .min(1)
    .optional()
    .describe("Optional customer ID to associate the task with (e.g. customer_001)"),
});

export type CreateTaskToolInput = z.infer<typeof CreateTaskToolInputSchema>;

export const CreateTaskToolOutputSchema = z.object({
  task: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    relatedCustomerId: z.string().optional(),
  }),
});

export type CreateTaskToolOutput = z.infer<typeof CreateTaskToolOutputSchema>;

/**
 * Factory to create create_task tool with an injectable adapter.
 */
export function createCreateTaskTool(adapter: ReferenceApplicationAdapter = referenceCrmAdapter) {
  return createContextFlowTool<CreateTaskToolInput, CreateTaskToolOutput>({
    id: CREATE_TASK_TOOL_ID,
    name: "Create Task",
    description: "Creates a new task in the reference CRM, optionally associated with a customer.",
    inputSchema: CreateTaskToolInputSchema,
    outputSchema: CreateTaskToolOutputSchema,
    execute: async ({ title, relatedCustomerId }, context) => {
      const task = await adapter.createTask({ title, relatedCustomerId }, context);
      return { task };
    },
  });
}

/**
 * Default create_task tool instance wired to the reference CRM adapter.
 */
export const createTaskTool = createCreateTaskTool();
