import { z } from "@hono/zod-openapi";
import { type ReferenceApplicationAdapter, referenceCrmAdapter } from "../reference-app/index.js";
import { createContextFlowTool } from "./types.js";

export const LIST_CUSTOMER_DEALS_TOOL_ID = "list_customer_deals";

export const ListCustomerDealsToolInputSchema = z.object({
  customerId: z
    .string()
    .min(1)
    .describe("The unique semantic customer identifier, e.g. customer_001"),
});

export type ListCustomerDealsToolInput = z.infer<typeof ListCustomerDealsToolInputSchema>;

export const ListCustomerDealsToolOutputSchema = z.object({
  deals: z.array(
    z.object({
      id: z.string(),
      customerId: z.string(),
      title: z.string(),
      value: z.number(),
      stage: z.string(),
    }),
  ),
});

export type ListCustomerDealsToolOutput = z.infer<typeof ListCustomerDealsToolOutputSchema>;

/**
 * Factory to create list_customer_deals tool with an injectable adapter.
 */
export function createListCustomerDealsTool(
  adapter: ReferenceApplicationAdapter = referenceCrmAdapter,
) {
  return createContextFlowTool<ListCustomerDealsToolInput, ListCustomerDealsToolOutput>({
    id: LIST_CUSTOMER_DEALS_TOOL_ID,
    name: "List Customer Deals",
    description: "Lists all CRM deals associated with a customer.",
    inputSchema: ListCustomerDealsToolInputSchema,
    outputSchema: ListCustomerDealsToolOutputSchema,
    execute: async ({ customerId }, context) => {
      const deals = await adapter.listCustomerDeals({ customerId }, context);
      return { deals };
    },
  });
}

/**
 * Default list_customer_deals tool instance wired to the reference CRM adapter.
 */
export const listCustomerDealsTool = createListCustomerDealsTool();
