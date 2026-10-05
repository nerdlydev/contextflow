## First Agent

ContextFlow currently contains a minimal Mastra-powered agent (`contextflow-assistant`) configured to run against **NVIDIA NIM** (NVIDIA Inference Microservices):

```text
Hono → ContextFlow API → AgentService → Mastra Agent → NVIDIA NIM → LLM
```

The request is validated by Hono and Zod, resolved and handled by `AgentService`, and delegated to a Mastra agent executing on NVIDIA NIM.

### Configuration

Add your NVIDIA NIM API key to `.env`:

```env
NVIDIA_API_KEY=nvapi-...
MODEL_NAME=meta/llama-3.2-11b-vision-instruct
MODEL_URL=https://integrate.api.nvidia.com/v1
```

### Manual Test

```bash
curl -X POST http://localhost:3000/api/agents/contextflow-assistant/run \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain what ContextFlow is and what problem it solves."}'
```

Response:

```json
{
  "agentId": "contextflow-assistant",
  "text": "ContextFlow is an application-agnostic AI agent execution and context layer..."
}
```

> [!NOTE]
> This is the first experimental agent. The following capabilities are intentionally **not implemented yet** and belong to subsequent Lego blocks:
> - Tools are not implemented yet
> - Memory is not implemented yet
> - RAG is not implemented yet
> - MCP is not implemented yet
