import { type ReferenceApplicationAdapter, referenceCrmAdapter } from "../reference-app/index.js";
import {
  type ContextProvider,
  type ResolvedCustomerContext,
  ResourceNotFoundError,
  type ResourceReference,
  type TrustedExecutionContext,
  UnsupportedResourceTypeError,
} from "./types.js";

/**
 * Context Provider for "customer" resources.
 *
 * Resolves minimal, typed customer summary and associated deals
 * through the ReferenceApplicationAdapter.
 *
 * INVARIANTS:
 * - Read-only; does not mutate state.
 * - Minimal field selection; no internal entity leaks.
 * - Fails explicitly with ResourceNotFoundError if the customer does not exist.
 */
export class CrmContextProvider implements ContextProvider<ResolvedCustomerContext> {
  readonly resourceType = "customer";

  constructor(private readonly adapter: ReferenceApplicationAdapter = referenceCrmAdapter) {}

  async resolve(
    reference: ResourceReference,
    context?: TrustedExecutionContext,
  ): Promise<ResolvedCustomerContext> {
    if (reference.type !== this.resourceType) {
      throw new UnsupportedResourceTypeError(reference.type);
    }

    const customerId = reference.id?.trim();
    if (!customerId) {
      throw new Error("Resource reference ID must be a non-empty string.");
    }

    const customer = await this.adapter.getCustomer(
      { customerId },
      context ? { agentId: context.agentId } : undefined,
    );

    if (!customer) {
      throw new ResourceNotFoundError(this.resourceType, customerId);
    }

    const deals = await this.adapter.listCustomerDeals(
      { customerId },
      context ? { agentId: context.agentId } : undefined,
    );

    return {
      resourceType: "customer",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
      },
      deals: deals.map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stage: d.stage,
      })),
    };
  }
}

export const crmContextProvider = new CrmContextProvider();
