import { afterEach, describe, expect, it, vi } from "vitest";
import { contextFlowAssistant } from "../src/agents/contextflow-assistant.js";
import { knowledgeAssistant } from "../src/agents/knowledge-assistant.js";
import app from "../src/app.js";

type GenerateReturn = Awaited<ReturnType<typeof contextFlowAssistant.agent.generate>>;

describe("Agents API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/agents", () => {
    it("returns HTTP 200 and lists metadata for all registered agents", async () => {
      const res = await app.request("/api/agents");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveProperty("agents");
      expect(Array.isArray(body.agents)).toBe(true);
      expect(body.agents).toHaveLength(2);

      expect(body.agents).toEqual([
        {
          id: "contextflow-assistant",
          name: "ContextFlow Assistant",
          description: "General development assistant for ContextFlow architecture and operations.",
        },
        {
          id: "knowledge-assistant",
          name: "Knowledge Assistant",
          description:
            "Specialized assistant for synthesizing structured knowledge, definitions, and technical concepts.",
        },
      ]);
    });
  });

  describe("POST /api/agents/:agentId/run", () => {
    describe("Successful execution across registered agents", () => {
      it("executes contextflow-assistant and returns 200 with normalized response", async () => {
        const mockGenerate = vi
          .spyOn(contextFlowAssistant.agent, "generate")
          .mockResolvedValueOnce({
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

      it("executes knowledge-assistant and returns 200 with normalized response", async () => {
        const mockGenerate = vi.spyOn(knowledgeAssistant.agent, "generate").mockResolvedValueOnce({
          text: "Hello! I am the Knowledge Assistant, ready to synthesize information.",
        } as unknown as GenerateReturn);

        const res = await app.request("/api/agents/knowledge-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Summarize the architecture." }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
          agentId: "knowledge-assistant",
          text: "Hello! I am the Knowledge Assistant, ready to synthesize information.",
        });

        expect(mockGenerate).toHaveBeenCalledTimes(1);
        expect(mockGenerate).toHaveBeenCalledWith("Summarize the architecture.");
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
        vi.spyOn(contextFlowAssistant.agent, "generate").mockRejectedValueOnce(
          new Error("Authentication failed: invalid api_key nvapi-secret-key-12345"),
        );

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
        expect(JSON.stringify(body)).not.toContain("nvapi-secret-key-12345");

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
