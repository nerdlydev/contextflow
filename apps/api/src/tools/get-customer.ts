import { z } from "@hono/zod-openapi";
import { type ReferenceApplicationAdapter, referenceCrmAdapter } from "../reference-app/index.js";
import { createContextFlowTool } from "./types.js";

export const GET_CUSTOMER_TOOL_ID = "get_customer";

export const GetCustomerToolInputSchema = z.object({
  customerId: z
    .string()
    .min(1)
    .describe("The unique semantic customer identifier, e.g. customer_001"),
});

export type GetCustomerToolInput = z.infer<typeof GetCustomerToolInputSchema>;

export const GetCustomerToolOutputSchema = z.object({
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      status: z.enum(["active", "lead", "inactive"]),
    })
    .nullable()
    .describe("The customer details, or null if the customer was not found"),
});

export type GetCustomerToolOutput = z.infer<typeof GetCustomerToolOutputSchema>;

/**
 * Factory to create get_customer tool with an injectable adapter.
 */
export function createGetCustomerTool(adapter: ReferenceApplicationAdapter = referenceCrmAdapter) {
  return createContextFlowTool<GetCustomerToolInput, GetCustomerToolOutput>({
    id: GET_CUSTOMER_TOOL_ID,
    name: "Get Customer",
    description: "Retrieves customer details from the reference CRM by customer ID.",
    inputSchema: GetCustomerToolInputSchema,
    outputSchema: GetCustomerToolOutputSchema,
    execute: async ({ customerId }, context) => {
      const customer = await adapter.getCustomer({ customerId }, context);
      return { customer };
    },
  });
}

/**
 * Default get_customer tool instance wired to the reference CRM adapter.
 */
export const getCustomerTool = createGetCustomerTool();
