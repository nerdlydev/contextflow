/**
 * Reference CRM Application - Domain Entity and Operation Types
 *
 * NOTE: These types represent the domain of the reference application.
 * They are intentionally decoupled from @contextflow/core to preserve
 * domain agnosticism in ContextFlow's core engine.
 */

export type CustomerStatus = "active" | "lead" | "inactive";

export type Customer = {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
};

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type Deal = {
  id: string;
  customerId: string;
  title: string;
  value: number;
  stage: DealStage;
};

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  relatedCustomerId?: string;
};

// Input and Output types for Application Operations

export type GetCustomerInput = {
  customerId: string;
};

export type ListCustomerDealsInput = {
  customerId: string;
};

export type CreateTaskInput = {
  title: string;
  relatedCustomerId?: string;
};

export type GetTaskInput = {
  taskId: string;
};
