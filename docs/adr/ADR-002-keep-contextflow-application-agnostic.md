# ADR-002: Keep ContextFlow Core Application-Agnostic

## Status
Accepted

## Context
ContextFlow is designed to power AI agents across diverse domains (CRMs, ERPs, support platforms, code repositories). Hardcoding domain entities (such as `Deal`, `Contact`, `Company`, `Ticket`) into ContextFlow core would tightly couple the system to a single domain and defeat its purpose as a general execution layer.

## Decision
Keep `@contextflow/core` strictly **application-agnostic**. Domain entities and business logic belong exclusively inside external host applications or reference adapters (e.g., `CRMAdapter`, `MockApplicationAdapter`).

## Consequences
### Positive
* Enables ContextFlow to integrate with any host system without domain impedance mismatches.
* Keeps the core engine small, stable, and focused on context assembly, policy enforcement, tool governance, and execution tracking.
* Changes to an external application's schema never require modifying ContextFlow core.

### Negative / Tradeoffs
* Requires generic abstraction layers (`ContextProvider`, `ApplicationAdapter`, `RequestContext`) with interface indirection.

### Mitigations
* Include a lightweight reference CRM application and adapter in V1 to demonstrate how concrete application data maps cleanly to ContextFlow's generic interfaces.
