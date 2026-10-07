import { z } from "@hono/zod-openapi";
import { createContextFlowTool } from "./types.js";

export const CALCULATE_TOOL_ID = "calculate";

export const CalculateInputSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "divide"])
    .describe("The arithmetic operation to perform"),
  a: z.number().describe("The first numerical operand"),
  b: z.number().describe("The second numerical operand"),
});

export type CalculateInput = z.infer<typeof CalculateInputSchema>;

export const CalculateOutputSchema = z.object({
  result: z.number().openapi({
    example: 42,
    description: "The numerical result of the calculation",
  }),
});

export const calculateTool = createContextFlowTool({
  id: CALCULATE_TOOL_ID,
  name: "Calculate",
  description: "Performs a supported arithmetic calculation (add, subtract, multiply, divide).",
  inputSchema: CalculateInputSchema,
  outputSchema: CalculateOutputSchema,
  execute: async ({ operation, a, b }: CalculateInput) => {
    switch (operation) {
      case "add":
        return { result: a + b };
      case "subtract":
        return { result: a - b };
      case "multiply":
        return { result: a * b };
      case "divide":
        if (b === 0) {
          throw new Error("Division by zero is not allowed.");
        }
        return { result: a / b };
      default: {
        const _exhaustive: never = operation;
        throw new Error(`Unsupported operation: ${_exhaustive}`);
      }
    }
  },
});
