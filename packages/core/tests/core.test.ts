import { describe, expect, it } from "vitest";
import type { ContextFlowVersion } from "../src/index.js";

describe("@contextflow/core", () => {
  it("can import ContextFlowVersion type", () => {
    // ContextFlowVersion is a type-only export; verify it satisfies the shape at runtime
    const version: ContextFlowVersion = { major: 0, minor: 0, patch: 1 };
    expect(version.major).toBe(0);
    expect(version.minor).toBe(0);
    expect(version.patch).toBe(1);
  });
});
