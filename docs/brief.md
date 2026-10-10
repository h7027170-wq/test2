# Nafess — Project brief

**Client:** Nafess (internal / owner) · **Type:** web app (website only, no native app) · **Deadline:** not set
**Languages:** AR + FR + EN (primary: AR, RTL) · Algerian Darija (ar-DZ) planned later · **Stack:** Next.js (App Router) + Tailwind CSS 4 + TypeScript

> Nafess (نَفَس, "breath") is an anonymous mental-health peer-support website.

## Goal
Give people in Algeria a calm, safe place to share what they live with a mental-health condition under a
pseudonym, read others who live the same thing, and feel less alone. Publicly, a member is only a nickname
and an avatar; the optional recovery email is private and encrypted, and is never shown.
Success for v1: a visitor can join communities, read, react, write a story that goes through moderation,
and recover their account without an email.

## Target users
- **Members:** adults in Algeria living with a condition (or close to someone who does). Mostly on phones,
  often at night, often in a fragile state. Care about anonymity above everything, and about not being judged.
- **Therapists:** psychologists / psychiatrists who reply with a verified badge.
- **Moderators / admins:** review held content and reports. Desktop and phone.

## Brand assets
- Logo: wordmark "Nafess / نَفَس" with a breath-wave mark (created in v1).
- Colors: derived in Phase 2 — paper `#f7f4ee`, sage `#2d6a5f`, mist `#8fcfbd`, clay `#a2462c`, night `#0f1615` (see `design-system/tokens.json`).
- Fonts: Fraunces + IBM Plex Sans (Latin), Noto Naskh Arabic + IBM Plex Sans Arabic (Arabic), IBM Plex Mono (Latin labels).
- Feel (3 words): calm, warm, safe.

## Product rules (from the owner)
- Members are anonymous: nickname + avatar, never a real name. Age range and country stay private.
- One community per condition (placeholder list until the owner sends the final one): depression, anxiety,
  panic attacks, schizophrenia, bipolar, OCD, trauma/PTSD, eating disorders, ADHD, grief.
  Each community has a **tint** and a **sensitivity** (standard / sensitive / high).
- Posts: story, check-in, win. Each has a **mood** (heavy / low / okay / steady / light) and an optional
  **veil** (content hidden behind a warning) for hard topics.
- Replies two levels deep. Reactions: relate / strength / helped / thanks. Members can save stories.
- Roles: member, therapist, moderator, admin. Staff accounts are never created through sign-up.
- Safety: a post with identifying details (phone, email, @handle, link, "my name is…", street address), or
  posted in a high-sensitivity community, is **held for a moderator**. Members can report and block.
  Crisis help is always one tap away.
- Tone: calm, warm, non-clinical. **No emoji. No invented statistics** (show `000` as a placeholder).
  **No emergency phone numbers** until local partners verify them.
- All AR and FR copy is AI-written and needs a native-speaker review.

## Screen list
Every route exists under `/ar`, `/fr`, `/en`. Every data view has loading, empty and error states.

| # | Screen | Route | Purpose | Key content / components |
|---|--------|-------|---------|--------------------------|
| 1 | Home | `/` | Explain Nafess, invite to join | Hero, how it works, communities preview, safety promise, recent stories |
| 2 | Communities | `/communities` | Browse all communities | Community cards (tint, sensitivity, member count `000`) |
| 3 | Community | `/communities/[id]` | Feed of one community | Join/leave, filter by kind, story cards |
| 4 | Story reader | `/stories/[id]` | Read one story | Veil, reactions, replies (2 levels), save, copy link, report, block |
| 5 | Write | `/write` | Compose a story | Community, kind, mood, prompt chips, veil, PII warning, draft status, held-for-review state |
| 6 | Saved | `/saved` | Saved stories | Story list, empty state |
| 7 | Notifications | `/notifications` | Replies, reactions, moderation outcomes | List, mark all read |
| 8 | Profile | `/profile` | Own private profile | Nickname, avatar, communities, recovery method, privacy notes |
| 9 | Discussions | `/discussions` | Chat rooms (mock data, no backend) | Room cards, live dot |
| 10 | Room | `/discussions/[id]` | One chat room (mock) | Message list, composer, typing indicator, guided breathing minute |
| 11 | About | `/about` | What Nafess is and isn't | Static |
| 12 | Guidelines | `/guidelines` | Community rules | Static |
| 13 | Crisis help | `/help` + header button | Always-reachable support | Grounding steps, "talk to someone you trust", numbers pending verification |
| 14 | Sign up | `/signup` | 3 steps | Communities → identity (nickname + live availability, avatar) → security (password + recovery code or email) |
| 15 | Sign in | `/signin` | | Lockout after 5 tries (15 min), suspended-account message |
| 16 | Forgot | `/forgot` | Recover | By recovery code or by email link → new password |
| 17 | Verify email | `/verify-email` | Email link landing | Success / expired states |
| 18 | Moderation queue | `/moderation` | Held content | Queue rows, approve / reject (reason required) |
| 19 | Reports | `/moderation/reports` | Member reports | Dismiss / remove content |
| 20 | 404 | `[...rest]` | Not found | |

## Main user flows

### Flow 1 — Sign up and join communities
1. Visitor taps "Join Nafess" on Home.
2. Step 1: picks one or more communities (at least one).
3. Step 2: chooses a nickname (live availability check) and an avatar. No real name, no email required.
4. Step 3: sets a password (strength meter), then picks recovery: a one-time recovery code (shown once,
   must confirm they saved it) or a recovery email.
5. Success: lands on Home as a member, communities joined, header shows avatar menu.

### Flow 2 — Read and react to a story
1. Member opens a community and taps a story card.
2. If the story is veiled, they see the warning and choose "Show story".
3. They react (relate / strength / helped / thanks), save it, reply, or reply to a reply.
4. Success: reaction count updates, story appears in Saved, reply appears in the thread.

### Flow 3 — Write a story that is held, then approved
1. Member taps "Write", picks community, kind and mood, optionally a prompt chip.
2. Types the story; the draft saves automatically ("Draft saved").
3. Text includes a phone number → inline warning explains it will be held.
4. Publishes → "Held for review" screen.
5. Moderator reviews it in `/moderation`. Approving a story held for identifying details removes the
   detected details first (they are replaced with "[removed]"); the moderator sees exactly what will be removed.
6. Member gets a notification and the story is public.

### Flow 4 — Recover a forgotten password
1. Member taps "Forgot password" on Sign in.
2. Chooses "I have my recovery code" (or "Send me an email link").
3. Enters nickname + code → sets a new password.
4. Success: signed in, old code invalidated, new code shown once.

### Flow 5 — Moderator handles the queue and reports
1. Moderator signs in (staff accounts are seeded, never signed up) and opens Moderation.
2. Reviews a held story: sees why it was held (PII / high-sensitivity), approves or rejects with a reason.
3. Opens Reports: dismisses a report or removes the content.
4. Success: queue count drops, decisions logged.

## Acceptance rules (v1)
- `/` redirects to `/ar`, `/fr` or `/en` from the browser language (default `/ar`); the language switch keeps the same page.
- Guests can read stories and communities; reacting, replying, saving, writing, reporting need an account.
- Blocking a member hides their stories and replies from you.
- Sign-up asks for an age range (18+ only for v1; under-18 sees a kind refusal with crisis help).
- Theme follows the system by default; the choice is remembered.
- Keyboard: every action reachable, dialogs trap focus and close on Esc, visible focus ring everywhere.
- Motion is disabled under `prefers-reduced-motion`; text can be zoomed to 200% without loss.
- Member-written text uses `dir="auto"`.
- Same PII check applies to replies (held) and to chat messages (warning only, chat is mock).

## Prototype honesty
v1 is a front-end prototype: accounts, sessions, moderation and recovery are **simulated in the browser**
(localStorage). Anyone using the same browser can see that data. Therapist verification is simulated.
None of this is a security boundary until the real API exists (Phase 6).

## Out of scope (v1)
- Real backend, database, real email sending: v1 is a front-end prototype with a mock service layer
  (data in the browser). The service layer is the seam where a real API plugs in (Phase 6).
- Real-time chat backend (discussions run on mock data).
- Darija locale, native apps, verified crisis numbers, analytics.
- Hosting: not decided; no deploy without the owner's approval.

## Open questions
- Final communities list.
- Native-speaker review of AR and FR copy.
- Verified crisis numbers / local partners.
- Hosting choice (the real app needs an API + database, so plain Vercel static hosting is not the whole story).
- Logo: wordmark only for v1 — does the owner want a symbol?

## Inspiration decisions
Phase 1 skipped: no references were sent. Visual direction derived from the brief's feel (calm, warm, safe):
warm paper background instead of clinical white, a deep sage primary (growth, calm, not "medical blue"),
soft community tints, warm clay for errors and crisis (never alarm red), generous type size and line height.

| Ref | Take | Adapt / avoid |
|-----|------|---------------|
| — | (none) | Avoid clinical blue/white hospital look, avoid emoji-heavy social-app look |

## Status log
- 2026-10-10 — Phase 0 drafted from the owner's description. Stack: Next.js App Router + Tailwind 4 + TS. Languages: AR (default, RTL) + FR + EN.
- 2026-10-10 — Owner asked to run straight to version 1 without checkpoints (comparison test of the pipeline). Phases 0–2 and 4 run back to back; approvals collected at the end.
- 2026-10-10 — Phase 1 skipped (no references). Phase 3 Figma skipped for v1 (live prototype is the mockup).
- 2026-10-10 — Codex used as second-opinion reviewer in Phase 5. No deploy (hosting undecided).
- 2026-10-10 — Phase 2 drafted: tokens in `design-system/tokens.json`, 70/70 contrast pairs pass AA in both themes. Codex reviewed it; fixes applied (placeholder token, more pairs, generator checks).
- 2026-10-10 — Phase 4 v1 built: all 20 screens in ar/fr/en, browser-only mock services. Not deployed.
- 2026-10-10 — Phase 5 review done (`docs/review.md`): 3 Critical, 12 Important resolved; 2 Important and 4 Polish open.
- 2026-10-10 — Waiting for owner: approve brief + design system + v1, decide on seed reaction counts, hosting.
- 2026-10-10 — v2 started on branch `claude/nafess-v2` (never merged; v1 stays on `claude/nafess-v1`). Figma file "Nafess v2" created in team Nafess: https://www.figma.com/design/zHLiSInRFHFuaumJSWzxl3 . Owner chose Figma AI to generate the new design (prompt in `docs/figma-v2-prompt.md`).
