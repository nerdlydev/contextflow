import { config } from "@contextflow/config";
import app from "./app.js";

/**
 * Start the Bun HTTP server.
 * Port is sourced from validated environment configuration.
 */
const server = Bun.serve({
  port: config.PORT,
  fetch: app.fetch,
});

console.log(`🚀 ContextFlow API running on http://localhost:${server.port}`);
