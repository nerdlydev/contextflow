import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("GET /", () => {
  it("redirects to /api/docs with HTTP 302", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/api/docs");
  });
});

describe("GET /api/openapi.json", () => {
  it("returns HTTP 200", async () => {
    const res = await app.request("/api/openapi.json");
    expect(res.status).toBe(200);
  });

  it("returns JSON content-type", async () => {
    const res = await app.request("/api/openapi.json");
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("contains openapi 3.1.x version", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\.1\./);
  });

  it('has info.title === "ContextFlow API"', async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.info.title).toBe("ContextFlow API");
  });

  it('has info.version === "0.1.0"', async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.info.version).toBe("0.1.0");
  });

  it("includes /api/health path", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths).toHaveProperty("/api/health");
  });

  it("documents GET method for /api/health", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths["/api/health"]).toHaveProperty("get");
  });

  it("includes health response schema", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    const schemas = body.components?.schemas ?? {};
    expect(schemas).toHaveProperty("HealthResponse");
  });

  it("includes /api/agents/{agentId}/run path", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths).toHaveProperty("/api/agents/{agentId}/run");
  });

  it("documents POST method for /api/agents/{agentId}/run", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths["/api/agents/{agentId}/run"]).toHaveProperty("post");
  });

  it("documents agentId path parameter", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    const postOp = body.paths["/api/agents/{agentId}/run"].post;
    const agentIdParam = (postOp.parameters as Array<{ name?: string; in?: string }>)?.find(
      (p) => p.name === "agentId",
    );
    expect(agentIdParam).toBeDefined();
    expect(agentIdParam?.in).toBe("path");
  });

  it("includes RunAgentRequest and RunAgentResponse schemas", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    const schemas = body.components?.schemas ?? {};
    expect(schemas).toHaveProperty("RunAgentRequest");
    expect(schemas).toHaveProperty("RunAgentResponse");
    expect(schemas).toHaveProperty("ErrorResponse");
  });
});

describe("GET /api/docs", () => {
  it("returns HTTP 200", async () => {
    const res = await app.request("/api/docs");
    expect(res.status).toBe(200);
  });

  it("returns HTML content-type", async () => {
    const res = await app.request("/api/docs");
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("contains Scalar API reference content", async () => {
    const res = await app.request("/api/docs");
    const html = await res.text();
    expect(html).toContain("scalar");
  });
});
