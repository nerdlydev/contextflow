import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns HTTP 200", async () => {
    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);
  });

  it('returns { status: "ok" }', async () => {
    const res = await app.request("/api/v1/health");
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});
