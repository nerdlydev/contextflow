import { beforeEach, describe, expect, it } from "vitest";
import { ReferenceCrmAdapter, ReferenceCrmService } from "../src/reference-app/index.js";
import { ReferenceCrmStore } from "../src/reference-app/store.js";

describe("Reference CRM Application & Adapter", () => {
  let store: ReferenceCrmStore;
  let service: ReferenceCrmService;
  let adapter: ReferenceCrmAdapter;

  beforeEach(() => {
    store = new ReferenceCrmStore();
    service = new ReferenceCrmService(store);
    adapter = new ReferenceCrmAdapter(service);
  });

  describe("Store & Seed Data Integrity", () => {
    it("initializes with deterministic customer, deal, and task seed records", () => {
      const customer = store.findCustomerById("customer_001");
      expect(customer).toBeDefined();
      expect(customer?.name).toBe("Acme Corporation");
      expect(customer?.status).toBe("active");

      const deals = store.findDealsByCustomerId("customer_001");
      expect(deals).toHaveLength(2);

      const task = store.findTaskById("task_001");
      expect(task).toBeDefined();
      expect(task?.relatedCustomerId).toBe("customer_001");
    });

    it("resets store back to initial deterministic records", () => {
      store.createTask({
        title: "Ephemeral test task",
        relatedCustomerId: "customer_001",
      });
      expect(store.findTaskById("task_003")).toBeDefined();

      store.reset();
      expect(store.findTaskById("task_003")).toBeNull();
    });
  });

  describe("Service & Adapter: Customer Retrieval", () => {
    it("retrieves a known seeded customer by ID", async () => {
      const customer = await adapter.getCustomer({
        customerId: "customer_001",
      });
      expect(customer).not.toBeNull();
      expect(customer?.id).toBe("customer_001");
      expect(customer?.name).toBe("Acme Corporation");
      expect(customer?.email).toBe("contact@acmewidgets.com");
      expect(customer?.status).toBe("active");
    });

    it("returns null for an unknown customer ID", async () => {
      const customer = await adapter.getCustomer({
        customerId: "customer_999",
      });
      expect(customer).toBeNull();
    });

    it("rejects empty or whitespace customer ID", async () => {
      await expect(adapter.getCustomer({ customerId: "   " })).rejects.toThrow(
        "Invalid customer identifier",
      );
    });
  });

  describe("Service & Adapter: Deal Association", () => {
    it("returns deals associated with customer_001", async () => {
      const deals = await adapter.listCustomerDeals({
        customerId: "customer_001",
      });
      expect(deals).toHaveLength(2);
      expect(deals.map((d) => d.id)).toEqual(["deal_001", "deal_002"]);
      expect(deals.every((d) => d.customerId === "customer_001")).toBe(true);
    });

    it("returns an empty array for a valid customer with no deals", async () => {
      const deals = await adapter.listCustomerDeals({
        customerId: "customer_003",
      });
      expect(deals).toEqual([]);
    });

    it("fails predictably when customer does not exist", async () => {
      await expect(
        adapter.listCustomerDeals({ customerId: "customer_nonexistent" }),
      ).rejects.toThrow("Customer 'customer_nonexistent' not found.");
    });
  });

  describe("Service & Adapter: Task Creation (State Mutation)", () => {
    it("creates a task without customer relation", async () => {
      const task = await adapter.createTask({
        title: "Review Q4 quarterly deliverables",
      });

      expect(task).toBeDefined();
      expect(task.id).toMatch(/^task_\d{3}$/);
      expect(task.title).toBe("Review Q4 quarterly deliverables");
      expect(task.status).toBe("pending");
      expect(task.relatedCustomerId).toBeUndefined();
    });

    it("creates a task related to an existing customer", async () => {
      const task = await adapter.createTask({
        title: "Schedule product demo follow-up",
        relatedCustomerId: "customer_002",
      });

      expect(task).toBeDefined();
      expect(task.id).toMatch(/^task_\d{3}$/);
      expect(task.relatedCustomerId).toBe("customer_002");
    });

    it("rejects task creation referencing a nonexistent customer", async () => {
      await expect(
        adapter.createTask({
          title: "Follow up with unknown lead",
          relatedCustomerId: "customer_999",
        }),
      ).rejects.toThrow("Cannot create task: Customer 'customer_999' does not exist.");
    });

    it("rejects task creation with empty title", async () => {
      await expect(adapter.createTask({ title: "   " })).rejects.toThrow(
        "Task title cannot be empty.",
      );
    });

    it("rejects task creation exceeding title length limit", async () => {
      const longTitle = "A".repeat(201);
      await expect(adapter.createTask({ title: longTitle })).rejects.toThrow(
        "Task title exceeds maximum allowed length",
      );
    });
  });
});
