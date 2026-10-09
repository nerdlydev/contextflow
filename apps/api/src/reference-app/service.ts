import type { ToolExecutionContext } from "../tools/types.js";
import { ReferenceCrmStore } from "./store.js";
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
 * Trusted CRM Application Service.
 *
 * Implements business validation, entity relational integrity,
 * and operation execution against the private backing store.
 *
 * SECURITY INVARIANT:
 * Business validation and entity existence checks occur deterministically
 * in trusted code here, rather than relying on LLM prompt adherence.
 */
export class ReferenceCrmService {
  constructor(private readonly store: ReferenceCrmStore = new ReferenceCrmStore()) {}

  /**
   * Resets internal store state back to initial deterministic records.
   * Useful for test fixtures.
   */
  reset(): void {
    this.store.reset();
  }

  /**
   * Retrieves a customer by unique identifier.
   */
  async getCustomer(
    input: GetCustomerInput,
    _context?: ToolExecutionContext,
  ): Promise<Customer | null> {
    const customerId = input.customerId?.trim();
    if (!customerId) {
      throw new Error("Invalid customer identifier: must be non-empty string.");
    }

    return this.store.findCustomerById(customerId);
  }

  /**
   * Lists all deals associated with a customer.
   *
   * Fails predictably if customer does not exist.
   * Returns empty array if customer exists but has no active deals.
   */
  async listCustomerDeals(
    input: ListCustomerDealsInput,
    _context?: ToolExecutionContext,
  ): Promise<Deal[]> {
    const customerId = input.customerId?.trim();
    if (!customerId) {
      throw new Error("Invalid customer identifier: must be non-empty string.");
    }

    // Verify customer exists before querying deals
    const customer = this.store.findCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer '${customerId}' not found.`);
    }

    return this.store.findDealsByCustomerId(customerId);
  }

  /**
   * Creates a new task in the reference CRM.
   *
   * Validates title length and ensures referential integrity if a
   * related customer ID is provided.
   */
  async createTask(input: CreateTaskInput, _context?: ToolExecutionContext): Promise<Task> {
    const title = input.title?.trim();
    if (!title) {
      throw new Error("Task title cannot be empty.");
    }

    if (title.length > 200) {
      throw new Error("Task title exceeds maximum allowed length of 200 characters.");
    }

    let relatedCustomerId: string | undefined;
    if (input.relatedCustomerId) {
      relatedCustomerId = input.relatedCustomerId.trim();
      const customer = this.store.findCustomerById(relatedCustomerId);
      if (!customer) {
        throw new Error(`Cannot create task: Customer '${relatedCustomerId}' does not exist.`);
      }
    }

    return this.store.createTask({
      title,
      relatedCustomerId,
    });
  }

  /**
   * Retrieves a task by unique identifier.
   */
  async getTask(input: GetTaskInput, _context?: ToolExecutionContext): Promise<Task | null> {
    const taskId = input.taskId?.trim();
    if (!taskId) {
      throw new Error("Invalid task identifier: must be non-empty string.");
    }

    return this.store.findTaskById(taskId);
  }
}
