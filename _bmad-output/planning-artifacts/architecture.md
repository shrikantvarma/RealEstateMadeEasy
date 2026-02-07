---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'RealEstateMadeEasy'
user_name: 'RealEstateMadeEasy'
date: '2026-02-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
23 FRs across 5 domains — Transcript Management (5), Chat Refinement Engine (7), Buyer Profile Output (4), Agent Dashboard (4), Adaptive Behavior (3). The core complexity lives in the chat engine's stateful question orchestration and the LLM-powered transcript parsing.

**Non-Functional Requirements:**
- Real-time streaming for buyer chat responses
- Transcript parsing within 15 seconds for up to 5,000 words
- UUID-based shareable links (non-guessable)
- No authentication for MVP; architecture must support easy auth addition
- Modern browsers only (Chrome, Safari, Edge)

**Scale & Complexity:**
- Primary domain: Full-stack web app with AI integration
- Complexity level: Medium (LLM orchestration is the hard part)
- MVP scope: Solo developer, hackathon pace

### Technical Constraints & Dependencies

**Locked-in technology decisions (user-specified):**
- **Railway** — Container-based deployment (no serverless/edge)
- **Supabase** — Postgres DB, Row Level Security, real-time subscriptions, auth-ready
- **OpenAI** — LLM provider for both parsing (structured output) and chat (streaming)

### Agent Architecture (MVP)

| Agent | Scope | Pattern |
|-------|-------|---------|
| **Transcript Parser** | Raw transcript → structured preferences with confidence scores | Single-shot, stateless, structured output |
| **Chat Strategist** | Drives buyer conversation — picks question strategies, generates natural-language questions, extracts preference updates from responses | Multi-turn, stateful, streaming. App code controls flow (sequencing, question cap), LLM generates per-turn |
| **Location Researcher** | Enriches profile with real-world location data | **Stubbed for MVP** — interface defined, not wired. Post-MVP activation |

Orchestration style: **Structured orchestration** — application code owns the state machine and agent sequencing. LLM agents are called with focused, per-turn jobs. No autonomous loops.

### Cross-Cutting Concerns

- **LLM prompt management** — two distinct prompt patterns (batch structured output vs. streaming conversational) against the same provider
- **Session state** — chat sessions must track question count, strategy history, and evolving preference profile across turns
- **Streaming** — buyer chat must stream token-by-token; agent dashboard does not need streaming
- **Error handling** — LLM calls can fail, timeout, or return malformed output. Graceful degradation needed.
- **Two distinct UIs** — agent dashboard (forms, tables, status) vs. buyer chat (conversational, minimal, mobile-friendly)

## Starter Template & Technology Stack

### Backend: FastAPI (Python)

**Foundation:** `fastapi/full-stack-fastapi-template` (41k stars, v0.10.0 Jan 2026, Railway one-click deploy)

- FastAPI 0.128+ / Python 3.12+ / Pydantic v2
- SQLModel ORM + Alembic migrations
- Docker Compose (dev + production)
- JWT auth infrastructure (activate post-MVP)
- Supabase wiring pattern from `AtticusZeller/fastapi_supabase_template`

**Project Structure (domain-based):**
```
app/
  core/         # config, security, database, dependencies
  transcripts/  # upload, parsing agent orchestration
  chat/         # chat strategist agent, SSE streaming
  profiles/     # buyer profile CRUD + scoring
  agents/       # LLM agent abstractions (parser, strategist, researcher stub)
  main.py
migrations/
tests/
Dockerfile
```

### Frontend: Vite + React SPA

**Stack:**
- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4 (shared design system)
- shadcn/ui (agent dashboard: tables, forms, cards)
- assistant-ui (buyer chat: streaming messages, auto-scroll, markdown, retry)
- TanStack Router (type-safe routing: `/dashboard/*` vs `/chat/:sessionId`)

**Rationale:** SPA talks directly to FastAPI — no intermediate Node.js server. On Railway (container-based, not Vercel), this is simpler and faster than Next.js with zero SSR complexity.

**Initialization:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npx shadcn@latest init
npm install @assistant-ui/react @tanstack/react-router
```

### Deployment: Railway (Two Services)

| Service | Type | Details |
|---------|------|---------|
| **API** | Docker container | FastAPI + Uvicorn, connects to Supabase Postgres |
| **Frontend** | Static site | Vite build served by Caddy, ~10MB image |

### External Services

| Service | Role |
|---------|------|
| **Supabase** | Postgres DB, Auth (post-MVP), Storage (transcript files) |
| **OpenAI API** | Structured output (parsing), streaming chat (strategist) |

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data access pattern: Hybrid (SQLModel + supabase-py)
- Data model schema (sessions, transcripts, preferences, chat_messages, buyer_profiles)
- API communication pattern: REST + SSE streaming
- Frontend state management: TanStack Query

**Important Decisions (Shape Architecture):**
- Auth strategy: None for MVP, Supabase Auth post-MVP
- Error handling standards for LLM failures
- Two-layout routing structure

**Deferred Decisions (Post-MVP):**
- Redis caching
- CI/CD pipeline
- Sentry monitoring
- Rate limiting

### Data Architecture

**Access Pattern: Hybrid**
- **SQLModel ORM** for all data models and Alembic migrations — typed models, schema ownership
- **supabase-py** for Auth (post-MVP) and Storage (transcript file uploads)
- Connection: SQLModel points at Supabase Postgres connection string

**Data Model:**

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `sessions` | id (uuid), created_at, status (parsing/chat_active/complete) | Root entity per buyer engagement |
| `transcripts` | id, session_id (FK), raw_text, uploaded_at | Raw agent-buyer conversation |
| `preferences` | id, session_id (FK), category, value, confidence (low/med/high), source (transcript/chat/both), is_confirmed | Individual extracted preferences |
| `chat_messages` | id, session_id (FK), role, content, strategy_used, turn_number, created_at | Full chat history |
| `buyer_profiles` | id, session_id (FK), scored_preferences (jsonb), generated_at | Final scored output for agent |

**Migration:** Alembic auto-generates from SQLModel changes.

### Authentication & Security

- **MVP:** No authentication. Sessions accessed by UUID v4 in URL (cryptographically random, non-guessable)
- **Post-MVP:** Supabase Auth via supabase-py, JWT validation middleware on FastAPI
- **CORS:** Locked to Railway frontend domain only
- **API security MVP:** Open endpoints, security through URL obscurity (UUID session links)

### API & Communication Patterns

**Style:** REST API with OpenAPI auto-docs (FastAPI built-in)

**Streaming:** SSE (Server-Sent Events) via FastAPI `StreamingResponse` with `text/event-stream` content type. Not WebSockets — SSE is simpler, unidirectional (which is all chat needs), and works through proxies.

**API Contract:**

```
POST   /api/sessions                    → Create new session
POST   /api/sessions/:id/transcript     → Upload transcript, triggers parsing
GET    /api/sessions/:id/preferences    → Parsed preferences with confidence scores
GET    /api/sessions/:id/profile        → Final scored buyer profile
POST   /api/chat/:sessionId             → Send buyer message
GET    /api/chat/:sessionId/stream      → SSE stream for assistant responses
```

**Error Handling:** Structured error responses `{ "error": "code", "message": "human-readable" }`. LLM failures return a user-friendly fallback message, never a raw 500.

### Frontend Architecture

**State Management:** TanStack Query for all server state (API calls, caching, refetching, optimistic updates). No Redux or Zustand — state lives on the server.

**Chat Integration:** Custom assistant-ui runtime adapter consuming SSE from `/api/chat/:sessionId/stream`

**Routing (TanStack Router):**
- `/dashboard/*` — Sidebar layout, shadcn/ui components (session list, transcript upload, profile viewer)
- `/chat/:sessionId` — Minimal full-screen layout, assistant-ui chat (mobile-friendly, no chrome)

### Infrastructure & Deployment

**Environment Config:** `.env` files locally, Railway environment variables in production. FastAPI reads via Pydantic `BaseSettings`.

**CI/CD:** Railway auto-deploys from GitHub push. No custom pipeline for MVP.

**Logging:** Python `logging` to stdout → Railway captures automatically.

**Monitoring:** Railway built-in metrics. Sentry deferred to post-MVP.

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase project setup + schema migration
2. FastAPI scaffolding with core models and database connection
3. Transcript upload + parser agent endpoint
4. Chat agent endpoint with SSE streaming
5. Profile generation endpoint
6. Frontend: Vite scaffold + routing + dashboard views
7. Frontend: assistant-ui chat integration
8. Railway deployment (both services)

**Cross-Component Dependencies:**
- Data model must be stable before any API endpoint work
- Parser agent must work before chat agent (chat depends on parsed preferences)
- SSE streaming contract must be defined before frontend chat adapter

## Implementation Patterns & Consistency Rules

### LLM Agent Implementation

**SDK:** Raw `openai` Python SDK (no LangChain/LlamaIndex). Two focused agents don't need a framework between them and the API.

**Model Selection:**

| Agent | Model | Rationale |
|-------|-------|-----------|
| Transcript Parser | `gpt-4o` | High accuracy needed for structured extraction, confidence scoring, contradiction detection. Single-shot call — cost is low. |
| Chat Strategist | `gpt-4o-mini` | 8-12 calls per session. Needs fast streaming latency and low cost. Conversational quality is sufficient for follow-up questions. |
| Location Researcher | `gpt-4o` (post-MVP) | Synthesis from web data needs stronger reasoning. Stubbed for now. |

**Transcript Parser Pattern — Structured Output:**
```python
response = await client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_schema", "json_schema": { ... }},
    messages=[
        {"role": "system", "content": PARSER_SYSTEM_PROMPT},
        {"role": "user", "content": transcript_text}
    ]
)
```

**Chat Strategist Pattern — Streaming with Strategy Injection:**
```python
stream = await client.chat.completions.create(
    model="gpt-4o-mini",
    stream=True,
    messages=[
        {"role": "system", "content": STRATEGIST_SYSTEM_PROMPT},
        {"role": "system", "content": f"Current profile: {profile_json}"},
        {"role": "system", "content": f"Strategy this turn: {strategy}"},
        *conversation_history
    ]
)
```
App code picks the strategy (confirm, gap-detect, contradict, lifestyle, trade-off). LLM executes it conversationally.

### Memory & State Management

**Pattern: Stateless LLM, database is the memory.**

No LangChain memory abstractions, no conversation summarization. With a hard cap of 12 questions, full conversation history is ~3,400 tokens per turn — trivially small for 128K context models.

**Per-turn prompt construction (app code):**
1. Load `preferences` from DB → inject as current profile context
2. Load `chat_messages` from DB → full conversation history
3. Count turns from DB → enforce 8-12 question cap
4. Check `strategy_used` history → pick next strategy
5. Construct prompt → call OpenAI streaming
6. Stream response → SSE to frontend
7. Save assistant message + extract preference updates → update DB

**Preference extraction:** Inline with chat response. The strategist prompt instructs the LLM to return both a conversational message and structured preference updates in a single call. Stream the text to the buyer, parse the metadata server-side.

**Crash recovery:** If the server crashes mid-session, buyer refreshes and picks up exactly where they left off — all state is in the database, nothing in-memory.

### Naming Conventions

**Database (PostgreSQL):**
- Tables: `plural_snake_case` → `sessions`, `chat_messages`, `buyer_profiles`
- Columns: `snake_case` → `session_id`, `created_at`, `is_confirmed`
- Foreign keys: `{referenced_table_singular}_id` → `session_id`
- Indexes: `ix_{table}_{column}` → `ix_preferences_session_id`

**API (REST):**
- Endpoints: plural, lowercase → `/api/sessions`, `/api/chat`
- JSON fields: `snake_case` (match Python/DB, no translation layer)
- Query params: `snake_case` → `?session_id=...`

**Backend (Python):**
- Files: `snake_case.py` → `transcript_parser.py`
- Classes: `PascalCase` → `TranscriptParser`, `BuyerProfile`
- Functions/variables: `snake_case` → `parse_transcript()`, `confidence_score`

**Frontend (TypeScript/React):**
- Components: `PascalCase.tsx` → `ChatView.tsx`, `SessionList.tsx`
- Hooks: `camelCase` → `useSession()`, `useChatStream()`
- Utils: `camelCase.ts` → `apiClient.ts`, `formatScore.ts`
- API responses consumed as snake_case (no camelCase transform)

### Format Patterns

**API Response Wrapper (all endpoints):**
```json
{ "data": { ... }, "error": null }
{ "data": null, "error": { "code": "PARSE_FAILED", "message": "..." } }
```

**Dates:** ISO 8601 strings everywhere (`"2026-02-07T15:30:00Z"`)

**Confidence scores:** String enum `"low" | "medium" | "high"`

**SSE Stream Format:**
```
event: token
data: {"content": "How"}

event: token
data: {"content": " important"}

event: done
data: {"profile_update": { ... }}
```

### Process Patterns

**Error Handling:**
- Backend: FastAPI exception handlers return structured `{ data, error }` wrapper
- Frontend: TanStack Query `onError` callbacks, toast notifications for user-facing errors
- LLM failures: `{ "error": { "code": "LLM_UNAVAILABLE", "message": "Having trouble right now. Try again?" } }`

**Loading States:** TanStack Query built-in — `isLoading`, `isError`, `data` per query. No global loading state.

**Tests:** Co-located with source files. `test_chat_service.py` next to `chat_service.py`. Frontend: `ChatView.test.tsx` next to `ChatView.tsx`.

### Enforcement

**All AI agents implementing this project MUST:**
1. Follow snake_case for all Python code and API JSON fields
2. Follow PascalCase for React components, camelCase for TS functions/variables
3. Use the `{ data, error }` response wrapper on every endpoint
4. Co-locate tests with source files
5. Organize code by feature/domain, never by type
6. Use raw OpenAI SDK — no LangChain, no LlamaIndex
7. Reconstruct full context from DB each turn — no in-memory conversation state
