import { beforeEach, describe, expect, it } from "vitest";
import { referenceCrmAdapter } from "../src/reference-app/index.js";
import { CreateTaskToolInputSchema, createTaskTool } from "../src/tools/create-task.js";
import {
  createGetCustomerTool,
  GetCustomerToolInputSchema,
  getCustomerTool,
} from "../src/tools/get-customer.js";
import {
  ListCustomerDealsToolInputSchema,
  listCustomerDealsTool,
} from "../src/tools/list-customer-deals.js";

describe("Reference CRM Tools", () => {
  const testContext = { agentId: "crm-assistant" };

  beforeEach(() => {
    referenceCrmAdapter.reset();
  });

  describe("get_customer tool", () => {
    it("retrieves a customer successfully through the tool", async () => {
      const result = await getCustomerTool.execute({ customerId: "customer_001" }, testContext);
      expect(result).toBeDefined();
      expect(result.customer).not.toBeNull();
      expect(result.customer?.id).toBe("customer_001");
      expect(result.customer?.name).toBe("Acme Corporation");
    });

    it("returns null customer when customer is not found", async () => {
      const result = await getCustomerTool.execute({ customerId: "customer_unknown" }, testContext);
      expect(result).toBeDefined();
      expect(result.customer).toBeNull();
    });

    it("validates input schema and rejects empty customerId", () => {
      const parsed = GetCustomerToolInputSchema.safeParse({ customerId: "" });
      expect(parsed.success).toBe(false);
    });

    it("toMastraTool produces an executable Mastra tool instance", async () => {
      const mastraTool = getCustomerTool.toMastraTool();
      expect(mastraTool.id).toBe("get_customer");
      const res = await mastraTool.execute?.({ customerId: "customer_001" }, {} as never);
      expect(res).toBeDefined();
      expect((res as { customer?: { id: string } }).customer?.id).toBe("customer_001");
    });
  });

  describe("list_customer_deals tool", () => {
    it("lists deals for a known customer through the tool", async () => {
      const result = await listCustomerDealsTool.execute(
        { customerId: "customer_001" },
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.deals).toHaveLength(2);
      expect(result.deals[0].title).toBe("Enterprise Cloud Migration");
    });

    it("returns an empty deals array for a customer with no deals", async () => {
      const result = await listCustomerDealsTool.execute(
        { customerId: "customer_003" },
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.deals).toEqual([]);
    });

    it("validates input schema and rejects non-string customerId", () => {
      const parsed = ListCustomerDealsToolInputSchema.safeParse({
        customerId: 12345,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("create_task tool", () => {
    it("creates a task and returns structured task output", async () => {
      const result = await createTaskTool.execute(
        {
          title: "Follow up on pilot deployment",
          relatedCustomerId: "customer_002",
        },
        testContext,
      );

      expect(result).toBeDefined();
      expect(result.task).toBeDefined();
      expect(result.task.id).toMatch(/^task_\d{3}$/);
      expect(result.task.title).toBe("Follow up on pilot deployment");
      expect(result.task.status).toBe("pending");
      expect(result.task.relatedCustomerId).toBe("customer_002");
    });

    it("actually mutates the reference application state upon successful execution", async () => {
      const result = await createTaskTool.execute(
        {
          title: "Verify persistence state mutation",
          relatedCustomerId: "customer_001",
        },
        testContext,
      );

      expect(result.task).toBeDefined();
      const createdTaskId = result.task.id;

      // Verify the task actually exists in the backing application store through the adapter
      const storedTask = await referenceCrmAdapter.getTask({
        taskId: createdTaskId,
      });
      expect(storedTask).not.toBeNull();
      expect(storedTask?.id).toBe(createdTaskId);
      expect(storedTask?.title).toBe("Verify persistence state mutation");
      expect(storedTask?.relatedCustomerId).toBe("customer_001");
      expect(storedTask?.status).toBe("pending");
    });

    it("validates input schema and rejects empty task title", () => {
      const parsed = CreateTaskToolInputSchema.safeParse({
        title: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("fails cleanly when referencing an invalid customer", async () => {
      await expect(
        createTaskTool.execute(
          {
            title: "Follow up",
            relatedCustomerId: "customer_invalid",
          },
          testContext,
        ),
      ).rejects.toThrow("Cannot create task: Customer 'customer_invalid' does not exist.");
    });
  });

  describe("Security Boundaries & Threat Mitigation", () => {
    it("tool execution wrapper sanitizes thrown errors into safe messages", async () => {
      const failingAdapter = {
        getCustomer: async () => {
          throw new Error(
            "PG::ConnectionBad: could not connect to server at postgres://secret-user:secret-pass@internal.db:5432",
          );
        },
        listCustomerDeals: async () => [],
        createTask: async () => ({
          id: "task_001",
          title: "t",
          status: "pending" as const,
        }),
        getTask: async () => null,
      };

      const tool = createGetCustomerTool(failingAdapter);
      const mastraTool = tool.toMastraTool();

      await expect(
        mastraTool.execute?.({ customerId: "customer_001" }, {} as never),
      ).rejects.toThrow("Tool 'get_customer' error:");
    });

    it("model-supplied identity or authorization fields are stripped/ignored by schemas", () => {
      // If the LLM tries to pass attacker-controlled authorization properties
      const untrustedPayload = {
        title: "Legitimate Task",
        relatedCustomerId: "customer_001",
        tenantId: "tenant_spoofed",
        userId: "admin_superuser",
        role: "admin",
      };

      const parsed = CreateTaskToolInputSchema.parse(untrustedPayload);

      // Zod schema should only accept documented fields and not expose untrusted auth properties
      expect(parsed).toEqual({
        title: "Legitimate Task",
        relatedCustomerId: "customer_001",
      });
      expect(parsed).not.toHaveProperty("tenantId");
      expect(parsed).not.toHaveProperty("userId");
      expect(parsed).not.toHaveProperty("role");
    });

    it("tool implementations only invoke the adapter and do not expose SQL or raw DB access", () => {
      // Inspect tool objects to verify no database queries or arbitrary method calls are exposed
      const tools = [getCustomerTool, listCustomerDealsTool, createTaskTool];
      for (const t of tools) {
        expect(t).not.toHaveProperty("db");
        expect(t).not.toHaveProperty("pool");
        expect(t).not.toHaveProperty("sql");
        expect(t).not.toHaveProperty("executeSql");
        expect(t).not.toHaveProperty("query");
      }
    });
  });
});
