# ContextFlow

> ContextFlow is an application-agnostic AI agent execution and context layer built with TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-orange.svg)]()

> [!WARNING]
> **Early development / experimental.** The API is unstable and breaking changes will occur without notice.
> Do not use in production.

---

## Vision

ContextFlow aims to be the execution and context backbone for AI-powered applications — independent of any specific product, UI, or AI provider.

Once mature, ContextFlow will provide:

- **Configurable AI agents** — orchestrate complex, multi-step tasks
- **Tool system** — extend agents with typed, composable capabilities
- **Application context** — structured context injection for accurate, grounded responses
- **RAG** — retrieval-augmented generation over your own data
- **Memory** — short-term and long-term agent memory
- **MCP** — Model Context Protocol integration
- **Permissions & policies** — per-agent execution controls
- **Execution limits** — rate limits, timeouts, cost budgets
- **Observability** — traces, logs, and evaluation hooks

---

## Architecture

```
                 ContextFlow
                      │
              ┌───────┴───────┐
              │               │
          Hono API        Core Domain
              │               │
              └───────┬───────┘
                      │
                 PostgreSQL
                      │
                 Drizzle ORM

        Future AI capabilities:
        Agents / RAG / MCP / Memory
```

---

## Current Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Runtime        | Bun                     |
| Language       | TypeScript              |
| API            | Hono                    |
| API Contract   | OpenAPI 3.1             |
| API Docs       | Scalar                  |
| Validation     | Zod                     |
| Agent Runtime  | Mastra                  |
| Model Provider | NVIDIA NIM              |
| Database       | PostgreSQL 17           |
| ORM            | Drizzle ORM             |
| Lint/Format    | Biome                   |
| Testing        | Vitest                  |
| Infrastructure | Docker Compose          |

---

## Monorepo Structure

```
contextflow/
├── apps/
│   └── api/              # Hono HTTP API & Mastra Agent integration
│
├── packages/
│   ├── core/             # Domain abstractions
│   ├── config/           # Zod-validated environment configuration
│   └── database/         # Drizzle ORM + PostgreSQL client
│
├── infra/
│   └── docker/
│       └── docker-compose.yml
│
├── docs/
│   └── architecture/
│
└── scripts/
```

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [Docker](https://www.docker.com) (for PostgreSQL)
- [Git](https://git-scm.com)

### Setup

```bash
git clone https://github.com/nerdlydev/contextflow
cd contextflow
bun install
cp .env.example .env
```

Add your NVIDIA NIM API key to `.env`:

```env
NVIDIA_API_KEY=nvapi-...
MODEL_NAME=meta/llama-3.2-11b-vision-instruct
MODEL_URL=https://integrate.api.nvidia.com/v1
```

### Start PostgreSQL

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

### Start the API

```bash
bun run dev
```

### Verify Health

```bash
curl http://localhost:3000/api/health
# → {"status":"ok"}
```

---

## Development Commands

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `bun run dev`         | Start API in hot-reload mode         |
| `bun test`            | Run all tests across all packages    |
| `bun run test:watch`  | Run tests in watch mode              |
| `bun run lint`        | Run Biome linter                     |
| `bun run format`      | Auto-format with Biome               |
| `bun run format:check`| Check formatting without writing     |
| `bun run check`       | Run Biome lint + format together     |
| `bun run typecheck`   | TypeScript type check (no emit)      |

### Stop PostgreSQL

```bash
docker compose -f infra/docker/docker-compose.yml down
```

---

## API Documentation

ContextFlow uses **OpenAPI 3.1** as its API contract and **Scalar** as its interactive API reference. API schemas are defined with Zod and used for both runtime validation and OpenAPI generation.

| Endpoint | Description |
|---|---|
| [`/api/docs`](http://localhost:3000/api/docs) | Interactive Scalar API Reference |
| [`/api/openapi.json`](http://localhost:3000/api/openapi.json) | OpenAPI 3.1 document (JSON) |
| [`/api/health`](http://localhost:3000/api/health) | Health check probe |
| [`/api/agents`](http://localhost:3000/api/docs#tag/Agents/GET/api/agents) | Discover and list registered agents |
| [`/api/agents/:agentId/run`](http://localhost:3000/api/docs#tag/Agents/POST/api/agents/{agentId}/run) | Run an agent by ID |

---

## Agent Registry

ContextFlow manages agents through an **in-memory Agent Registry**. `AgentService` resolves agents through the registry without hard-coding specific agent implementations.

```text
Hono API → AgentRegistry → ContextFlowAgent → Mastra Runtime → NVIDIA NIM
```

### 1. Discover Registered Agents

```bash
curl http://localhost:3000/api/agents
```

Response:

```json
{
  "agents": [
    {
      "id": "contextflow-assistant",
      "name": "ContextFlow Assistant",
      "description": "General development assistant for ContextFlow architecture and operations."
    },
    {
      "id": "knowledge-assistant",
      "name": "Knowledge Assistant",
      "description": "Specialized assistant for synthesizing structured knowledge, definitions, and technical concepts."
    }
  ]
}
```

### 2. Execute an Agent

**ContextFlow Assistant:**

```bash
curl -X POST http://localhost:3000/api/agents/contextflow-assistant/run \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain what ContextFlow is and what problem it solves."}'
```

**Knowledge Assistant:**

```bash
curl -X POST http://localhost:3000/api/agents/knowledge-assistant/run \
  -H "Content-Type: application/json" \
  -d '{"message":"Define Retrieval-Augmented Generation."}'
```

Response:

```json
{
  "agentId": "contextflow-assistant",
  "text": "ContextFlow is an AI-powered conversational platform..."
}
```

---

## Roadmap

```
[x] Repository foundation
[x] Hono API
[x] PostgreSQL development environment
[x] OpenAPI 3.1 contract
[x] Scalar interactive API reference
[x] First agent (Mastra + NVIDIA NIM)
[x] Agent registry (In-memory multi-agent resolution)

[ ] Tool system
[ ] Reference application
[ ] Application context
[ ] RAG
[ ] Reranking
[ ] Memory
[ ] MCP
[ ] Policies
[ ] Execution limits
[ ] Observability
[ ] Evaluation
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](./LICENSE).

Copyright © 2025 Devesh Sharma
