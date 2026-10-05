import { describe, expect, it } from "vitest";
import app from "../src/app.js";

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

  it("includes /api/v1/health path", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths).toHaveProperty("/api/v1/health");
  });

  it("documents GET method for /api/v1/health", async () => {
    const res = await app.request("/api/openapi.json");
    const body = await res.json();
    expect(body.paths["/api/v1/health"]).toHaveProperty("get");
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
