import { calculateTool } from "./calculate.js";
import { createTaskTool } from "./create-task.js";
import { getCurrentTimeTool } from "./get-current-time.js";
import { getCustomerTool } from "./get-customer.js";
import { listCustomerDealsTool } from "./list-customer-deals.js";
import type { ContextFlowTool, ToolMetadata } from "./types.js";

/**
 * In-memory registry responsible for cataloging and resolving ContextFlow tools.
 *
 * Owned exclusively by ContextFlow. Tools are registered independently of agents.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ContextFlowTool>();

  /**
   * Registers a ContextFlow tool into the catalog.
   * Throws an error if a tool with the same ID is already registered.
   */
  register(tool: ContextFlowTool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with ID '${tool.id}' is already registered`);
    }
    this.tools.set(tool.id, tool);
  }

  /**
   * Resolves a registered tool by its unique semantic identifier.
   * Returns undefined if not found.
   */
  resolve(toolId: string): ContextFlowTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Returns public metadata for all registered tools.
   * Excludes execution functions and runtime internals.
   */
  listMetadata(): ToolMetadata[] {
    return Array.from(this.tools.values()).map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }
}

/**
 * Creates and populates the default ContextFlow ToolRegistry with initial tools.
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(getCurrentTimeTool);
  registry.register(calculateTool);
  registry.register(getCustomerTool);
  registry.register(listCustomerDealsTool);
  registry.register(createTaskTool);
  return registry;
}

/**
 * Default singleton instance of ToolRegistry for standard application use.
 */
export const toolRegistry = createDefaultToolRegistry();
