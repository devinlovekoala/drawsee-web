<div align="center">

<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" />
<img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" />
<img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" />
<img src="https://img.shields.io/badge/ReactFlow-12.4-FF0072?style=flat-square" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />

# Drawsee Web

**Tree-structured AI conversation with real-time streaming and circuit analysis**

[Live Demo](http://drawsee.cn) · [Backend Repo](https://github.com/devinlovekoala/drawsee-backend-java) · [Report Bug](https://github.com/devinlovekoala/drawsee-web/issues)

</div>

---

## What is Drawsee?

Most AI chat interfaces force thinking into a single linear thread. Drawsee replaces that with a **tree-structured conversation graph** — each response becomes a node you can branch from, explore in parallel, or revisit independently. The result is a workspace for non-linear reasoning rather than a chat log.

Beyond general conversation, Drawsee includes a vertical electronics domain: it can parse circuit schematics from PDFs, recover component topology into structured data, and answer queries that require cross-referencing diagram structure with natural language.

---

## Core Features

### Tree-Structured Conversation Graph
Each user query and AI response is a node in a directed graph rendered with [ReactFlow](https://reactflow.dev/). Nodes support branching — you can ask follow-up questions from any prior response, building a multi-path exploration tree rather than overwriting a single context window.

### Real-Time Streaming Panel
The right-side detail panel renders in-flight generation token-by-token with sub-100ms latency. This required a three-layer update strategy to guarantee liveness:

- **Event listener** — primary update path on data change events
- **100ms polling loop** — dedicated to `generating` state nodes, catches incremental text deltas that events miss
- **Auto-scroll** — content viewport follows the generation cursor automatically

This combination reduces effective display latency from 20–300ms (event-only) to near-zero, with CPU overhead bounded by the polling interval and content-diff gating.

### Knowledge Base Integration
Knowledge Q&A mode routes queries through the backend RAG pipeline (BGE-M3 + Qdrant), surfacing retrieved evidence as dedicated `knowledge-detail` nodes in the conversation tree alongside AI-generated answer nodes. The retrieval path is selectable per-message via the toolbar toggle.

### PDF Circuit Analysis
Dedicated pipeline for electronics domain PDFs: the backend recovers circuit schematics into structured `CircuitDesign` objects (component list, connection topology, SPICE netlist) and returns results as `circuit-detail` nodes. Responses stream via SSE.

### Circuit Simulation
Integrated simulation for two target domains:
- **Analog circuits** — ngspice backend, SPICE netlist execution
- **Digital circuits** — Icarus Verilog backend, HDL simulation

Results are returned as structured analysis nodes in the conversation tree.

---

## Architecture

### Node Type System

Every conversation element is typed and lifecycle-tracked:

| Node type | Description |
|-----------|-------------|
| `query` | User input node |
| `answer` | AI response summary node |
| `answer-detail` | Full AI response with streaming content |
| `knowledge` | Knowledge retrieval trigger node |
| `knowledge-detail` | Retrieved evidence + AI synthesis |
| `circuit-detail` | Circuit analysis result node |

Node lifecycle: `generating` → `completed` / `failed`

### State Management

Three React Contexts own the global state:

| Context | Responsibility |
|---------|---------------|
| `AppContext` | User session, conversation list, global UI flags |
| `FlowContext` | Node tree, selection state, layout operations |
| `DocumentContext` | Document library state |

### Auto-Focus on Generation

When a new detail node is created by the backend:

1. Node is inserted with `process: 'generating'` status immediately
2. `setSelectedNode` is called synchronously — no deferred selection
3. The right panel opens and scrolls to the new node
4. The 100ms polling loop activates for that node specifically

This ensures the detail panel tracks the active generation without requiring user interaction.

### API Layer

Uses [Alova](https://alova.js.org/) for request management, organized by domain:

```typescript
// Pattern used across all API modules
const { data, loading, send } = useRequest(apiMethod(), {
  immediate: false,
  force: true
})

send()
  .then(data => { /* success */ })
  .catch(error => toast.error(`Failed: ${error.message}`))
```

API methods live in `src/api/methods/` split by domain: `auth`, `flow`, `knowledge`, `circuit`, `document`.

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.6.2 |
| Build | Vite | 6.0.5 |
| Styling | Tailwind CSS | 3.4.13 |
| UI primitives | Radix UI | 3.2.1 |
| Icons | Lucide React | 0.474.0 |
| HTTP | Alova | 3.2.8 |
| Animation | Framer Motion | 12.5.0 |
| Graph rendering | @xyflow/react (ReactFlow) | 12.4.4 |
| Math rendering | KaTeX + react-katex | — |
| Data visualization | D3.js | 7.9.0 |
| State | React Context | — |

---

## Project Structure

```
src/
├── about/                    landing page (marketing)
├── api/
│   ├── methods/              domain-organized API methods
│   │   ├── auth.methods.ts
│   │   ├── flow.methods.ts
│   │   ├── knowledge.methods.ts
│   │   ├── circuit.methods.ts
│   │   └── document.methods.ts
│   ├── types/                TypeScript interface definitions
│   └── index.ts              Alova instance + interceptors
├── app/
│   ├── components/
│   │   ├── ui/               Radix UI component wrappers
│   │   ├── AppSideBar.tsx
│   │   └── chat-input.tsx
│   ├── contexts/
│   │   ├── AppContext.tsx
│   │   ├── FlowContext.tsx
│   │   └── DocumentContext.tsx
│   └── pages/
│       ├── blank/            new session start page
│       └── flow/             ← core module
│           ├── flow.tsx      main page + auto-focus logic
│           ├── hooks/
│           │   └── useFlowState.ts   node state machine
│           └── components/
│               ├── NodeDetailPanel.tsx   streaming panel
│               └── node/
│                   ├── AnswerPointNode.tsx
│                   ├── AnswerDetailNode.tsx
│                   ├── KnowledgeDetailNode.tsx
│                   └── ...
├── common/
├── hooks/
├── lib/
└── main.tsx

server/
├── ngspice-server.js         analog simulation backend
└── verilog-sim-server.js     digital simulation backend
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Production build (includes TypeScript check)
npm run build

# Fast build (skip TypeScript check)
npm run build-skip-ts

# Lint (required before commit)
npm run lint

# Preview production build
npm run preview
```

### Simulation Servers (optional)

```bash
# Analog circuit simulation (ngspice)
npm run ngspice:serve

# Digital circuit simulation (Icarus Verilog)
npm run verilog:serve

# Docker deployment
npm run docker:build && npm run docker:up
```

See `doc/` for detailed simulation setup guides.

---

## Development Guidelines

### Code Quality
- All commits must pass `npm run lint` — no ESLint errors
- No `any` types — use explicit TypeScript interfaces
- Single files kept to 300–400 lines
- `useMemo`, `useCallback`, `React.memo` used where measurable

### Naming Conventions
- Components: `PascalCase`
- Hooks: `use` prefix + `camelCase`
- Utilities: `camelCase`
- Types/interfaces: `PascalCase`, defined in `types/` directories

### Styling
- Tailwind CSS utility classes first
- Complex custom styles in separate CSS files — no inline `style` strings
- Animations via Framer Motion
- Icons via Lucide React

> **Note:** Tailwind CSS is pinned to 3.4.13. Upgrading to 4.x requires careful evaluation.

---

## Backend

The backend service (Spring Boot 3, Java 21) handles RAG ingestion, circuit structure recovery, LLM orchestration, and simulation task queuing.

→ **[drawsee-backend-java](https://github.com/devinlovekoala/drawsee-backend-java)**

---

## Design Decisions

**Why a tree instead of a linear chat?**
Linear chat forces a single context window that grows stale as conversation diverges. A tree lets each branch maintain its own context path. Users can explore "what if I asked differently" without losing the original thread — which is especially useful in an educational context where understanding a concept often requires approaching it from multiple angles.

**Why three update layers for streaming display?**
SSE events from the backend are not guaranteed to fire on every token in all browser/network conditions. A pure event-driven approach produced visible lag and missed increments. The 100ms polling loop acts as a safety net specifically for `generating` nodes, with content-diff gating to avoid redundant renders. The combination is reliable without being expensive.

**Why Alova over axios?**
Alova's request lifecycle model (states, caching, retry) eliminates boilerplate that would otherwise accumulate across 15+ API methods. The `useRequest` hook integrates cleanly with React's rendering model without additional state management code.

---

## Acknowledgements

Built on [ReactFlow / @xyflow/react](https://reactflow.dev/), [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/), [Alova](https://alova.js.org/), and [KaTeX](https://katex.org/).
