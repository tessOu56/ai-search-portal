# AGENT_CAPABILITIES.md

Describe the canonical capability boundaries, context layers, and agent classes for this repository. This document is **model-agnostic and tool-agnostic**; any tool or model should treat it as the source of truth for "what agents can do" and "where project truth lives." Tool-specific configs (e.g. `.cursor/rules`, `.claude/`) are adapters that point here and extend with format-only rules—they must not override canonical project rules.

---

## Purpose

This file describes this repo’s **canonical capability boundaries**, **context layers**, and **agent classes**, for alignment by humans and any AI tool. It is written to be independent of any specific model or product (e.g. Cursor, Claude, or future tools). Those tools use adapter configs that reference this file and [AGENTS.md](AGENTS.md); they do not define their own worldview.

---

## Canonical Sources

- **specs/** — Single source of truth for contracts (API, schema, future tool contracts). Any agent must treat `specs/` as the canonical contract source.
- **docs/** — Engineering knowledge (architecture, conventions, runbooks, product context). Index: [docs/README.md](docs/README.md).
- **AGENTS.md** — Agent entry and workflow (what to read first, how to run, Git, quality, prohibitions).
- **AGENT_CAPABILITIES.md** — This file; capability boundaries and agent classes.
- **README.md** — Project overview and quick start.

**Any agent must treat these as canonical; tool-specific configs must not override them.** Tool-specific instructions should only extend, not override, canonical project rules.

---

## Context Layers

| Layer                      | Purpose                                         | This repo                                              |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| **Contract**               | Verifiable contracts; code and agents obey      | `specs/`, `app/shared/contracts/`                      |
| **Engineering knowledge**  | Architecture, conventions, runbooks, product    | `docs/` (architecture, conventions, runbooks, product) |
| **Organizational context** | Decisions, meetings, product context (optional) | Optional `docs/context/` or external; future RAG       |
| **Agent entry**            | What to read first, workflow, prohibitions      | [AGENTS.md](AGENTS.md), this file                      |

---

## Agent Classes

Each class is described by: primary inputs, modifiable scope, out-of-scope, suitable tasks, whether it may call tools, whether it may rely on external knowledge. Tools and models map onto these classes; the repo does not define behavior per tool name.

### Coding Agent

- **Primary inputs**: Branch-local `specs/`, `docs/`, [AGENTS.md](AGENTS.md), source code, schema, tests, config.
- **Modifiable scope**: Code and tests under `app/`; `docs/` and `specs/` may be updated when following conventions.
- **Out of scope**: Must not `fetch()` URLs outside the contract in components; must not violate dependency rules in [docs/architecture/repo-layers.md](docs/architecture/repo-layers.md); must use `git rm` when deleting tracked files to preserve history. When design-system or Figma MCP is in use: (1) must not add new UI components or new primitive variants without human confirmation; may update design tokens (values only) and docs only; (2) **Token policy**: may only modify existing token values, must not add new primitive tokens—if design has undefined tokens, mark for human confirmation; (3) must not add or change layout based on Figma frame spec; layout authority stays in repo patterns (see [docs/architecture/figma-mcp.md](docs/architecture/figma-mcp.md) §4).
- **Suitable tasks**: Completion, refactor, feature implementation, bug fixes, tests, updating docs to match changes.
- **Tools**: Request only contract-defined paths via useFetcher or shared api; must not call arbitrary external APIs from UI.
- **External knowledge**: Repo canonical sources only; no default reliance on external wiki.

### Review Agent

- **Primary inputs**: Same as Coding Agent, plus diff and PR description.
- **Modifiable scope**: Suggestions and comments only; no direct code edits unless explicitly authorized.
- **Out of scope**: Must not suggest bypassing contract or dependency rules.
- **Suitable tasks**: PR review, compliance checks, suggesting test and doc updates.
- **Tools / external knowledge**: Same boundaries as Coding Agent.

### Retrieval Agent (future)

- **Primary inputs**: `docs/` and `specs/` indexed/chunked for retrieval; optional external wiki.
- **Modifiable scope**: None; read-only retrieval and summarization.
- **Out of scope**: Must not produce executable edits; must not act as contract truth.
- **Suitable tasks**: Q&A, search, summarization, citing sources.
- **Tools**: Retriever / RAG; must not modify repo.
- **External knowledge**: May plug in Confluence, Notion, etc. as supplementary context.

### Workflow / Tool Agent (future)

- **Primary inputs**: `specs/` (API, tool contracts), runtime parameters.
- **Modifiable scope**: Only invoke APIs or run actions defined in tool contracts.
- **Out of scope**: May use only interfaces defined in specs.
- **Suitable tasks**: Calling APIs, running build/test scripts, CI integration.
- **Tools**: Governed by specs (e.g. OpenAPI, tool-contracts); must not invent interfaces.
- **External knowledge**: Depends on implementation.

---

## Tool-Specific Adapters

Adapters do two things only: (1) point to canonical docs (AGENTS.md, this file, docs/, specs/), (2) add tool-specific limits or format requirements. They do not define project truth.

- **Current in this repo**:
  - `.cursor/rules/*.mdc` — Kept in sync with AGENTS.md; do not define architecture/product truth here; only reference docs/ and specs/.
  - `.claude/` (if present) — Points to AGENTS.md and this file; details in docs/, specs/.
- **Future**: e.g. `.github/copilot-instructions.md`, internal agent profiles—same principle: **extend, do not override**.

---

## Extension Policy

Tool-specific rules may **extend** canonical project rules (e.g. Cursor globs, Claude prompt format). They must **not override** canonical rules for source of truth, contract layer, dependency direction, or prohibitions. In case of conflict, AGENTS.md, this file, and specs/ and docs/ win.

---

## What Changes Require Which Updates

- **New or changed API**: Update [specs/api/handler-mapping.md](specs/api/handler-mapping.md), `app/test/handlers.ts`, and contract schema as needed. See [docs/conventions/data-test-driven.md](docs/conventions/data-test-driven.md).
- **Architecture or directory layout change**: Update [docs/architecture/](docs/architecture/), [AGENTS.md](AGENTS.md), and this file’s Context Layers / Canonical Sources.
- **New agent class or adapter**: Update this file’s Agent Classes or Tool-Specific Adapters section.

---

## Future Multi-Model Strategy

This repo is designed to support multiple models by keeping **canonical project context model-agnostic** and keeping **tools as adapters only**. Main docs (AGENTS.md, this file, docs/, specs/) do not name tools or models. Routing (e.g. complex refactor → model A, long-doc retrieval → model B, PR review → model C) is done by an outer layer or adapter that maps to the agent classes defined here; the repo spec does not need to be rewritten.
