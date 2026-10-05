# ADR-004: Use Milvus for Vector Storage

## Status
Accepted

## Context
ContextFlow’s Knowledge / RAG pipeline requires vector storage for indexing and semantic similarity search over document chunks. With PostgreSQL already present in the stack, we evaluated embedding vectors directly in PostgreSQL (via `pgvector`) versus using a dedicated vector database.

## Decision
Use **Milvus** as the dedicated vector database for ContextFlow V1.

## Consequences
### Positive
* Optimized for high-throughput approximate nearest neighbor (ANN) search with diverse index types (HNSW, IVF_FLAT).
* Native support for scalar metadata filtering to enforce tenant isolation (`tenantId`) and collection scoping (`sourceId`).
* Standard Docker Compose deployment for reproducible local development.
* Clear operational separation between relational business state (PostgreSQL) and high-dimensional vector embeddings.

### Negative / Tradeoffs
* Adds a separate database container in Docker Compose alongside PostgreSQL.

### Mitigations
* Encapsulate vector operations behind clean retrieval interfaces in `@contextflow/core` so alternative storage backends can be swapped if needed.
