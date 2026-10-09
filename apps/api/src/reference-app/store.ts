import type { Customer, Deal, Task } from "./types.js";

/**
 * Deterministic seed records for the reference CRM application.
 */
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "customer_001",
    name: "Acme Corporation",
    email: "contact@acmewidgets.com",
    status: "active",
  },
  {
    id: "customer_002",
    name: "Globex Industries",
    email: "info@globexcorp.com",
    status: "lead",
  },
  {
    id: "customer_003",
    name: "Soylent Logistics",
    email: "ops@soylentlogistics.com",
    status: "inactive",
  },
];

const INITIAL_DEALS: Deal[] = [
  {
    id: "deal_001",
    customerId: "customer_001",
    title: "Enterprise Cloud Migration",
    value: 120000,
    stage: "negotiation",
  },
  {
    id: "deal_002",
    customerId: "customer_001",
    title: "Annual Support Retainer",
    value: 30000,
    stage: "proposal",
  },
  {
    id: "deal_003",
    customerId: "customer_002",
    title: "Pilot Onboarding Package",
    value: 15000,
    stage: "qualified",
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "task_001",
    title: "Schedule Q4 architecture review",
    status: "pending",
    relatedCustomerId: "customer_001",
  },
  {
    id: "task_002",
    title: "Send technical onboarding questionnaire",
    status: "in_progress",
    relatedCustomerId: "customer_002",
  },
];

/**
 * In-memory data store for the reference CRM.
 *
 * SECURITY INVARIANT:
 * This store is strictly internal to the reference application layer.
 * It is never exposed directly to agents, tool definitions, or the LLM.
 */
export class ReferenceCrmStore {
  private customers = new Map<string, Customer>();
  private deals = new Map<string, Deal>();
  private tasks = new Map<string, Task>();
  private nextTaskSequence = 3;

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.customers.clear();
    this.deals.clear();
    this.tasks.clear();
    this.nextTaskSequence = 3;

    for (const c of INITIAL_CUSTOMERS) {
      this.customers.set(c.id, { ...c });
    }
    for (const d of INITIAL_DEALS) {
      this.deals.set(d.id, { ...d });
    }
    for (const t of INITIAL_TASKS) {
      this.tasks.set(t.id, { ...t });
    }
  }

  /**
   * Resets the store back to initial deterministic seed state.
   */
  reset(): void {
    this.seed();
  }

  findCustomerById(id: string): Customer | null {
    const customer = this.customers.get(id);
    return customer ? { ...customer } : null;
  }

  findDealsByCustomerId(customerId: string): Deal[] {
    const results: Deal[] = [];
    for (const deal of this.deals.values()) {
      if (deal.customerId === customerId) {
        results.push({ ...deal });
      }
    }
    return results;
  }

  createTask(data: { title: string; relatedCustomerId?: string }): Task {
    const id = `task_${String(this.nextTaskSequence++).padStart(3, "0")}`;
    const task: Task = {
      id,
      title: data.title,
      status: "pending",
      relatedCustomerId: data.relatedCustomerId,
    };
    this.tasks.set(id, { ...task });
    return { ...task };
  }

  findTaskById(id: string): Task | null {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }
}
