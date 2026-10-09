import { afterEach, describe, expect, it, vi } from "vitest";
import { contextFlowAssistant } from "../src/agents/contextflow-assistant.js";
import { crmAssistant } from "../src/agents/crm-assistant.js";
import { knowledgeAssistant } from "../src/agents/knowledge-assistant.js";
import app from "../src/app.js";

type GenerateReturn = Awaited<ReturnType<typeof contextFlowAssistant.agent.generate>>;

describe("Agents API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Agent Tool Configuration", () => {
    it("contextflow-assistant has get_current_time and calculate tools attached, and no CRM tools", async () => {
      const tools = await contextFlowAssistant.agent.listTools();
      expect(tools).toHaveProperty("get_current_time");
      expect(tools).toHaveProperty("calculate");
      expect(tools).not.toHaveProperty("get_customer");
      expect(tools).not.toHaveProperty("list_customer_deals");
      expect(tools).not.toHaveProperty("create_task");
    });

    it("knowledge-assistant does not have tools attached (selective assignment)", async () => {
      const tools = await knowledgeAssistant.agent.listTools();
      expect(Object.keys(tools)).toHaveLength(0);
    });

    it("crm-assistant has reference CRM tools attached, and no utility tools", async () => {
      const tools = await crmAssistant.agent.listTools();
      expect(tools).toHaveProperty("get_customer");
      expect(tools).toHaveProperty("list_customer_deals");
      expect(tools).toHaveProperty("create_task");
      expect(tools).not.toHaveProperty("get_current_time");
      expect(tools).not.toHaveProperty("calculate");
    });
  });

  describe("GET /api/agents", () => {
    it("returns HTTP 200 and lists metadata for all registered agents", async () => {
      const res = await app.request("/api/agents");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body).toHaveProperty("agents");
      expect(Array.isArray(body.agents)).toBe(true);
      expect(body.agents).toHaveLength(3);

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
        {
          id: "crm-assistant",
          name: "CRM Assistant",
          description:
            "Specialized assistant for managing customer relationships, deals, and tasks in the reference CRM.",
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

      it("executes contextflow-assistant with tool response", async () => {
        const mockGenerate = vi
          .spyOn(contextFlowAssistant.agent, "generate")
          .mockResolvedValueOnce({
            text: "The current server time is 2026-10-07T12:00:00.000Z.",
          } as unknown as GenerateReturn);

        const res = await app.request("/api/agents/contextflow-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "What is the current server time?",
          }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
          agentId: "contextflow-assistant",
          text: "The current server time is 2026-10-07T12:00:00.000Z.",
        });

        expect(mockGenerate).toHaveBeenCalledWith("What is the current server time?");
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

      it("executes crm-assistant and returns 200 with normalized response", async () => {
        const mockGenerate = vi.spyOn(crmAssistant.agent, "generate").mockResolvedValueOnce({
          text: "Customer Acme Corporation (customer_001) has 2 active deals totaling $150,000.",
        } as unknown as GenerateReturn);

        const res = await app.request("/api/agents/crm-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Show me deals for customer_001.",
          }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
          agentId: "crm-assistant",
          text: "Customer Acme Corporation (customer_001) has 2 active deals totaling $150,000.",
        });

        expect(mockGenerate).toHaveBeenCalledTimes(1);
        expect(mockGenerate).toHaveBeenCalledWith("Show me deals for customer_001.");
      });
    });

    describe("Application Context Integration", () => {
      it("resolves customer context and prepends to model prompt before execution", async () => {
        const mockGenerate = vi.spyOn(crmAssistant.agent, "generate").mockResolvedValueOnce({
          text: "Based on Acme Corporation's current deals, here is a proposal draft...",
        } as unknown as GenerateReturn);

        const res = await app.request("/api/agents/crm-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Help me prepare a proposal for the current customer.",
            resource: {
              type: "customer",
              id: "customer_001",
            },
          }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.agentId).toBe("crm-assistant");

        expect(mockGenerate).toHaveBeenCalledTimes(1);
        const prompt = mockGenerate.mock.calls[0][0];

        // Verify context was resolved and formatted before prompt
        expect(prompt).toContain("--- START APPLICATION CONTEXT (READ-ONLY) ---");
        expect(prompt).toContain("Customer ID: customer_001");
        expect(prompt).toContain("Name: Acme Corporation");
        expect(prompt).toContain("Enterprise Cloud Migration");
        expect(prompt).toContain("--- END APPLICATION CONTEXT ---");
        expect(prompt).toContain("Help me prepare a proposal for the current customer.");
      });

      it("returns HTTP 404 when requested resource does not exist", async () => {
        const res = await app.request("/api/agents/crm-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Help me prepare a proposal.",
            resource: {
              type: "customer",
              id: "customer_nonexistent",
            },
          }),
        });

        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.error).toContain("customer_nonexistent");
      });

      it("returns HTTP 400 when an agent is invoked with an unsupported resource type", async () => {
        const res = await app.request("/api/agents/contextflow-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Help me with this customer.",
            resource: {
              type: "customer",
              id: "customer_001",
            },
          }),
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain(
          "Agent 'contextflow-assistant' does not support context for resource type 'customer'",
        );
      });

      it("existing message-only requests continue to execute without application context", async () => {
        const mockGenerate = vi.spyOn(crmAssistant.agent, "generate").mockResolvedValueOnce({
          text: "I am ready to help with your CRM needs.",
        } as unknown as GenerateReturn);

        const res = await app.request("/api/agents/crm-assistant/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "What can you do?",
          }),
        });

        expect(res.status).toBe(200);
        expect(mockGenerate).toHaveBeenCalledTimes(1);
        expect(mockGenerate).toHaveBeenCalledWith("What can you do?");
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
