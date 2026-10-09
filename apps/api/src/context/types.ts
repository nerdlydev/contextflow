/**
 * ContextFlow Application Context Types & Contracts
 *
 * Distinct concepts:
 * 1. ResourceReference: What the caller wishes to discuss (e.g. { type: "customer", id: "customer_001" }).
 * 2. TrustedExecutionContext: Server-verified caller metadata (agentId, tenantId, etc.).
 * 3. ResolvedApplicationContext: Minimal, typed domain data retrieved via trusted adapters.
 */

/**
 * Reference to an application resource requested by the caller.
 * Identifies the target entity without granting authorization.
 */
export type ResourceReference = {
  type: string;
  id: string;
};

/**
 * Server-derived execution context for the request.
 * Minimal in Block 05 with agentId; prepared for tenantId/userId in future blocks.
 */
export type TrustedExecutionContext = {
  agentId: string;
  tenantId?: string;
  userId?: string;
};

/**
 * Minimal customer summary for prompt context injection.
 */
export type ResolvedCustomerContext = {
  resourceType: "customer";
  customer: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
  }>;
};

/**
 * Union of all supported resolved application context shapes.
 */
export type ResolvedApplicationContext = ResolvedCustomerContext;

/**
 * Interface implemented by context providers for specific resource types.
 */
export interface ContextProvider<TContext = ResolvedApplicationContext> {
  readonly resourceType: string;
  resolve(reference: ResourceReference, context?: TrustedExecutionContext): Promise<TContext>;
}

/**
 * Thrown when an explicitly requested resource cannot be found.
 */
export class ResourceNotFoundError extends Error {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string,
  ) {
    super(`Resource '${resourceType}' with ID '${resourceId}' was not found.`);
    this.name = "ResourceNotFoundError";
  }
}

/**
 * Thrown when a resource reference specifies an unsupported type.
 */
export class UnsupportedResourceTypeError extends Error {
  constructor(public readonly resourceType: string) {
    super(`Unsupported resource type: '${resourceType}'.`);
    this.name = "UnsupportedResourceTypeError";
  }
}

/**
 * Thrown when an agent does not support context for the requested resource type.
 */
export class AgentContextNotSupportedError extends Error {
  constructor(
    public readonly agentId: string,
    public readonly resourceType: string,
  ) {
    super(`Agent '${agentId}' does not support context for resource type '${resourceType}'.`);
    this.name = "AgentContextNotSupportedError";
  }
}
