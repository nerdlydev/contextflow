import { OpenAPIHono } from "@hono/zod-openapi";
import { agentsRouter } from "./agents.js";
import { healthRoute } from "./health.js";
import { toolsRouter } from "./tools.js";

/**
 * API router.
 *
 * All routes registered here contribute to the OpenAPI document.
 * Mount new route groups here as ContextFlow features are added
 * (agents, executions, threads, tools, knowledge, mcp).
 */
const apiRouter = new OpenAPIHono();

apiRouter.openapi(healthRoute, (c) => {
  return c.json({ status: "ok" });
});

apiRouter.route("/", agentsRouter);
apiRouter.route("/", toolsRouter);

export default apiRouter;
