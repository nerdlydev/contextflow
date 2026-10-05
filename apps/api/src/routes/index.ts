import { OpenAPIHono } from "@hono/zod-openapi";
import { healthRoute } from "./health.js";

/**
 * v1 API router.
 *
 * All routes registered here contribute to the OpenAPI document.
 * Mount new route groups here as ContextFlow features are added.
 */
const v1Router = new OpenAPIHono();

v1Router.openapi(healthRoute, (c) => {
  return c.json({ status: "ok" });
});

export default v1Router;
