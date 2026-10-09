import { beforeEach, describe, expect, it } from "vitest";
import {
  CrmContextProvider,
  crmContextProvider,
  formatContextForPrompt,
  ResourceNotFoundError,
  UnsupportedResourceTypeError,
} from "../src/context/index.js";
import { ContextService } from "../src/context/service.js";
import {
  ReferenceCrmAdapter,
  ReferenceCrmService,
  referenceCrmAdapter,
} from "../src/reference-app/index.js";
import { ReferenceCrmStore } from "../src/reference-app/store.js";

describe("Application Context Pipeline", () => {
  beforeEach(() => {
    referenceCrmAdapter.reset();
  });

  describe("CrmContextProvider", () => {
    it("resolves minimal, typed context for a valid customer reference", async () => {
      const context = await crmContextProvider.resolve({
        type: "customer",
        id: "customer_001",
      });

      expect(context).toBeDefined();
      expect(context.resourceType).toBe("customer");
      expect(context.customer).toEqual({
        id: "customer_001",
        name: "Acme Corporation",
        email: "contact@acmewidgets.com",
        status: "active",
      });
      expect(context.deals).toHaveLength(2);
      expect(context.deals[0]).toEqual({
        id: "deal_001",
        title: "Enterprise Cloud Migration",
        value: 120000,
        stage: "negotiation",
      });

      // Security check: internal store or extra fields are not leaked
      expect(context).not.toHaveProperty("store");
      expect(context).not.toHaveProperty("tasks");
    });

    it("resolves context for a customer with no deals", async () => {
      const context = await crmContextProvider.resolve({
        type: "customer",
        id: "customer_003",
      });

      expect(context).toBeDefined();
      expect(context.customer.id).toBe("customer_003");
      expect(context.deals).toEqual([]);
    });

    it("throws ResourceNotFoundError for an unknown customer ID", async () => {
      await expect(
        crmContextProvider.resolve({
          type: "customer",
          id: "customer_nonexistent",
        }),
      ).rejects.toThrow(ResourceNotFoundError);

      await expect(
        crmContextProvider.resolve({
          type: "customer",
          id: "customer_nonexistent",
        }),
      ).rejects.toThrow("Resource 'customer' with ID 'customer_nonexistent' was not found.");
    });

    it("throws UnsupportedResourceTypeError when resource type is not customer", async () => {
      await expect(
        crmContextProvider.resolve({
          type: "invoice",
          id: "inv_001",
        }),
      ).rejects.toThrow(UnsupportedResourceTypeError);
    });

    it("rejects empty or whitespace resource ID", async () => {
      await expect(
        crmContextProvider.resolve({
          type: "customer",
          id: "   ",
        }),
      ).rejects.toThrow("Resource reference ID must be a non-empty string.");
    });
  });

  describe("Context Formatter", () => {
    it("formats customer context with associated deals into a delimited read-only block", async () => {
      const context = await crmContextProvider.resolve({
        type: "customer",
        id: "customer_001",
      });
      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain("--- START APPLICATION CONTEXT (READ-ONLY) ---");
      expect(formatted).toContain("Resource Type: Customer");
      expect(formatted).toContain("Customer ID: customer_001");
      expect(formatted).toContain("Name: Acme Corporation");
      expect(formatted).toContain("Email: contact@acmewidgets.com");
      expect(formatted).toContain("Status: active");
      expect(formatted).toContain("Associated Deals (2):");
      expect(formatted).toContain(
        'Deal deal_001: "Enterprise Cloud Migration" | Value: $120,000 | Stage: negotiation',
      );
      expect(formatted).toContain("--- END APPLICATION CONTEXT ---");
    });

    it("formats customer context with zero deals cleanly", async () => {
      const context = await crmContextProvider.resolve({
        type: "customer",
        id: "customer_003",
      });
      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain("Associated Deals (0):");
      expect(formatted).toContain("No active deals recorded");
    });
  });

  describe("ContextService Orchestration", () => {
    it("dispatches resolution to registered provider by resource type", async () => {
      const service = new ContextService([crmContextProvider]);
      const resolved = await service.resolveContext({
        type: "customer",
        id: "customer_002",
      });

      expect(resolved.resourceType).toBe("customer");
      expect(resolved.customer.name).toBe("Globex Industries");

      const formatted = service.formatContext(resolved);
      expect(formatted).toContain("Globex Industries");
    });

    it("throws UnsupportedResourceTypeError when no provider matches", async () => {
      const service = new ContextService([crmContextProvider]);
      await expect(
        service.resolveContext({
          type: "product",
          id: "prod_001",
        }),
      ).rejects.toThrow("Unsupported resource type: 'product'.");
    });
  });

  describe("Security & Immutability Invariants", () => {
    it("resolving context is strictly read-only and does not mutate backing store state", async () => {
      const store = new ReferenceCrmStore();
      const crmService = new ReferenceCrmService(store);
      const adapter = new ReferenceCrmAdapter(crmService);
      const provider = new CrmContextProvider(adapter);

      // Verify task count before context resolution
      expect(store.findTaskById("task_001")).toBeDefined();
      expect(store.findTaskById("task_003")).toBeNull();

      // Resolve context multiple times
      await provider.resolve({ type: "customer", id: "customer_001" });
      await provider.resolve({ type: "customer", id: "customer_002" });

      // Backing store state must remain untouched
      expect(store.findTaskById("task_003")).toBeNull();
      expect(store.findCustomerById("customer_001")?.name).toBe("Acme Corporation");
    });
  });
});
