---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-07.md'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - RealEstateMadeEasy

**Author:** RealEstateMadeEasy
**Date:** 2026-02-07

## Executive Summary

RealEstateMadeEasy is an AI-powered buyer profiling tool for real estate agents. It parses real agent-buyer conversation transcripts, extracts weighted preference criteria with confidence scores, and refines them through a conversational AI chat with the buyer. The output is a scored buyer profile that agents can use to match properties.

**Core Differentiator:** Bridges the gap between what buyers articulate in conversation and what they actually need — using NLP transcript parsing combined with a structured conversational refinement engine.

## Success Criteria

### User Success

- Buyer completes preference refinement chat in under 5 minutes
- Agent receives a scored buyer profile they can immediately act on
- Buyer feels understood, not interrogated (casual phrasing, 8-12 question cap)

### Business Success

- Working demo: end-to-end flow from transcript upload to scored profile
- At least one real transcript successfully parsed and refined through chat

### Technical Success

- Transcript parser extracts preferences with confidence scores
- Chat agent dynamically generates follow-up questions from the playbook
- Scored buyer profile output is structured and readable

### Measurable Outcomes

- Transcript-to-profile pipeline completes in a single session
- Extracted preferences match what a human would identify from the same transcript
- Follow-up questions are relevant and non-redundant

## Product Scope

### MVP - Minimum Viable Product

1. Transcript parsing + weighted criteria extraction
2. Chat follow-up with question playbook (confirm, gap-detect, contradict, lifestyle, trade-off)
3. Warm-up funnel sequencing, session limiter (8-12 questions), casual phrasing
4. Scored buyer profile output for the agent

### Growth Features (Post-MVP)

- Listing-based reaction calibration (show 3-5 real properties, capture reactions)
- Dream vs. right-now dual profiling
- Interest detector (reallocate question budget based on engagement)
- "Good Enough" detector (stop when confidence is high)

### Vision (Future)

- Swipe calibration UI for zero-effort preference extraction
- Taste cluster profiling (Netflix-style)
- "People Like You" aggregate buyer signals
- Discovery nudge recommendations (70/30 match vs. stretch)

## User Journeys

### Journey 1: Sarah the Home Buyer (Primary — Happy Path)

Sarah just had a 30-minute call with her realtor about finding a new home. She gets a text link: "Your agent wants to make sure we find the perfect home for you." She opens the chat. The AI greets her casually, confirms what it picked up from her conversation — "Sounds like you're looking for a 3-bed near good schools in the $500K range. How accurate is that, 1-10?" Sarah says "8, but the school district is more like a must-have." The AI digs deeper on schools, surfaces a gap ("You didn't mention commute — does that matter?"), and gently flags a contradiction ("You want quiet but also walkable nightlife — how do you balance that?"). After 10 questions, it summarizes her profile. Sarah feels heard, not interrogated. Done in 4 minutes.

**Reveals:** Chat UI, transcript-driven question generation, confidence scoring, session limiting, profile summary view.

### Journey 2: Mike the Real Estate Agent (Primary — Operations)

Mike just finished a discovery call with a new client. He logs in, uploads/pastes the transcript, and hits "Analyze." Within seconds he sees extracted preferences with confidence scores. He sends the buyer chat link to his client. After the client completes their session, Mike sees an updated scored buyer profile — weighted priorities, confirmed vs. flexible criteria, contradictions resolved. He uses this to filter listings.

**Reveals:** Transcript upload UI, parsing results dashboard, buyer link generation, profile view with scores.

### Journey 3: Mike — Edge Case (Vague Transcript)

Mike uploads a short, vague transcript where the buyer was indecisive. The parser extracts few preferences with low confidence. The chat agent compensates by asking more gap-detection and lifestyle questions. The final profile has fewer "high confidence" items but clearly flags what still needs discovery.

**Reveals:** Low-confidence handling, adaptive question strategy, transparent confidence display.

### Journey Requirements Summary

| Capability | Journeys |
|---|---|
| Transcript upload/paste | Mike 1, 3 |
| Transcript parsing + scoring | Mike 1, 3 |
| Buyer chat link generation | Mike 1 |
| Chat UI with playbook engine | Sarah 1, Mike 3 |
| Scored buyer profile view | Mike 1, Sarah 1 |
| Low-confidence adaptive flow | Mike 3 |

## Web App Specific Requirements

### Technical Architecture

- **SPA** (Single Page Application) — React or Next.js
- **Browser support:** Modern browsers only (Chrome, Safari, Edge)
- **SEO:** Not needed — authenticated tool, not a content site
- **Real-time:** Yes — chat interface needs streaming for AI responses
- **Accessibility:** Basic (semantic HTML, keyboard nav)

### Implementation Considerations

- **Frontend:** Chat UI for buyer, dashboard for agent
- **Backend:** API service handling transcript parsing (LLM call) and chat orchestration
- **AI/LLM:** OpenAI or Anthropic API for transcript parsing + dynamic question generation
- **Data:** Simple persistence (sessions, profiles) — Supabase or Firebase for speed
- **Skip:** Native features, CLI commands, complex deployment

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — prove that AI can extract useful buyer preferences from a real transcript and refine them through conversation.

**Resource Requirements:** Solo developer, hackathon timeframe. Use managed services (Supabase, Vercel) for infrastructure speed.

### MVP Feature Set (Phase 1 — Hackathon)

**Core User Journeys Supported:**
- Mike uploads transcript → AI parses preferences → Sarah chats with AI → Mike gets scored profile

**Must-Have Capabilities:**
- Transcript paste/upload
- LLM-powered parsing with confidence scores
- Chat UI with question playbook
- Scored buyer profile output

**Can Be Manual/Hardcoded Initially:**
- Buyer link generation (share a URL directly)
- Authentication (none for demo)

### Post-MVP Features (Phase 2)

- Real authentication and multi-buyer management for agents
- Listing-based calibration and dream vs. right-now profiles
- Persistent data and agent dashboard with history

### Expansion Features (Phase 3)

- Swipe UI, taste clustering, aggregate buyer signals
- MLS integration for actual property matching
- Multi-agent support and team features

### Risk Mitigation Strategy

- **Technical:** If transcript parsing quality is poor, fall back to chat-only flow (no transcript needed)
- **Market:** Demo with 2-3 real transcripts to validate the concept works
- **Resource:** Solo hackathon build — use Supabase/Vercel for infrastructure speed

## Functional Requirements

### Transcript Management

- FR1: Agent can paste or upload a conversation transcript
- FR2: System can parse a transcript and extract buyer preferences as structured data
- FR3: System can assign confidence scores (low/medium/high) to each extracted preference
- FR4: System can detect gaps in transcript coverage (topics not discussed)
- FR5: System can identify contradictions between stated preferences

### Chat Refinement Engine

- FR6: Buyer can access a chat interface via a shareable link
- FR7: System can generate dynamic follow-up questions based on extracted transcript data
- FR8: System can execute question strategies: confirmation, gap detection, contradiction resolution, lifestyle probing, trade-off forcing
- FR9: System can sequence questions using warm-up funnel (easy confirmations first, hard trade-offs later)
- FR10: System can limit chat sessions to 8-12 questions maximum
- FR11: System can use casual, conversational phrasing (not clinical questionnaire style)
- FR12: System can adapt question selection based on buyer engagement (short answers = deprioritize, long answers = dig deeper)

### Buyer Profile Output

- FR13: System can generate a scored buyer profile with weighted criteria
- FR14: Agent can view a buyer's profile with confidence scores per preference
- FR15: Agent can see which preferences are confirmed vs. flexible vs. unresolved
- FR16: Agent can see a priority ranking of buyer criteria

### Agent Dashboard

- FR17: Agent can create a new buyer session by submitting a transcript
- FR18: Agent can view parsing results before sending chat link to buyer
- FR19: Agent can generate a shareable buyer chat link
- FR20: Agent can view the updated profile after buyer completes chat refinement

### Adaptive Behavior

- FR21: System can adjust question strategy when transcript has low confidence scores (more gap-detection and lifestyle questions)
- FR22: System can display confidence levels transparently to the agent
- FR23: System can summarize the buyer profile at the end of the chat session for buyer review

## Non-Functional Requirements

### Performance

- Chat responses stream to the buyer in real-time (no waiting for full LLM response)
- Transcript parsing completes within 15 seconds for transcripts up to 5,000 words
- Chat UI renders and is interactive within 2 seconds on modern browsers

### Security

- Buyer chat links are unique and non-guessable (UUID-based)
- Transcript data and buyer profiles are not publicly accessible
- No authentication required for hackathon MVP; designed for easy auth addition post-MVP

### Integration

- LLM API (OpenAI or Anthropic) for transcript parsing and question generation
- Supabase or Firebase for data persistence
- Vercel or similar for frontend hosting and serverless API routes
