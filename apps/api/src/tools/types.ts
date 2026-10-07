import type { z } from "@hono/zod-openapi";
import { createTool } from "@mastra/core/tools";

/**
 * Context provided to a tool during execution.
 * Minimal in Block 03, with room for tenantId/userId/executionId in future blocks.
 */
export type ToolExecutionContext = {
  agentId: string;
};

/**
 * Public metadata for a tool, used in API discovery and client documentation.
 * Never exposes execution logic or internal schemas.
 */
export type ToolMetadata = {
  id: string;
  name: string;
  description: string;
};

/**
 * Mastra runtime tool instance type.
 */
export type MastraRuntimeTool = ReturnType<typeof createTool>;

/**
 * ContextFlow-owned tool definition.
 *
 * Encapsulates capability identity, schemas, and execution logic.
 * Adapts to the underlying Mastra runtime via `toMastraTool()`.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic default to any enables heterogeneous tool collections in the registry
export type ContextFlowTool<TInput = any, TOutput = any> = ToolMetadata & {
  inputSchema?: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
  /**
   * Adapts the ContextFlow tool into a Mastra-compatible Tool instance.
   * Runtime-private to ContextFlow; never exposed in public API contracts.
   */
  toMastraTool: () => MastraRuntimeTool;
};

/**
 * Factory helper to construct a ContextFlowTool with automatic Mastra runtime adaptation.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic defaults allow heterogeneous tool creation
export function createContextFlowTool<TInput = any, TOutput = any>(options: {
  id: string;
  name: string;
  description: string;
  inputSchema?: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}): ContextFlowTool<TInput, TOutput> {
  const tool: ContextFlowTool<TInput, TOutput> = {
    id: options.id,
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
    outputSchema: options.outputSchema,
    execute: options.execute,
    toMastraTool: () => {
      return createTool({
        id: options.id,
        description: options.description,
        inputSchema: options.inputSchema as Parameters<typeof createTool>[0]["inputSchema"],
        outputSchema: options.outputSchema as Parameters<typeof createTool>[0]["outputSchema"],
        execute: async (inputData: unknown, mastraContext: unknown) => {
          const context: ToolExecutionContext = {
            agentId:
              (mastraContext as { requestContext?: { agentId?: string } })?.requestContext
                ?.agentId ?? "unknown-agent",
          };
          try {
            return await options.execute(inputData as TInput, context);
          } catch (error: unknown) {
            // Error boundary: ensure safe, clean error message to the model without leaking sensitive internals
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Tool '${options.id}' error: ${message}`);
          }
        },
      });
    },
  };

  return tool;
}
