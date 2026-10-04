# Contributing to ContextFlow

Thank you for your interest in contributing. This guide covers the essential workflow.

---

## Development Setup

```bash
git clone https://github.com/nerdlydev/contextflow
cd contextflow
bun install
cp .env.example .env

# Start PostgreSQL
docker compose -f infra/docker/docker-compose.yml up -d

# Start the API
bun run dev
```

---

## Branch Naming

Use the following prefixes:

| Prefix      | Purpose                        |
|-------------|--------------------------------|
| `feat/`     | New features                   |
| `fix/`      | Bug fixes                      |
| `chore/`    | Tooling, dependencies, config  |
| `docs/`     | Documentation                  |
| `refactor/` | Code restructuring             |
| `test/`     | Tests only                     |

Examples:

```
feat/agent-registry
fix/health-route-typo
chore/update-biome
docs/architecture-diagram
```

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

Examples:

```
feat(api): add agent list endpoint
fix(database): handle connection timeout
chore(deps): update drizzle-orm to 0.39
docs(readme): update local setup steps
```

Keep the subject line under 72 characters. Use the body for context when needed.

---

## Running Tests

```bash
# All packages
bun test

# Watch mode
bun run test:watch

# Specific package
cd apps/api && bun test
```

---

## Biome (Lint + Format)

```bash
# Lint
bun run lint

# Format (auto-fix)
bun run format

# Format check only (CI-safe)
bun run format:check

# Lint + format together
bun run check
```

All PRs must pass Biome without errors.

---

## TypeScript

```bash
bun run typecheck
```

All PRs must pass TypeScript type checking.

---

## Pull Requests

1. Fork the repository and create your branch from `main`.
2. Make your changes with appropriate tests.
3. Ensure `bun test`, `bun run lint`, and `bun run typecheck` all pass.
4. Open a pull request with a clear title and description.
5. Reference any related issues.

PRs that break tests, introduce lint errors, or fail type checking will not be merged.

---

## Questions

Open a GitHub Discussion or Issue. Keep questions focused and include relevant context.
