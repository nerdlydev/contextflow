import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import apiRouter from "./routes/index.js";

/**
 * The ContextFlow Hono application.
 *
 * Uses OpenAPIHono so that all registered routes automatically
 * contribute to the generated OpenAPI 3.1 document.
 *
 * Exported without a running server so tests can call app.request()
 * directly without binding to a port.
 */
const app = new OpenAPIHono();

// ---------------------------------------------------------------------------
// Root redirect
// ---------------------------------------------------------------------------

app.get("/", (c) => c.redirect("/api/docs"));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.route("/", apiRouter);

// ---------------------------------------------------------------------------
// OpenAPI 3.1 document — single source of truth
// ---------------------------------------------------------------------------

app.doc("/api/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "ContextFlow API",
    version: "0.1.0",
    description: "Application-agnostic AI agent execution and context layer.",
    license: {
      name: "MIT",
    },
    contact: {
      name: "Devesh Sharma",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
});

// ---------------------------------------------------------------------------
// Scalar interactive API reference
// ---------------------------------------------------------------------------

app.get(
  "/api/docs",
  Scalar({
    url: "/api/openapi.json",
    pageTitle: "ContextFlow API Reference",
  }),
);

export default app;
