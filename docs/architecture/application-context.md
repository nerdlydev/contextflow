# ContextFlow — Application Context Architecture

## 1. Overview & Purpose

**Application Context** supplies relevant, trusted domain data to an AI agent *before* its first model invocation. This eliminates the need for users or client applications to manually duplicate domain entity details into conversational prompts, while ensuring the model does not guess, hallucinate, or establish authority over entity identifiers.

```text
Incoming HTTP Request (POST /api/agents/:agentId/run)
  ├── message: "Help me prepare a proposal for the current customer."
  └── resource: { type: "customer", id: "customer_001" }
              │
              ▼
Validate Request & Resource Reference Schema (Zod)
              │
              ▼
Verify Agent Supports Resource Type (crm-assistant supports "customer")
              │
              ▼
Resolve Context via ContextService & CrmContextProvider
              │
              ▼
Call Trusted Application Adapter (ReferenceApplicationAdapter)
  ├── getCustomer({ customerId: "customer_001" })
  └── listCustomerDeals({ customerId: "customer_001" })
              │
              ▼
Assemble Minimal Resolved Context (ResolvedCustomerContext)
              │
              ▼
Format as Explicit Read-Only Text Block (formatContextForPrompt)
              │
              ▼
Prepend Context to Prompt before First Model Turn
              │
              ▼
Mastra Agent Runtime / NVIDIA NIM Execution (with CRM tools)
              │
              ▼
Normalized Response Returned to Client
```

---

## 2. Core Abstractions & Contracts

ContextFlow maintains strict separation between three concepts:

1. **Resource Reference (`ResourceReference`)**:
   What the calling application wants the agent to focus on (e.g. `{ type: "customer", id: "customer_001" }`).
   *This identifies the entity; it does not grant permissions.*

2. **Trusted Execution Context (`TrustedExecutionContext`)**:
   Server-derived metadata about the execution environment (`{ agentId, tenantId?, userId? }`).
   *Currently minimal (`agentId`); prepared for authenticated identity in future blocks.*

3. **Resolved Application Context (`ResolvedApplicationContext`)**:
   The minimal, typed domain data retrieved through trusted adapters.

```typescript
export interface ContextProvider<TContext = ResolvedApplicationContext> {
  readonly resourceType: string;
  resolve(
    reference: ResourceReference,
    context?: TrustedExecutionContext,
  ): Promise<TContext>;
}
```

---

## 3. Mandatory Security Invariants

### A. Context is NOT Authorization
- Injected context is information for agent reasoning, not evidence that a requested action is authorized.
- Access to customer data in context does not grant authority to modify that customer or its associated records.
- All state-changing operations continue to require explicit tool calls through trusted application services.

### B. Do Not Trust Caller-Supplied Identity as Proof of Authority
- Resource references identify target entities; they do not establish caller permissions.
- Model-supplied `tenantId`, `userId`, or `role` fields are rejected by tool schemas and cannot bypass server-side checks.
- If authenticated identity is unavailable in this phase, operations remain governed by deterministic application rules.

### C. Context Minimization
- The resolver queries only the requested entity and its direct associations.
- The context payload contains only explicitly selected fields (`id`, `name`, `email`, `status`, active deals).
- Internal store objects, database connections, and unrelated entities are never included.

### D. Separation of Context from State Mutation
- Context assembly is strictly read-only and idempotent. Resolving context does not alter application state.
- State mutation remains exclusively within registered tools (`create_task`) and application services.

---

## 4. CRM Context Resolution

In Block 05, the `CrmContextProvider` resolves `customer` resources via `ReferenceApplicationAdapter`:
1. Fetches customer via `adapter.getCustomer({ customerId })`. If null, throws `ResourceNotFoundError`.
2. Fetches customer's active deals via `adapter.listCustomerDeals({ customerId })`.
3. Returns `ResolvedCustomerContext`:
   ```json
   {
     "resourceType": "customer",
     "customer": {
       "id": "customer_001",
       "name": "Acme Corporation",
       "email": "contact@acmewidgets.com",
       "status": "active"
     },
     "deals": [
       {
         "id": "deal_001",
         "title": "Enterprise Cloud Migration",
         "value": 120000,
         "stage": "negotiation"
       }
     ]
   }
   ```

---

## 5. Failure Handling & Edge Cases

| Scenario | Behavior | HTTP Status |
|---|---|---|
| **Unknown Resource** (`customer_999`) | `ResourceNotFoundError` thrown; fails explicitly. | **404 Not Found** |
| **Unsupported Resource Type** (`invoice`) | `UnsupportedResourceTypeError` thrown. | **400 Bad Request** |
| **Agent Lacks Context Support** (`contextflow-assistant` called with `customer`) | `AgentContextNotSupportedError` thrown. | **400 Bad Request** |
| **Empty / Missing Resource ID** | Schema validation failure. | **400 Bad Request** |
| **Message-Only Request** | Normal agent execution without context. | **200 OK** |

Context resolution never falls back to hallucinated or fabricated data. If an explicit resource is requested and cannot be resolved, the request fails safely.

---

## 6. Current Limitations & Deferred Capabilities

> [!WARNING]
> **Not a Production Multi-Tenant Authorization Engine**:
> In Block 05, caller identity is derived from the server environment (`agentId`). Multi-tenant row-level access control, authenticated user identity (`userId`), and dynamic policy enforcement are scheduled for Block 10 (Policy & Permissions).
