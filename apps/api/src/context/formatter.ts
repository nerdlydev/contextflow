import type { ResolvedApplicationContext } from "./types.js";

/**
 * Formats resolved application context into an explicit, read-only text block
 * suitable for runtime prompt inclusion.
 *
 * SECURITY INVARIANT:
 * - Delineates context boundary explicitly with clear delimiters.
 * - Labels content as read-only application context to prevent prompt injection confusion.
 */
export function formatContextForPrompt(context: ResolvedApplicationContext): string {
  if (context.resourceType === "customer") {
    const dealsList =
      context.deals.length > 0
        ? context.deals
            .map(
              (d) =>
                `  - Deal ${d.id}: "${d.title}" | Value: $${d.value.toLocaleString()} | Stage: ${d.stage}`,
            )
            .join("\n")
        : "  - No active deals recorded";

    return [
      "--- START APPLICATION CONTEXT (READ-ONLY) ---",
      `Resource Type: Customer`,
      `Customer ID: ${context.customer.id}`,
      `Name: ${context.customer.name}`,
      `Email: ${context.customer.email}`,
      `Status: ${context.customer.status}`,
      `Associated Deals (${context.deals.length}):`,
      dealsList,
      "--- END APPLICATION CONTEXT ---",
    ].join("\n");
  }

  return "";
}
