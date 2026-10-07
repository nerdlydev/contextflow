import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { toolRegistry } from "../tools/registry.js";

/**
 * Public tool metadata schema.
 */
export const ToolMetadataSchema = z
  .object({
    id: z.string().openapi({
      example: "get_current_time",
      description: "The unique semantic identifier of the tool",
    }),
    name: z.string().openapi({
      example: "Get Current Time",
      description: "Human-readable display name of the tool",
    }),
    description: z.string().openapi({
      example: "Returns the current server time in ISO 8601 format.",
      description: "Summary of the tool's capability and purpose",
    }),
  })
  .openapi("ToolMetadata");

/**
 * Response schema for GET /api/tools
 */
export const ListToolsResponseSchema = z
  .object({
    tools: z.array(ToolMetadataSchema).openapi({
      description: "List of registered tools in the ContextFlow catalog",
    }),
  })
  .openapi("ListToolsResponse");

/**
 * GET /api/tools
 * Discovers and lists metadata for all registered tools.
 */
export const listToolsRoute = createRoute({
  method: "get",
  path: "/api/tools",
  tags: ["Tools"],
  summary: "List registered tools",
  description:
    "Discovers and lists public metadata for all capabilities registered in ContextFlow.",
  responses: {
    200: {
      description: "List of registered tools retrieved successfully",
      content: {
        "application/json": {
          schema: ListToolsResponseSchema,
        },
      },
    },
  },
});

export const toolsRouter = new OpenAPIHono();

toolsRouter.openapi(listToolsRoute, (c) => {
  const tools = toolRegistry.listMetadata();
  return c.json({ tools }, 200);
});
