---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-screens', 'step-04-patterns', 'step-05-complete']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-07.md'
  - 'user-flow.excalidraw'
workflowType: 'ux-design'
project_name: 'RealEstateMadeEasy'
date: '2026-02-07'
---

# UX Design Specification — RealEstateMadeEasy

**Author:** Sally (UX Designer)
**Date:** 2026-02-07

---

## 1. Design Philosophy

RealEstateMadeEasy serves two completely different humans with completely different emotional states:

- **Mike the Agent** is in *work mode* — fast, efficient, scanning data. He wants to upload a transcript, glance at results, fire off a link, and move to the next client. His UI is a *cockpit*.
- **Sarah the Buyer** is in *personal mode* — vulnerable, hopeful, maybe a little anxious about the biggest purchase of her life. She got a text link on her phone. Her UI is a *conversation with a friend*.

**Core principle:** These two experiences share a backend, but they should feel like different products. The agent dashboard is dense, data-forward, and desktop-first. The buyer chat is warm, minimal, and mobile-first.

### Design Values

1. **Transparency over magic** — Show confidence scores, explain why questions are asked, never hide the AI
2. **Casual over clinical** — The buyer chat should feel like texting a knowledgeable friend, not filling out a government form
3. **Beautiful AND fast** — Modern, premium visual quality using shadcn/ui's "new-york" theme + custom refinements. First impressions matter: agents judge tools by aesthetics, buyers judge trustworthiness by design quality
4. **Respect attention** — 8-12 questions max. Progress visible. No infinite scroll of questions

### Visual Identity

The visual language communicates **trust, intelligence, and warmth**:

- **Trust** — Clean layouts, consistent spacing, professional typography. No visual clutter. Every element earns its place
- **Intelligence** — Subtle data visualization (confidence bars, sparklines), smooth transitions that feel "smart"
- **Warmth** — Soft gradients, rounded corners, friendly chat bubbles. The buyer chat should feel like a high-end messaging app, not enterprise software

**Reference touchstones:** Linear (clean dashboard), Vercel (modern minimalism), iMessage/WhatsApp (chat warmth), Notion (typography + whitespace)

---

## 2. User Personas & Emotional Context

### Mike — Real Estate Agent (Primary: Operations)

| Attribute | Detail |
|-----------|--------|
| **Context** | Just finished a discovery call, at desk or on laptop between showings |
| **Device** | Laptop/desktop (primary), occasionally tablet |
| **Emotional state** | Busy, task-oriented, wants to move fast |
| **Tech comfort** | Moderate — uses CRM tools, email, Google Docs |
| **Key frustration** | "I had a great call but my notes are garbage. I know what the client wants but I can't articulate it structured enough to search effectively." |
| **Success feeling** | "I sent the profile link in under 2 minutes. The AI caught things I missed." |

### Sarah — Home Buyer (Primary: Discovery)

| Attribute | Detail |
|-----------|--------|
| **Context** | Received a text link from her agent, opens on phone |
| **Device** | Mobile phone (primary), occasionally desktop |
| **Emotional state** | Curious but cautious. Doesn't want to feel surveilled or interrogated |
| **Tech comfort** | Comfortable with messaging apps, less so with dashboards |
| **Key frustration** | "I told my agent what I want but I feel like they're still showing me the wrong houses." |
| **Success feeling** | "That was quick and actually felt like someone listened. I even realized things I hadn't thought about." |

---

## 3. Information Architecture

### Routing Structure

```
/                           → Redirect to /dashboard
/dashboard                  → Agent: Session list (home)
/dashboard/new              → Agent: New session — transcript upload
/dashboard/:sessionId       → Agent: Session detail — parsing results + profile
/chat/:sessionId            → Buyer: Chat interface (standalone, no nav)
```

### Two-Layout Architecture

| Layout | Route prefix | Target | Design system |
|--------|-------------|--------|---------------|
| **Dashboard Layout** | `/dashboard/*` | Agent (Mike) | shadcn/ui — sidebar nav, cards, tables, forms |
| **Chat Layout** | `/chat/:sessionId` | Buyer (Sarah) | assistant-ui — full-screen chat, minimal chrome |

---

## 4. Screen-by-Screen Specification

### 4.1 Agent Dashboard — Session List (`/dashboard`)

**Purpose:** Mike's home base. See all buyer sessions at a glance, create new ones.

**Layout:**
- Left sidebar (collapsible): Navigation + branding
- Main content: Session list

**Sidebar Navigation (Modern, Sleek):**
- Background: `surface-1` with `backdrop-blur-sm` and right border `border-border/30`
- Logo area: House icon (Lucide `Home`, 20px) in a `rounded-lg` container with gradient `accent` background + "REME" text mark in `font-semibold text-sm tracking-tight`. Compact, modern, recognizable
- Collapse/expand: Smooth width transition (256px → 64px), icons stay centered when collapsed
- Nav items: `rounded-lg` shape, `px-3 py-2`, `text-sm`
  - Default: `transparent` bg, `muted-foreground` text
  - Hover: `surface-3` bg, `foreground` text
  - Active: `accent/10` bg, `accent` text, left accent bar (3px, `accent`, `rounded-full`)
  - Sessions (active by default, with Lucide `MessageSquare` icon)
  - (Post-MVP: Settings `Settings` icon, Account `User` icon)
- Bottom of sidebar: Subtle version text "v0.1.0" in `text-[10px] text-muted-foreground/50`

**Main Content — Session List:**

```
┌──────────────────────────────────────────────────┐
│  Sessions                          [+ New Session]│
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ Sarah M.          3 min ago        ● Complete│  │
│  │ "3BR near schools, $500K range"              │  │
│  │ Confidence: ████████░░ 82%                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ David R.          1 hr ago      ◐ Chat Active│  │
│  │ "Downtown condo, walkable, $350K"            │  │
│  │ Confidence: █████░░░░░ 54%                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ Lisa & Tom K.     2 hrs ago      ○ Parsed   │  │
│  │ "Family home, suburbs, good schools"         │  │
│  │ Confidence: ███░░░░░░░ 35%                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└──────────────────────────────────────────────────┘
```

**Session Card Details (Modern Card Design):**
- Card: `surface-2` bg, `rounded-xl`, `elevation-1`, border `border-border/50` (very subtle)
- On hover: `elevation-2`, `translateY(-2px)`, border becomes `border-border` — feels alive and clickable
- On active/press: `elevation-1`, `scale(0.99)` — tactile feedback
- Buyer name: `text-base font-medium` (or "Unnamed Buyer" in `text-muted-foreground italic`)
- One-line summary: `text-sm text-muted-foreground`, max 60 chars, truncated with `…`
- Overall confidence score: Animated gradient bar + percentage in `tabular-nums font-medium`
- Status badge — Pill shape (`rounded-full px-2.5 py-0.5 text-xs font-medium`):
  - `Parsing` — `surface-3` bg + animated shimmer effect (gradient sweep) + dot with pulse
  - `Parsed` — `warning/10` bg, `warning` text, solid amber dot
  - `Chat Active` — `accent/10` bg, `accent` text, animated breathing dot (scale pulse)
  - `Complete` — `success/10` bg, `success` text, solid green dot with checkmark
- Time since creation: `text-xs text-muted-foreground` (relative: "3 min ago"), right-aligned
- Click → navigates to `/dashboard/:sessionId`
- Cursor: `cursor-pointer` with smooth transition

**Empty State (Delightful):**
- Centered vertically in content area
- SVG illustration: Minimal line drawing of a house with a chat bubble emerging (60x60px, uses `muted-foreground` color)
- Heading: "Ready to understand your buyers?" in `text-xl font-semibold`
- Subtext: "Upload a conversation transcript and let AI extract what matters." in `text-sm text-muted-foreground`
- CTA button: Uses `--gradient-hero` background, white text, `rounded-lg`, `elevation-2` shadow, hover lifts slightly
- Subtle floating dots animation in background (3-4 circles, very slow drift, `muted/20` opacity)

**Accessibility:**
- Session cards are `<a>` links (keyboard navigable)
- Status badges use both color AND icon/shape (not color-alone)
- Confidence bar has `aria-label="Confidence: 82 percent"`

---

### 4.2 Agent Dashboard — New Session (`/dashboard/new`)

**Purpose:** Mike uploads or pastes a transcript to start a new buyer session.

**Layout:** Single-column form, centered within main content area.

```
┌──────────────────────────────────────────────────┐
│  New Session                                       │
│                                                    │
│  Buyer Name (optional)                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ e.g., Sarah Martinez                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Conversation Transcript                           │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  Paste your conversation transcript here…    │ │
│  │                                              │ │
│  │                                              │ │
│  │                                              │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ── or ──                                          │
│                                                    │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │                                              │ │
│  │   Drop a .txt or .pdf file here              │ │
│  │   or click to browse                         │ │
│  │                                              │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                    │
│                              [Cancel]  [Analyze →] │
│                                                    │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Paste area: `<textarea>` with generous height (240px min), `Geist Mono text-sm`, `surface-3` bg, `rounded-xl`, `border-border` border. On focus: border transitions to `accent` with glow (`shadow-[0_0_0_3px_rgba(var(--accent),0.1)]`). The textarea feels like a premium code editor input
- File drop zone: `rounded-xl`, dashed `border-2 border-dashed border-border` in default state. On drag-over: border becomes `accent`, bg becomes `accent/5`, and a subtle scale pulse animation. Upload icon (Lucide `Upload`, 32px, `muted-foreground`) centered. Accepts `.txt` and `.pdf`. On drop, filename appears in a `surface-3 rounded-lg` chip with remove (×) button. File contents populate the textarea
- "Analyze" button: Gradient `--gradient-hero` background, white text, `rounded-lg`, `elevation-1`. Disabled state: `surface-3` bg, `muted-foreground` text (no gradient). On hover: `elevation-2` lift. On click loading state: Text changes to "Analyzing…" with spinner. Disabled until transcript has content (paste OR file). On click:
  1. Creates session via `POST /api/sessions`
  2. Uploads transcript via `POST /api/sessions/:id/transcript`
  3. Redirects to `/dashboard/:sessionId` with parsing-in-progress state
- Cancel: Returns to `/dashboard`

**Validation:**
- Minimum transcript length: 100 characters (show inline error below textarea: "Transcript seems too short. Paste the full conversation for best results.")
- Maximum: 5,000 words (show character/word count in bottom-right of textarea)
- No blocked paste (`onPaste` must not `preventDefault`)

**Accessibility:**
- `<label>` elements with `htmlFor` on all inputs
- Textarea has `autocomplete="off"`, `spellCheck={false}`
- File drop zone is also keyboard-accessible (button fallback)
- Submit button stays enabled until request starts (per Vercel guidelines)

---

### 4.3 Agent Dashboard — Session Detail (`/dashboard/:sessionId`)

**Purpose:** Mike's command center for a specific buyer. See what the AI extracted, send the chat link, and view the final profile.

**Layout:** Two-column on desktop (preferences left, profile right). Stacks vertically on tablet.

**State: Parsing In Progress**

```
┌──────────────────────────────────────────────────┐
│  ← Sessions    Sarah Martinez                      │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │   ◌  Analyzing transcript…                   │ │
│  │      Extracting preferences and signals      │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- Spinner animation (CSS `transform` + `opacity` only, per Vercel guidelines)
- `aria-live="polite"` on status text for screen readers

**State: Parsed — Awaiting Chat**

```
┌──────────────────────────────────────────────────────────────┐
│  ← Sessions    Sarah Martinez         [Copy Chat Link] [Share]│
│                                                                │
│  EXTRACTED PREFERENCES                    BUYER PROFILE        │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐│
│  │                             │  │                          ││
│  │ Location        ████░ High  │  │  Profile not yet         ││
│  │  "Near good schools in      │  │  available.              ││
│  │   suburban area"            │  │                          ││
│  │                             │  │  Send the chat link to   ││
│  │ Budget          ████░ High  │  │  your buyer to refine    ││
│  │  "$500K range"              │  │  their preferences.      ││
│  │                             │  │                          ││
│  │ Bedrooms        █████ High  │  │                          ││
│  │  "3 bedrooms"               │  │                          ││
│  │                             │  │                          ││
│  │ Schools         ███░░ Med   │  │                          ││
│  │  "Good school district —    │  │                          ││
│  │   mentioned as important"   │  │                          ││
│  │                             │  │                          ││
│  │ Commute         █░░░░ Low   │  │                          ││
│  │  "Not discussed"            │  │                          ││
│  │                             │  │                          ││
│  │ ⚠ CONTRADICTION DETECTED   │  │                          ││
│  │  "Quiet neighborhood" vs.   │  │                          ││
│  │  "Walkable nightlife"       │  │                          ││
│  │                             │  │                          ││
│  │ 📋 GAPS DETECTED            │  │                          ││
│  │  • Commute preferences      │  │                          ││
│  │  • Parking / garage         │  │                          ││
│  │  • HOA tolerance            │  │                          ││
│  │                             │  │                          ││
│  └─────────────────────────────┘  └──────────────────────────┘│
│                                                                │
│  CHAT LINK                                                     │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ https://app.realestate.ai/chat/a1b2c3d4-...  [Copy] [📱] ││
│  │ Send this link to your buyer via text or email.            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Preference Cards (Refined Visual Design):**
- Each card: `surface-2` bg, `rounded-xl`, `p-4`, subtle `border-border/30` border
- Layout per card: Category name in `text-sm font-medium` top-left, confidence pill badge top-right
- Confidence pill: `rounded-full px-2 py-0.5 text-[11px] font-medium` — `success/10` bg for High, `warning/10` bg for Medium, `destructive/10` bg for Low
- Extracted value: `text-sm text-muted-foreground italic` below category — quoted from transcript
- Confidence bar: Gradient-filled (see Section 5), animates on first render
- Cards stagger-animate on page load (each card slides up 50ms after the previous)
- Contradictions: `rounded-xl` card with `warning/5` bg, left border `4px solid warning`, `AlertTriangle` icon
- Gaps: `rounded-xl` card with `accent/5` bg, left border `4px solid accent`, `Search` icon
- Both contradiction and gap cards have a subtle left-border accent instead of full background color — cleaner, more modern
- Gaps: Blue info card with `📋` icon, lists topics not discussed

**Chat Link Section (Prominent, Beautiful):**
- Card: `rounded-xl`, gradient border (`--gradient-chat` as 1px border via `background-clip` trick), `surface-2` inner bg
- URL: `Geist Mono text-sm`, truncated with `…` on small screens, in a `surface-3 rounded-lg px-3 py-2` inline code block
- "Copy" button: `accent` bg, `rounded-lg`, `text-sm font-medium`. On click: Text changes to "Copied!" with a checkmark icon + green flash, reverts after 2s
- "Share" button: `surface-3` bg with `Share2` Lucide icon. Opens native share sheet on mobile, `mailto:` fallback on desktop
- Help text below: "Send this link to your buyer via text or email." in `text-xs text-muted-foreground`
- The entire section has a subtle pulsing glow when the session is in "Parsed" status — drawing attention to the primary action

**State: Chat Complete — Profile Available**

The right column transforms from placeholder to the scored buyer profile:

```
┌──────────────────────────┐
│  SCORED BUYER PROFILE     │
│                          │
│  Priority #1             │
│  School District ★★★★★   │
│  "Must-have" · Confirmed │
│                          │
│  Priority #2             │
│  3+ Bedrooms    ★★★★☆   │
│  "Firm" · Confirmed      │
│                          │
│  Priority #3             │
│  Budget ≤$500K  ★★★★☆   │
│  "Firm" · Confirmed      │
│                          │
│  Priority #4             │
│  Quiet Area     ★★★☆☆   │
│  "Flexible" · Resolved   │
│  ↳ "Quiet residential,   │
│    but walkable to a few │
│    restaurants is ok"    │
│                          │
│  Priority #5             │
│  Commute ≤30min ★★☆☆☆   │
│  "Nice-to-have" · New    │
│                          │
│  ───────────────────     │
│  Overall Confidence: 87% │
│  Questions Asked: 10     │
│  Session Duration: 4m    │
│                          │
└──────────────────────────┘
```

**Profile Card Details (Premium Data Visualization):**
- Profile card: `surface-2` bg, `rounded-xl`, left border `4px solid` using `--gradient-hero` (gradient border)
- Ranked by priority (highest weight first)
- Each profile item is a row with:
  - Rank: Large `text-2xl font-bold text-muted-foreground/30` number (watermark style, left side)
  - Criterion name: `text-sm font-medium`
  - Star rating: Animated fill on render (see Section 5 confidence visualization)
  - Flexibility pill: `rounded-full text-[11px] font-medium px-2 py-0.5`
    - "Must-have": `destructive/10` bg, `destructive` text (red signals importance)
    - "Firm": `accent/10` bg, `accent` text
    - "Flexible": `success/10` bg, `success` text
    - "Nice-to-have": `muted` bg, `muted-foreground` text
  - Source label: Small text, subtle icon prefix — `Check` for Confirmed, `RefreshCw` for Resolved, `Sparkles` for New
- If "Resolved": Expandable accordion with smooth height animation, indented quote showing buyer's resolution
- Summary footer: Divider line, then a `surface-3 rounded-lg p-4` stats card with three columns:
  - Overall confidence: Large `text-3xl font-bold` percentage with gradient text color (`--gradient-hero`)
  - Questions asked: `text-lg font-semibold` + "questions" label
  - Duration: `text-lg font-semibold` + "minutes" label
  - All numbers use `tabular-nums`
- On profile load: Items stagger-animate in from left, stars fill in sequence, stats counter-animate up

---

### 4.4 Buyer Chat Interface (`/chat/:sessionId`)

**Purpose:** Sarah's entire experience. A warm, conversational AI chat that feels like texting a knowledgeable friend — not filling out a form.

**This is the most important screen in the entire product.** It's where the real value happens. Every design decision here should serve one goal: Sarah feels *heard*, not interrogated.

**Layout:** Full-screen, no sidebar, no navigation chrome. Mobile-first. The assistant-ui library provides the foundation.

```
┌─────────────────────────────────┐
│                                 │
│   🏠 RealEstateMadeEasy        │
│   Finding your perfect home     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Hi Sarah! 👋                │ │
│ │                             │ │
│ │ Your agent shared some      │ │
│ │ notes from your recent      │ │
│ │ conversation. I'd love to   │ │
│ │ spend a few minutes making  │ │
│ │ sure we really understand   │ │
│ │ what you're looking for.    │ │
│ │                             │ │
│ │ Ready to get started?       │ │
│ └─────────────────────────────┘ │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Type your message…      │ [→] │
│ └─────────────────────────┘     │
│                                 │
└─────────────────────────────────┘
```

**Header (Minimal, Beautiful):**
- Frosted glass header: `backdrop-blur-xl bg-white/80 dark:bg-black/60 border-b border-white/10`
- App logo: Small house icon (Lucide `Home`) + "RealEstateMadeEasy" in `font-medium text-sm`
- Tagline: "Finding your perfect home" in `text-xs text-muted-foreground`
- Gradient accent line: 2px line at very top of viewport using `--gradient-chat` (blue→cyan)
- No navigation, no back button, no hamburger menu
- Progress indicator (appears after Q1): Animated progress bar (not just text). Thin bar below header, fills smoothly. Label "Question 3 of ~10" in `text-xs text-muted-foreground` right-aligned. Uses `~` to indicate approximate (since "Good Enough" detector may end early)

**Chat Area:**
- Background: `surface-1` with a very subtle dot grid pattern (`radial-gradient` at 1px, `muted/20`, 24px spacing) — adds texture without distraction
- Messages alternate: AI (left-aligned, `surface-3` bg) and Buyer (right-aligned, `accent` bg with white text)
- AI message bubbles: `rounded-2xl rounded-bl-md` — sharp corner on bottom-left creates a "speech tail" effect
- Buyer message bubbles: `rounded-2xl rounded-br-md` — mirror tail on bottom-right
- AI messages stream token-by-token (SSE) — typing indicator with bounce animation, then text streams in with subtle per-token fade
- Auto-scroll to newest message, but stop auto-scroll if user scrolls up (reading history)
- Message entrance animation: Slide up + fade + slight scale (spring physics, 300ms)
- Bubbles: max-width 80% of container, `shadow-sm` on buyer messages for slight lift
- AI avatar: Small circle (24px) with gradient background and sparkle icon, sits beside AI messages. Adds personality without being cartoonish
- Timestamp: Shown between message groups (not every message), `text-[10px] text-muted-foreground text-center`

**Conversation Flow (UX Choreography):**

1. **Welcome message** — Warm greeting using buyer's name. Sets expectations: "a few minutes," "making sure we understand." NOT "I'm an AI" — just be helpful
2. **Warm-up phase (Questions 1-3):** Easy confirmation questions
   - "From your conversation, it sounds like you're looking for a 3-bed near good schools in the $500K range. How accurate is that, 1-10?"
   - Quick-reply chips: `[1-3 Not quite]` `[4-6 Close]` `[7-8 Pretty accurate]` `[9-10 Spot on]`
3. **Deep-dive phase (Questions 4-8):** Gap detection, lifestyle probing
   - "You and your agent talked a lot about location and schools, but didn't touch on commute. Is that because it doesn't matter, or because it just didn't come up?"
   - Free-text responses. No chips — these need nuance
4. **Trade-off phase (Questions 9-12):** Priority forcing, contradiction resolution
   - "You mentioned wanting a quiet neighborhood but also being close to restaurants and nightlife. How do you balance those two?"
   - Free-text
5. **Summary & close:**
   - AI presents a summary of what it learned
   - "Does this capture what you're looking for? Anything you'd change?"
   - Final confirmation, then "Thanks, Sarah! Your agent will have your updated profile. 🏡"

**Quick-Reply Chips (for confirmation questions only):**

```
┌──────────────────────────────────┐
│                                  │
│  How accurate is that, 1-10?     │
│                                  │
│  [1-3 Not quite] [4-6 Close]    │
│  [7-8 Pretty accurate]          │
│  [9-10 Spot on]                  │
│                                  │
└──────────────────────────────────┘
```

- Chips are `<button>` elements (not divs), keyboard accessible
- After tapping a chip, it sends the text as a message and chips disappear
- Chips are an *option*, not a requirement — buyer can always just type

**Input Area (Polished):**
- Container: `surface-2` bg, `border-t border-border`, `px-4 py-3` padding
- Text input: `rounded-full` pill shape with `surface-3` background — feels modern, inviting, like a messaging app
- Placeholder: "Type your message…" in `muted-foreground`
- Send button: `rounded-full` circle, `accent` bg, `ArrowUp` Lucide icon (not arrow-right — vertical feels more "send"). Disabled state: `muted` bg, `muted-foreground` icon
- Send button animates: On press `scale(0.9)`, on release spring back. When message sends, subtle pulse animation
- `autocomplete="off"` (personal conversation, not a form)
- `enterkeyhint="send"` on mobile
- No file attachments (chat only)
- Input stays fixed at bottom (no keyboard-push issues on iOS — use `visualViewport` API)
- On focus: Input ring glows subtly with `accent` color (`shadow-[0_0_0_2px_rgba(var(--accent),0.2)]`)

**Loading/Streaming States:**
- While AI is "thinking": Three-dot typing indicator (CSS animation, `transform`/`opacity` only)
- While streaming: Text appears token-by-token, auto-scrolls
- If AI takes >5 seconds: "Still thinking…" appears below the dots

**Error Handling:**
- If SSE connection drops: "Hmm, let me try that again." Auto-retry once. If fails again: "Something went wrong. Your progress is saved — try refreshing." (Friendly, never technical)
- If session doesn't exist (bad link): "This link doesn't seem to be active. Check with your agent for the right link."

**Session Complete State:**
- Chat input disabled
- Final message: "Thanks for your time, Sarah! Your agent now has your updated profile. We hope this helps find the perfect home for you. 🏡"
- No redirect, no next action — the experience just *ends* gracefully

**Accessibility (Critical — Vercel Web Design Guidelines):**
- All interactive elements have visible `focus-visible` rings
- `aria-live="polite"` on the message container for screen reader updates
- Chips are `<button>` with descriptive text
- Send button has `aria-label="Send message"`
- Progress indicator has `aria-label="Question 3 of approximately 10"`
- Respects `prefers-reduced-motion`: Disable streaming animation, show messages instantly
- Respects `prefers-color-scheme`: Light mode default, dark mode supported

---

## 5. Design System & Visual Language

### Technology Stack

| Layer | Technology | Usage |
|-------|-----------|-------|
| CSS framework | Tailwind CSS 4 | All styling, custom theme tokens |
| Component library | shadcn/ui ("new-york" style) | Cards, tables, forms, buttons, sidebar |
| Chat UI | assistant-ui | Message bubbles, streaming, auto-scroll |
| Font | Geist Sans + Geist Mono (Vercel) | Primary typeface, monospace |
| Routing | TanStack Router | Type-safe, two-layout structure |
| Icons | Lucide React | Consistent with shadcn/ui |
| Animations | Tailwind + Framer Motion (lightweight) | Micro-interactions, page transitions |

### Font: Geist (Vercel)

Install Geist for a modern, premium look that pairs perfectly with shadcn/ui:
```bash
npm install geist
```
```css
/* globals.css */
@import 'geist/font/sans';
@import 'geist/font/mono';
```
Geist gives us: excellent legibility at small sizes, tabular figures built-in, a modern geometric feel without being cold, and perfect pairing with the shadcn/ui ecosystem.

### Color Palette

**Brand Colors — Modern, warm yet professional:**

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary` | `hsl(222, 47%, 31%)` — Slate-800 | `hsl(210, 40%, 98%)` — Slate-50 | Text, primary actions |
| `primary-foreground` | `hsl(210, 40%, 98%)` | `hsl(222, 47%, 11%)` | Text on primary |
| `accent` | `hsl(217, 91%, 60%)` — Blue-500 | `hsl(217, 91%, 65%)` | Interactive elements, links, agent accent |
| `accent-foreground` | `hsl(0, 0%, 100%)` | `hsl(0, 0%, 100%)` | Text on accent |
| `success` | `hsl(160, 84%, 39%)` — Emerald-500 | `hsl(160, 84%, 45%)` | High confidence, complete states |
| `warning` | `hsl(32, 95%, 44%)` — Orange-500 | `hsl(32, 95%, 55%)` | Medium confidence, contradictions |
| `destructive` | `hsl(0, 72%, 51%)` — Red-500 | `hsl(0, 72%, 60%)` | Errors, low confidence |

**Surface Colors — Layered depth system:**

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `background` | `hsl(0, 0%, 100%)` | `hsl(224, 71%, 4%)` | Root background |
| `surface-1` | `hsl(210, 20%, 98%)` | `hsl(224, 50%, 8%)` | Page background, sidebar |
| `surface-2` | `hsl(0, 0%, 100%)` | `hsl(224, 40%, 11%)` | Cards, elevated elements |
| `surface-3` | `hsl(210, 40%, 96%)` | `hsl(224, 33%, 15%)` | Nested cards, hover states |
| `foreground` | `hsl(224, 71%, 4%)` | `hsl(210, 40%, 98%)` | Primary text |
| `muted-foreground` | `hsl(220, 9%, 46%)` | `hsl(218, 11%, 65%)` | Secondary text |
| `border` | `hsl(220, 13%, 91%)` | `hsl(220, 13%, 18%)` | Subtle borders |
| `border-hover` | `hsl(220, 13%, 82%)` | `hsl(220, 13%, 26%)` | Border on hover/focus |

**Gradient Accents:**

```css
/* Hero gradient for empty states, loading screens */
--gradient-hero: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(280, 87%, 65%) 50%, hsl(330, 81%, 60%) 100%);

/* Subtle background gradient for dashboard */
--gradient-surface: linear-gradient(180deg, hsl(210, 20%, 98%) 0%, hsl(220, 14%, 96%) 100%);

/* Chat header gradient — warm, inviting */
--gradient-chat: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(199, 89%, 48%) 100%);

/* Confidence bar gradients */
--gradient-high: linear-gradient(90deg, hsl(160, 84%, 39%), hsl(142, 71%, 45%));
--gradient-medium: linear-gradient(90deg, hsl(38, 92%, 50%), hsl(32, 95%, 44%));
--gradient-low: linear-gradient(90deg, hsl(0, 72%, 51%), hsl(0, 84%, 60%));
```

**Chat-Specific Colors:**

| Element | Light Mode | Dark Mode | Rationale |
|---------|-----------|-----------|-----------|
| AI message bubble | `surface-3` | `surface-3` | Neutral, recedes, lets content lead |
| Buyer message bubble | `accent` bg + white text | `accent` bg + white text | Clearly "yours", like iMessage blue |
| Quick-reply chips | `surface-2` bg, `accent` border, `accent` text | Matches | Interactive but not overwhelming |
| Chip hover | `accent/8` bg | `accent/12` bg | Subtle brand-tinted feedback |
| Chat background | `surface-1` | `background` | Slightly warm, not stark white |

### Typography

Geist Sans provides 9 weights. We use a restrained subset for clean hierarchy:

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page title (h1) | Geist Sans | `text-2xl` (24px) | `font-semibold` (600) | `-0.025em` |
| Section heading (h2) | Geist Sans | `text-lg` (18px) | `font-semibold` (600) | `-0.02em` |
| Card title | Geist Sans | `text-base` (16px) | `font-medium` (500) | `-0.01em` |
| Body text | Geist Sans | `text-sm` (14px) | `font-normal` (400) | `0` |
| Chat messages | Geist Sans | `text-[15px]` | `font-normal` (400) | `0` |
| Labels / overlines | Geist Sans | `text-xs` (12px) | `font-medium` (500) | `0.05em` (uppercase tracking) |
| Code / URLs / transcript | Geist Mono | `text-sm` (14px) | `font-normal` (400) | `0` |
| Numbers / stats | Geist Sans | varies | `font-medium` (500) | `tabular-nums` |

**Typography refinements:**
- Negative letter-spacing on headings creates a tighter, more premium feel
- Overline labels (like "EXTRACTED PREFERENCES") use `uppercase`, `text-xs`, `font-medium`, and `tracking-widest` for that modern editorial look
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs
- Use `…` (ellipsis character), not `...`
- `font-variant-numeric: tabular-nums` on all numbers — confidence %, stats, counts
- Loading states: "Analyzing…", "Loading…" with proper ellipsis

### Spacing & Layout

| Pattern | Value | Rationale |
|---------|-------|-----------|
| Page padding | `p-8` (32px) desktop, `p-5` (20px) mobile | Generous breathing room |
| Card padding | `p-5` (20px) | Spacious, modern |
| Card gap (list) | `gap-3` (12px) | Tight enough to scan, spaced enough to separate |
| Section gap | `gap-8` (32px) | Clear separation between sections |
| Chat message gap | `gap-4` (16px) | Natural conversational rhythm |
| Chat bubble padding | `px-4 py-2.5` (16px / 10px) | Compact but readable |
| Input field height | `h-11` (44px) | Touch-friendly, modern proportion |
| Max content width | `max-w-5xl` (1024px) dashboard, `max-w-md` (448px) chat | Focused reading width |
| Sidebar width | `w-64` (256px) expanded, `w-16` (64px) collapsed | Standard modern sidebar |

### Elevation & Depth

Modern depth using subtle shadows instead of borders:

| Level | Shadow | Usage |
|-------|--------|-------|
| `elevation-0` | None | Flat elements on surface |
| `elevation-1` | `0 1px 2px rgba(0,0,0,0.05)` | Cards at rest |
| `elevation-2` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)` | Cards on hover, dropdowns |
| `elevation-3` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)` | Modals, floating elements |
| `ring-focus` | `0 0 0 2px var(--accent), 0 0 0 4px rgba(var(--accent), 0.2)` | Focus rings — double-ring style |

In dark mode, shadows are replaced with subtle lighter borders (`border-white/5`) since shadows don't read well on dark backgrounds.

### Border Radius

| Element | Value | Rationale |
|---------|-------|-----------|
| Cards | `rounded-xl` (12px) | Soft, modern, premium feel |
| Buttons | `rounded-lg` (8px) | Slightly softer than default |
| Chat bubbles | `rounded-2xl` (16px) with tail | Conversational, like iMessage |
| Inputs | `rounded-lg` (8px) | Matches buttons |
| Chips | `rounded-full` (9999px) | Pill shape, inviting to tap |
| Avatar / icons | `rounded-full` | Consistent circular elements |
| Sidebar | `rounded-none` | Edge-to-edge for structural elements |

**Chat bubble tail shapes:**
- AI messages: `rounded-2xl rounded-bl-md` (sharp bottom-left, like it's "coming from" the AI)
- Buyer messages: `rounded-2xl rounded-br-md` (sharp bottom-right)

### Micro-interactions & Animation

All animations use `transform` and `opacity` only. Framer Motion for orchestrated sequences.

**Core Transitions:**

| Animation | Properties | Duration | Easing |
|-----------|-----------|----------|--------|
| Card hover lift | `translateY(-2px)`, shadow `elevation-1 → elevation-2` | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Button press | `scale(0.97)` | 80ms | `ease-in` |
| Button release | `scale(1)` | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` — springy overshoot |
| Focus ring appear | `opacity: 0→1`, ring `scale(0.95)→scale(1)` | 150ms | `ease-out` |
| Page transition | Content `opacity: 0→1`, `translateY(8px)→0` | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Skeleton pulse | `opacity: 0.5→1→0.5` | 1500ms | `ease-in-out`, infinite |

**Chat-Specific Animations:**

| Animation | Properties | Duration | Easing |
|-----------|-----------|----------|--------|
| Message appear | `opacity: 0→1`, `translateY(12px)→0`, `scale(0.97)→scale(1)` | 300ms | spring (damping: 20, stiffness: 300) |
| Typing indicator | Three dots with staggered `translateY(-4px)→0` bounce | 400ms per dot, 150ms stagger | `ease-in-out`, infinite |
| Chip appear | `opacity: 0→1`, `scale(0.9)→1`, staggered 50ms per chip | 200ms | spring |
| Chip press | `scale(0.93)` | 80ms | `ease-in` |
| Progress bar update | `width` transition | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Streaming text | Characters appear with 0-opacity fade-in | 30ms per token | `linear` |
| Send button fly | Message slides up and out toward the message list | 200ms | `ease-out` |

**Loading Choreography:**
The parsing loading screen uses a sequenced animation:
1. Spinner appears (fade in, 200ms)
2. "Analyzing transcript…" text appears (fade in, 200ms, 100ms delay)
3. Steps appear one by one: "Extracting preferences…" → "Detecting gaps…" → "Scoring confidence…" (each fades in with 800ms delay)
4. On complete: Everything fades out, results page fades in with stagger

**Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: no-preference)`. With reduced motion, elements appear instantly. Streaming text still works but without the per-character fade.

### Glassmorphism & Modern Effects (Selective Use)

Used sparingly for premium feel — NOT everywhere:

| Element | Effect | Implementation |
|---------|--------|----------------|
| Chat header | Frosted glass blur on scroll | `backdrop-blur-xl bg-white/80 dark:bg-black/60` |
| Sidebar | Subtle frosted effect | `backdrop-blur-sm bg-surface-1/90` |
| Toast notifications | Glass card | `backdrop-blur-md bg-white/90 border-white/20` |
| Quick-reply chip hover | Subtle glow | `shadow-[0_0_12px_rgba(var(--accent),0.15)]` |

**NOT using glass on:** Regular cards, form inputs, chat bubbles (keeps them grounded and readable).

### Empty States & Delightful Details

Empty states are opportunities to delight, not just inform:

**Session List (empty):**
- Centered illustration: Simple line-art of a house + chat bubble (SVG, 120x120px)
- Heading: "Ready to understand your buyers?"
- Subtext: "Upload a conversation transcript and let AI extract what matters."
- CTA: Gradient `accent` button: "Create Your First Session"
- Subtle animated gradient background on the illustration

**Profile Placeholder (awaiting chat):**
- Dashed border card with `surface-3` background
- Icon: Chat bubble with sparkle
- Text: "Profile builds after your buyer completes their chat"
- Animated dots pulsing subtly

**Chat Complete:**
- Confetti-style particle animation (3-4 small shapes, 1 second, subtle)
- Green checkmark that draws itself (SVG stroke animation)
- Final message card has a subtle green gradient border

### Confidence Visualization (Enhanced)

**Bar variant — Gradient-filled with animation:**
```
████████░░  82% High    → Green gradient, fills left-to-right on load (500ms)
█████░░░░░  54% Medium  → Orange gradient, fills left-to-right
██░░░░░░░░  18% Low     → Red gradient, fills left-to-right
```
- 10-segment bar, each segment is 4px wide with 2px gap
- Filled segments use confidence-appropriate gradient
- Unfilled segments: `bg-muted/50` (very subtle)
- Number uses `tabular-nums` + `font-medium`
- On hover: Tooltip with details ("Extracted from transcript, lines 12-15")
- **Animate on first render:** Segments fill in sequentially left-to-right with a 30ms stagger

**Star variant — Filled with warm color:**
```
★★★★★  Must-have    → Filled stars use `warning` amber
★★★★☆  Firm         → Same color for filled, muted for empty
★★★☆☆  Flexible
★★☆☆☆  Nice-to-have
★☆☆☆☆  Weak signal
```
- Stars are Lucide `Star` icons, 14px
- Filled: `fill-amber-400 text-amber-400`
- Empty: `fill-none text-muted/30`
- On profile load: Stars fill in sequentially with a pop animation

---

## 6. Responsive Behavior

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Default | <640px | Mobile (buyer chat primary) |
| `sm` | 640px+ | Large phone / small tablet |
| `md` | 768px+ | Tablet |
| `lg` | 1024px+ | Desktop (agent dashboard primary) |
| `xl` | 1280px+ | Wide desktop |

### Dashboard Responsive Behavior

| Element | Mobile (<768px) | Tablet (768-1023px) | Desktop (1024px+) |
|---------|--------|--------|---------|
| Sidebar | Hidden, hamburger toggle | Collapsed (icons only) | Full sidebar |
| Session list | Full-width cards | Full-width cards | Full-width cards, max-w-4xl |
| Session detail | Single column, stacked | Single column, stacked | Two columns (preferences + profile) |
| Chat link section | Full-width, stacked buttons | Full-width | Inline |

### Chat Responsive Behavior

| Element | Mobile (<640px) | Desktop (640px+) |
|---------|--------|---------|
| Container | Full viewport, no margins | Centered, `max-w-lg`, subtle bg |
| Message bubbles | `max-w-[85%]` | `max-w-[75%]` |
| Input | Fixed bottom, full width | Fixed bottom, within max-w container |
| Quick-reply chips | Horizontal scroll if overflow | Wrap |
| Header | Compact (logo + tagline) | Compact (logo + tagline) |

---

## 7. Interaction Patterns

### Confidence Visualization

Used across the agent dashboard for preference confidence and profile scores.

**Bar variant (preferences list):**
```
████░░░░░░  35% Low      → Red-400
█████░░░░░  54% Medium   → Amber-500
████████░░  82% High     → Emerald-500
```
- 10-segment bar using Tailwind `w-1` segments
- Filled segments use confidence-appropriate color
- Unfilled segments use `bg-muted`
- Text label to the right: percentage + word (High/Medium/Low)

**Star variant (buyer profile):**
```
★★★★★  Must-have
★★★★☆  Firm
★★★☆☆  Flexible
★★☆☆☆  Nice-to-have
★☆☆☆☆  Weak signal
```
- 5-star scale using filled/unfilled star icons
- Paired with flexibility label

### Status Badges

| Status | Visual | Color |
|--------|--------|-------|
| Parsing | `○` + pulse animation | `muted-foreground` |
| Parsed | `○` solid | `warning` (amber) |
| Chat Active | `◐` half-filled | `primary` (blue) |
| Complete | `●` filled | `secondary` (emerald) |

All badges use shape + color (not color alone) for accessibility.

### Toast Notifications (Sonner-style)

Using `sonner` (pairs with shadcn/ui) for beautiful, stacking toasts:

- Position: Bottom-right on desktop, bottom-center on mobile
- Glassmorphism: `backdrop-blur-md bg-surface-2/95 border border-border/50 rounded-xl shadow-elevation-3`
- Duration: 4 seconds, auto-dismiss with thin progress bar (accent color) at bottom
- Swipe to dismiss (touch devices)
- Stack: Up to 3 visible, older ones compress behind (like iOS notifications)
- Types:
  - Success: Left accent border `success`, `Check` icon in green circle
  - Error: Left accent border `destructive`, `X` icon in red circle
  - Info: Left accent border `accent`, `Info` icon in blue circle
- Example: "Link copied to clipboard!" with `Check` icon, slides in from bottom with spring animation

### Loading States (Polished Skeletons & Choreography)

| Context | Pattern |
|---------|---------|
| Transcript parsing | **Sequenced animation:** Centered spinner (gradient `--gradient-hero` ring), then step labels appear one by one ("Extracting preferences…" → "Detecting gaps…" → "Scoring confidence…") with slide-up + fade, each 800ms apart. Feels intelligent, not generic |
| Session list loading | 3 skeleton cards with shimmer effect (gradient sweep animation `surface-3` → `surface-2` → `surface-3`). Skeleton shapes match real card layout (name bar, summary bar, confidence bar) |
| Chat AI thinking | Typing indicator: three dots in a `surface-3 rounded-2xl rounded-bl-md` bubble (same shape as AI messages). Dots bounce with staggered `translateY` animation. After 5s: "Still thinking…" text fades in below |
| Chat AI streaming | Text appears token-by-token with subtle fade per token. Cursor blink at end of streaming text (thin `accent` line, `opacity` blink) |
| Profile loading | Right column shows skeleton with animated gradient fills that mimic the star ratings and text lines. Feels like the profile is "building" |
| Page transitions | Content area cross-fades with `opacity` + `translateY(8px)`. 200ms duration |

### Error States (Friendly, Designed)

| Context | Pattern |
|---------|---------|
| Transcript too short | Inline: Red-tinted `destructive/5` bg card below textarea with `AlertCircle` icon + "Transcript seems too short. Paste the full conversation for best results." Shakes once on appear (subtle `translateX` oscillation, 300ms) |
| Parsing failed | Replaces spinner with: `surface-2 rounded-xl p-6` card, `AlertTriangle` icon (40px, `warning` color), heading "Couldn't parse this transcript", body text + "Try Again" button (`accent` bg). Icon has gentle bounce animation |
| Chat connection lost | In-chat system message: `surface-3` bg card with `WifiOff` icon + "Connection lost. Reconnecting…" Auto-retry with progress. If fails: "Something went wrong. Your progress is saved — try refreshing." + Refresh button |
| Invalid chat link | Full-screen centered: `Link2Off` icon (48px, `muted-foreground`), heading "This link isn't active", body "Check with your agent for the right link." Clean, no blame |
| API error (generic) | Toast: Slides in from top, `surface-2` bg with `backdrop-blur`, red left border accent, `AlertCircle` icon + message. Auto-dismiss 5s with countdown bar |

---

## 8. Component Architecture (Vercel Composition Patterns)

Following the composition patterns from Vercel's agent-skills, the UI is structured as compound components with lifted state.

### Dashboard Components (shadcn/ui based)

```
<DashboardLayout>
  <Sidebar>
    <Sidebar.Logo />
    <Sidebar.Nav>
      <Sidebar.NavItem />
    </Sidebar.Nav>
  </Sidebar>
  <Sidebar.Content>
    {children}  ← routed content
  </Sidebar.Content>
</DashboardLayout>
```

```
<SessionCard>
  <SessionCard.Header>
    <SessionCard.BuyerName />
    <SessionCard.Status />
  </SessionCard.Header>
  <SessionCard.Summary />
  <SessionCard.ConfidenceBar />
</SessionCard>
```

```
<PreferenceList>
  <PreferenceCard>
    <PreferenceCard.Category />
    <PreferenceCard.Value />
    <PreferenceCard.ConfidenceBar />
  </PreferenceCard>
  <ContradictionCard />
  <GapCard />
</PreferenceList>
```

```
<BuyerProfile>
  <BuyerProfile.Item>
    <BuyerProfile.Rank />
    <BuyerProfile.Criterion />
    <BuyerProfile.Stars />
    <BuyerProfile.Flexibility />
    <BuyerProfile.Source />
  </BuyerProfile.Item>
  <BuyerProfile.Summary />
</BuyerProfile>
```

### Chat Components (assistant-ui based)

```
<ChatLayout>
  <Chat.Header>
    <Chat.Logo />
    <Chat.Progress />     ← "Question 3 of ~10"
  </Chat.Header>
  <Chat.MessageList>
    <Chat.AssistantMessage />
    <Chat.UserMessage />
    <Chat.TypingIndicator />
    <Chat.QuickReplies>
      <Chat.Chip />
    </Chat.QuickReplies>
  </Chat.MessageList>
  <Chat.Input>
    <Chat.TextInput />
    <Chat.SendButton />
  </Chat.Input>
</ChatLayout>
```

**State management:** Each layout has its own provider (per Vercel composition patterns). Dashboard uses TanStack Query for server state. Chat uses assistant-ui's runtime adapter consuming SSE from the API.

---

## 9. Dark Mode Support

Following Vercel web design guidelines:

- Set `color-scheme: dark` on `<html>` when dark mode active
- Set `<meta name="theme-color">` to match background color
- All semantic color tokens have light/dark variants (defined in Section 5)
- Native `<select>` elements get explicit color values for Windows dark mode
- Default: Follow system preference via `prefers-color-scheme`
- Toggle: Not needed for MVP (system-follow is sufficient)

---

## 10. Accessibility Checklist (Vercel Web Design Guidelines)

### Must-Have (MVP)

- [ ] All icon-only buttons have `aria-label`
- [ ] All form controls have associated `<label>` elements
- [ ] Interactive elements support keyboard navigation (`onKeyDown`)
- [ ] Navigation uses `<a>`/`<Link>`, never `<div onClick>`
- [ ] All images have `alt` text; decorative icons have `aria-hidden="true"`
- [ ] Headings are hierarchical (h1 → h2 → h3)
- [ ] Visible focus rings on all interactive elements (`focus-visible:ring-*`)
- [ ] Never `outline-none` without a replacement
- [ ] Status communicated with shape + color (not color alone)
- [ ] `aria-live="polite"` on dynamically updating content (chat messages, parsing status)
- [ ] `prefers-reduced-motion` respected on all animations
- [ ] Form inputs use correct `type` and `inputmode`
- [ ] No `user-scalable=no` on viewport meta
- [ ] No `onPaste` with `preventDefault`
- [ ] Buttons/links have `hover:` states with increased contrast

### Nice-to-Have (Post-MVP)

- [ ] Skip links for dashboard navigation
- [ ] `scroll-margin-top` on heading anchors
- [ ] Complete ARIA landmarks on all layout sections
- [ ] Screen reader testing with VoiceOver

---

## 11. MVP Scope vs. Post-MVP

### MVP (Build This)

| Screen | Scope |
|--------|-------|
| Session List | Basic card list, status badges, create new |
| New Session | Paste textarea + file drop, analyze button |
| Session Detail | Preferences list, confidence bars, chat link, profile view |
| Buyer Chat | Full chat UX with streaming, quick replies, progress, summary |

### Post-MVP Enhancements

| Feature | Screens Affected |
|---------|-----------------|
| Authentication (Supabase Auth) | All dashboard screens — login wall, user menu |
| Multi-buyer management | Session list — search, filter, archive |
| Listing calibration | New screen: `/chat/:sessionId/calibrate` — swipe/react to listings |
| Dream vs. right-now profiles | Profile view — tab switcher between two profiles |
| Real-time session updates | Session detail — live status when buyer is chatting |
| Onboarding flow | First-time agent experience — guided tour |
| Mobile agent dashboard | Responsive polish for agent-on-phone scenarios |

---

## 12. Key UX Metrics to Track (Post-MVP)

| Metric | Target | Why |
|--------|--------|-----|
| Buyer chat completion rate | >80% | Are buyers finishing the conversation? |
| Avg. buyer session duration | <5 min | Are we respecting attention? |
| Avg. questions before "Good Enough" | 8-10 | Is the AI efficient? |
| Agent time: transcript → chat link sent | <2 min | Is the agent workflow fast? |
| Profile confidence score | >75% avg | Is the system producing useful output? |
| Buyer satisfaction (post-chat rating) | >4/5 | Did the buyer feel heard? |
