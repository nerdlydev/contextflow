import { createRoute, z } from "@hono/zod-openapi";

/**
 * Response schema for GET /api/v1/health
 * Zod is the single source of truth — used for both runtime validation
 * and OpenAPI schema generation.
 */
export const HealthResponseSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("HealthResponse");

/**
 * GET /api/v1/health
 * Liveness check — confirms the API process is running.
 */
export const healthRoute = createRoute({
  method: "get",
  path: "/api/v1/health",
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
