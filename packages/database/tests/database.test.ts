import { describe, expect, it } from "vitest";
import { db } from "../src/index.js";

describe("@contextflow/database", () => {
  it("initializes db instance", () => {
    expect(db).toBeDefined();
    expect(typeof db.select).toBe("function");
  });
});
