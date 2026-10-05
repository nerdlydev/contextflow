import { createRoute, z } from "@hono/zod-openapi";

/**
 * Response schema for GET /api/health
 * Zod is the single source of truth — used for both runtime validation
 * and OpenAPI schema generation.
 */
export const HealthResponseSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("HealthResponse");

/**
 * GET /api/health
 * Liveness probe — confirms the ContextFlow API process is running.
 */
export const healthRoute = createRoute({
  method: "get",
  path: "/api/health",
  tags: ["System"],
  summary: "Health check",
  description: "Liveness probe — confirms the ContextFlow API process is running.",
  responses: {
    200: {
      description: "API is healthy",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});
