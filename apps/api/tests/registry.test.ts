import { describe, expect, it } from "vitest";
import { createContextFlowAssistant } from "../src/agents/contextflow-assistant.js";
import { createKnowledgeAssistant } from "../src/agents/knowledge-assistant.js";
import { AgentRegistry, createDefaultAgentRegistry } from "../src/agents/registry.js";

describe("AgentRegistry", () => {
  it("registers and resolves an agent by ID", () => {
    const registry = new AgentRegistry();
    const assistant = createContextFlowAssistant();

    registry.register(assistant);

    const resolved = registry.resolve("contextflow-assistant");
    expect(resolved).toBeDefined();
    expect(resolved?.id).toBe("contextflow-assistant");
    expect(resolved?.name).toBe("ContextFlow Assistant");
    expect(resolved?.agent).toBe(assistant.agent);
  });

  it("returns undefined when resolving an unknown agent ID", () => {
    const registry = new AgentRegistry();
    expect(registry.resolve("non-existent-agent")).toBeUndefined();
  });

  it("throws an error when attempting to register a duplicate agent ID", () => {
    const registry = new AgentRegistry();
    const assistant = createContextFlowAssistant();

    registry.register(assistant);
    expect(() => registry.register(assistant)).toThrow(
      "Agent with ID 'contextflow-assistant' is already registered",
    );
  });

  it("lists metadata without leaking runtime agent instances", () => {
    const registry = new AgentRegistry();
    const assistant = createContextFlowAssistant();
    const knowledge = createKnowledgeAssistant();

    registry.register(assistant);
    registry.register(knowledge);

    const metadataList = registry.listMetadata();
    expect(metadataList).toHaveLength(2);

    expect(metadataList).toEqual([
      {
        id: "contextflow-assistant",
        name: "ContextFlow Assistant",
        description: "General development assistant for ContextFlow architecture and operations.",
      },
      {
        id: "knowledge-assistant",
        name: "Knowledge Assistant",
        description:
          "Specialized assistant for synthesizing structured knowledge, definitions, and technical concepts.",
      },
    ]);

    // Ensure the runtime Mastra agent object is never leaked in metadata
    for (const item of metadataList) {
      expect(item).not.toHaveProperty("agent");
    }
  });

  it("createDefaultAgentRegistry pre-registers initial agents including crm-assistant", () => {
    const defaultRegistry = createDefaultAgentRegistry();

    expect(defaultRegistry.resolve("contextflow-assistant")).toBeDefined();
    expect(defaultRegistry.resolve("knowledge-assistant")).toBeDefined();
    expect(defaultRegistry.resolve("crm-assistant")).toBeDefined();
    expect(defaultRegistry.listMetadata()).toHaveLength(3);
  });
});
