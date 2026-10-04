import { Hono } from "hono";

/**
 * The ContextFlow Hono application.
 *
 * This module exports the app instance so it can be imported
 * directly in tests without requiring a running server.
 */
const app = new Hono();

/**
 * GET /health
 * Liveness check — confirms the API process is running.
 */
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
