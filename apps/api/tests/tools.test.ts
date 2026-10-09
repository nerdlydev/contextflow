import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { calculateTool } from "../src/tools/calculate.js";
import { getCurrentTimeTool } from "../src/tools/get-current-time.js";
import { createDefaultToolRegistry, ToolRegistry } from "../src/tools/registry.js";

describe("Tool System", () => {
  describe("get_current_time tool", () => {
    it("returns a valid ISO 8601 timestamp", async () => {
      const res = await getCurrentTimeTool.execute({}, { agentId: "test-agent" });
      expect(res).toBeDefined();
      expect(res).toHaveProperty("iso");
      expect(typeof res.iso).toBe("string");
      expect(Number.isNaN(Date.parse(res.iso))).toBe(false);
    });

    it("toMastraTool produces an executable Mastra tool instance", async () => {
      const mastraTool = getCurrentTimeTool.toMastraTool();
      expect(mastraTool.id).toBe("get_current_time");
      expect(typeof mastraTool.execute).toBe("function");

      const res = await mastraTool.execute?.({}, {} as never);
      expect(res).toBeDefined();
      expect(res).toHaveProperty("iso");
    });
  });

  describe("calculate tool", () => {
    const ctx = { agentId: "test-agent" };

    it("performs addition correctly", async () => {
      const res = await calculateTool.execute({ operation: "add", a: 25, b: 17 }, ctx);
      expect(res).toEqual({ result: 42 });
    });

    it("performs subtraction correctly", async () => {
      const res = await calculateTool.execute({ operation: "subtract", a: 50, b: 8 }, ctx);
      expect(res).toEqual({ result: 42 });
    });

    it("performs multiplication correctly", async () => {
      const res = await calculateTool.execute({ operation: "multiply", a: 6, b: 7 }, ctx);
      expect(res).toEqual({ result: 42 });
    });

    it("performs division correctly", async () => {
      const res = await calculateTool.execute({ operation: "divide", a: 84, b: 2 }, ctx);
      expect(res).toEqual({ result: 42 });
    });

    it("rejects division by zero with a clean error message", async () => {
      await expect(
        calculateTool.execute({ operation: "divide", a: 10, b: 0 }, ctx),
      ).rejects.toThrow("Division by zero is not allowed.");
    });
  });

  describe("ToolRegistry", () => {
    it("registers and resolves a tool by ID", () => {
      const registry = new ToolRegistry();
      registry.register(getCurrentTimeTool);

      const resolved = registry.resolve("get_current_time");
      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe("get_current_time");
      expect(resolved?.name).toBe("Get Current Time");
    });

    it("returns undefined for unknown tool ID", () => {
      const registry = new ToolRegistry();
      expect(registry.resolve("unknown_tool")).toBeUndefined();
    });

    it("throws when registering duplicate tool ID", () => {
      const registry = new ToolRegistry();
      registry.register(getCurrentTimeTool);

      expect(() => registry.register(getCurrentTimeTool)).toThrow(
        "Tool with ID 'get_current_time' is already registered",
      );
    });

    it("lists metadata without leaking execution functions or Mastra internals", () => {
      const registry = new ToolRegistry();
      registry.register(getCurrentTimeTool);
      registry.register(calculateTool);

      const metadata = registry.listMetadata();
      expect(metadata).toHaveLength(2);

      expect(metadata).toEqual([
        {
          id: "get_current_time",
          name: "Get Current Time",
          description: "Returns the current server time in ISO 8601 format.",
        },
        {
          id: "calculate",
          name: "Calculate",
          description:
            "Performs a supported arithmetic calculation (add, subtract, multiply, divide).",
        },
      ]);

      for (const item of metadata) {
        expect(item).not.toHaveProperty("execute");
        expect(item).not.toHaveProperty("toMastraTool");
      }
    });

    it("createDefaultToolRegistry pre-registers all default tools", () => {
      const defaultRegistry = createDefaultToolRegistry();
      expect(defaultRegistry.resolve("get_current_time")).toBeDefined();
      expect(defaultRegistry.resolve("calculate")).toBeDefined();
      expect(defaultRegistry.resolve("get_customer")).toBeDefined();
      expect(defaultRegistry.resolve("list_customer_deals")).toBeDefined();
      expect(defaultRegistry.resolve("create_task")).toBeDefined();
      expect(defaultRegistry.listMetadata()).toHaveLength(5);
    });
  });

  describe("GET /api/tools endpoint", () => {
    it("returns HTTP 200 with list of registered tools", async () => {
      const res = await app.request("/api/tools");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("tools");
      expect(Array.isArray(body.tools)).toBe(true);
      expect(body.tools).toHaveLength(5);

      const toolIds = body.tools.map((t: { id: string }) => t.id);
      expect(toolIds).toEqual([
        "get_current_time",
        "calculate",
        "get_customer",
        "list_customer_deals",
        "create_task",
      ]);
    });
  });
});
