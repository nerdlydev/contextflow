import type { ToolExecutionContext } from "../tools/types.js";
import { ReferenceCrmService } from "./service.js";
import type {
  CreateTaskInput,
  Customer,
  Deal,
  GetCustomerInput,
  GetTaskInput,
  ListCustomerDealsInput,
  Task,
} from "./types.js";

/**
 * Adapter interface mediating between ContextFlow tools and host CRM operations.
 *
 * ARCHITECTURAL BOUNDARY:
 * - Exposes high-level domain actions, NEVER database or ORM primitives.
 * - Accept validated typed inputs, returns typed domain payloads.
 * - Maintains an explicit authorization seam via `context`.
 * - Mastra-independent: survives runtime migration without interface changes.
 */
export interface ReferenceApplicationAdapter {
  getCustomer(input: GetCustomerInput, context?: ToolExecutionContext): Promise<Customer | null>;

  listCustomerDeals(input: ListCustomerDealsInput, context?: ToolExecutionContext): Promise<Deal[]>;

  createTask(input: CreateTaskInput, context?: ToolExecutionContext): Promise<Task>;

  getTask(input: GetTaskInput, context?: ToolExecutionContext): Promise<Task | null>;
}

/**
 * Default implementation of ReferenceApplicationAdapter delegating to ReferenceCrmService.
 */
export class ReferenceCrmAdapter implements ReferenceApplicationAdapter {
  constructor(private readonly service: ReferenceCrmService = new ReferenceCrmService()) {}

  /**
   * Resets internal service/store state for testing.
   */
  reset(): void {
    this.service.reset();
  }

  async getCustomer(
    input: GetCustomerInput,
    context?: ToolExecutionContext,
  ): Promise<Customer | null> {
    return this.service.getCustomer(input, context);
  }

  async listCustomerDeals(
    input: ListCustomerDealsInput,
    context?: ToolExecutionContext,
  ): Promise<Deal[]> {
    return this.service.listCustomerDeals(input, context);
  }

  async createTask(input: CreateTaskInput, context?: ToolExecutionContext): Promise<Task> {
    return this.service.createTask(input, context);
  }

  async getTask(input: GetTaskInput, context?: ToolExecutionContext): Promise<Task | null> {
    return this.service.getTask(input, context);
  }
}

/**
 * Default singleton instance of ReferenceCrmAdapter.
 */
export const referenceCrmAdapter = new ReferenceCrmAdapter();
