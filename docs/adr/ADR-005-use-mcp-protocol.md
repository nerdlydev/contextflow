# ADR-005: Use Model Context Protocol (MCP) Standard SDK

## Status
Accepted

## Context
Agents must connect to external capabilities, developer tools, and enterprise systems. Rather than inventing proprietary plugin specifications or ad-hoc RPC mechanisms, ContextFlow needs a standardized integration model.

## Decision
Adopt Anthropic’s open **Model Context Protocol (MCP)** using the official TypeScript MCP SDK for external tool and resource integration.

## Consequences
### Positive
* Interoperability with the growing ecosystem of community and enterprise MCP servers (e.g., GitHub, Slack, Postgres, filesystem).
* Standardized framing for tool discovery, schema negotiation, and bidirectional RPC over standard transports (stdio, SSE).
* Reuses existing protocol engineering rather than designing custom plugin protocols.

### Negative / Tradeoffs
* The MCP standard is evolving rapidly; specification updates may require SDK bumps.

### Mitigations
* Wrap external MCP client logic behind ContextFlow’s unified `ToolRegistry` so agents interact with MCP tools identically to local tools.
