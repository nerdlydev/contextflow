# ContextFlow — Application Adapter Architecture

## 1. Overview & Purpose

ContextFlow is designed to be an **application-agnostic agent execution and context backbone**. To keep ContextFlow's core engine decoupled from host-specific databases, domain entities, and schemas, all interactions between AI agents and application business logic flow through an **Application Adapter**.

The Reference CRM application (`Customer`, `Deal`, `Task`) serves as a concrete implementation demonstrating this architectural boundary.

```text
User / API Client
       │
  POST /api/agents/:agentId/run
       │
  AgentService
       │
  ContextFlow Agent (e.g. crm-assistant)
       │
  Mastra Runtime / LLM (NVIDIA NIM)
       │ (emits tool call request)
  ContextFlow Tool (get_customer, list_customer_deals, create_task)
       │ (validates schema & wraps execution)
  Application Adapter Interface (ReferenceApplicationAdapter)
       │ (domain method dispatch)
  Trusted Application Service (ReferenceCrmService)
       │ (business constraints & referential integrity)
  Private Backing Store (ReferenceCrmStore / future database)
```

---

## 2. Layer Responsibilities & Separation of Concerns

| Layer | Responsibility | What It Cannot Access |
|---|---|---|
| **Agent / LLM** | Proposes operations based on instructions and conversation context. | Cannot access database credentials, connection pools, SQL engines, or internal store objects. |
| **ContextFlow Tool** | Validates structured input via Zod schemas, exposes semantic metadata, and catches tool execution exceptions in an error boundary. | Cannot execute arbitrary database queries or bypass adapter contracts. |
| **Application Adapter** | Provides a strongly typed, framework-agnostic interface exposing supported domain operations. | Does not implement agent logic or runtime token loops. |
| **Trusted Application Service** | Enforces business validation, entity existence checks, and referential integrity. | Is never invoked without validated domain inputs. |
| **Private Backing Store** | Encapsulates entity storage and retrieval (in-memory in Phase 04; relational/PostgreSQL in host applications). | Completely invisible to agents and tools. |

---

## 3. Mandatory Security Invariants

### A. Zero Direct Database Access for Agents
Agents never receive database connection strings, raw SQL query capabilities, ORM handles, or arbitrary command execution primitives. A compromised or hallucinating model cannot read arbitrary tables, execute `DROP TABLE`, or bypass application logic.

### B. Separation of Authentication from AI Deliberation
- Authentication and authorization are the exclusive responsibility of **trusted, deterministic server-side application code**.
- An agent's instructions, persona, or output can **never** establish authority.
- The model cannot supply its own `tenantId`, `userId`, or `role` to grant itself permissions. Any model-supplied identity parameters are stripped or rejected by tool input validation schemas.

### C. Least Privilege & Controlled Tool Exposure
- Agents are selectively assigned tools: `contextflow-assistant` possesses only utility tools (`get_current_time`, `calculate`); `knowledge-assistant` has no tools; `crm-assistant` has access exclusively to the three reference CRM tools.
- Tools only expose narrow, typed schemas with required fields.

### D. Trusted Business Validation
- Constraints such as "a task cannot link to a nonexistent customer" and "deal lists require an existing customer ID" are strictly verified in **trusted TypeScript application code**, not delegated to the LLM's prompt adherence.

### E. Sanitized Error Boundaries
- Exceptions raised during application service execution are intercepted by the tool execution boundary.
- Error messages returned to the agent and model are sanitized (e.g. `Tool 'create_task' error: Customer 'customer_999' does not exist.`).
- Stack traces, database connection strings, file paths, and environment secrets are never exposed to the agent or API response.

---

## 4. Operation Classification: Read vs. State Mutation

In the Reference CRM adapter, operations are categorized by side-effects:

| Operation | Tool ID | Type | Description |
|---|---|---|---|
| `getCustomer` | `get_customer` | **Read-Only** | Queries customer details by ID (`customer_001`). Returns entity or null. |
| `listCustomerDeals` | `list_customer_deals` | **Read-Only** | Queries deals for an existing customer. Returns `Deal[]`. |
| `createTask` | `create_task` | **State-Mutating** | Inserts a new task (`task_003+`), verifying customer relation. |

### State Mutation Assumptions & Current Authorization Limitations
In Block 04, tool execution context contains `{ agentId }`. Because full user authentication and tenant policy infrastructure are scheduled for subsequent blocks:
1. **Current Authorization Seam**: The adapter interface receives `context?: ToolExecutionContext` (`{ agentId }`), allowing future injection of verified caller principals.
2. **Current Limitation**: Requests are currently authorized at the agent level (i.e. only agents configured with the tool may invoke it). Individual user identity and multi-tenant row-level access control are not yet enforced.
3. **Important Distinction**: The adapter pattern establishes the enforcement seam, but **an adapter is not, by itself, a complete sandboxing or authorization solution**. Production deployments require integration with an authenticated identity provider and ContextFlow's forthcoming policy enforcement engine.

---

## 5. Replacing the In-Memory Store

The `ReferenceApplicationAdapter` is an interface:

```typescript
export interface ReferenceApplicationAdapter {
  getCustomer(
    input: GetCustomerInput,
    context?: ToolExecutionContext,
  ): Promise<Customer | null>;

  listCustomerDeals(
    input: ListCustomerDealsInput,
    context?: ToolExecutionContext,
  ): Promise<Deal[]>;

  createTask(
    input: CreateTaskInput,
    context?: ToolExecutionContext,
  ): Promise<Task>;
}
```

To replace the in-memory backing store with PostgreSQL, Drizzle, or an external REST/GraphQL CRM service:
1. Implement `ReferenceApplicationAdapter` in a new class (e.g. `PostgresCrmAdapter`).
2. Pass the new adapter instance to `createGetCustomerTool(newAdapter)`, `createListCustomerDealsTool(newAdapter)`, and `createCreateTaskTool(newAdapter)`.
3. Agent definitions, tool schemas, and API routes remain completely untouched.
