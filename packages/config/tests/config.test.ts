import { describe, expect, it } from "vitest";
import { config } from "../src/index.js";

describe("@contextflow/config", () => {
  it("loads configuration successfully", () => {
    expect(config).toBeDefined();
    expect(typeof config.PORT).toBe("number");
    expect(config.NODE_ENV).toBeDefined();
  });
});
