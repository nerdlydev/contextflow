import { z } from "@hono/zod-openapi";
import { createContextFlowTool } from "./types.js";

export const GET_CURRENT_TIME_TOOL_ID = "get_current_time";

export const GetCurrentTimeInputSchema = z.object({});

export const GetCurrentTimeOutputSchema = z.object({
  iso: z.string().openapi({
    example: "2026-10-07T12:00:00.000Z",
    description: "The current server timestamp in ISO 8601 format",
  }),
});

export const getCurrentTimeTool = createContextFlowTool({
  id: GET_CURRENT_TIME_TOOL_ID,
  name: "Get Current Time",
  description: "Returns the current server time in ISO 8601 format.",
  inputSchema: GetCurrentTimeInputSchema,
  outputSchema: GetCurrentTimeOutputSchema,
  execute: async () => {
    return {
      iso: new Date().toISOString(),
    };
  },
});
