import { afterEach, describe, expect, it, vi } from "vitest";
import { contextFlowAssistant } from "../src/agents/contextflow-assistant.js";
import app from "../src/app.js";

type GenerateReturn = Awaited<ReturnType<typeof contextFlowAssistant.generate>>;

describe("POST /api/agents/:agentId/run", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful execution", () => {
    it("executes contextflow-assistant and returns 200 with normalized response", async () => {
      const mockGenerate = vi.spyOn(contextFlowAssistant, "generate").mockResolvedValueOnce({
        text: "Hello! I am ContextFlow's development assistant.",
      } as unknown as GenerateReturn);

      const res = await app.request("/api/agents/contextflow-assistant/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        agentId: "contextflow-assistant",
        text: "Hello! I am ContextFlow's development assistant.",
      });

      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockGenerate).toHaveBeenCalledWith("Hello");
    });
  });

  describe("Unknown agent", () => {
    it("returns HTTP 404 when an unknown agent ID is requested", async () => {
      const res = await app.request("/api/agents/unknown/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello" }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("unknown");
    });
  });

  describe("Invalid request", () => {
    it("returns HTTP 400 when message is missing", async () => {
      const res = await app.request("/api/agents/contextflow-assistant/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("returns HTTP 400 when message is empty", async () => {
      const res = await app.request("/api/agents/contextflow-assistant/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  describe("Model failure handling", () => {
    it("returns HTTP 500 without leaking credentials or stack traces when model fails", async () => {
      vi.spyOn(contextFlowAssistant, "generate").mockRejectedValueOnce(
        new Error("Authentication failed: invalid api_key sk-secret-key-12345"),
      );

      // Suppress expected console.error during test
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await app.request("/api/agents/contextflow-assistant/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello" }),
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({
        error: "Agent execution failed due to an underlying model provider error.",
      });
      // Ensure raw credentials are never leaked in response
      expect(JSON.stringify(body)).not.toContain("sk-secret-key-12345");

      consoleErrorSpy.mockRestore();
    });
  });
});
