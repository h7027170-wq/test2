# Nafess v1 — Review (Phase 5)

**Build reviewed:** `claude/nafess-v1`, production build (`next build` + `next start`) on localhost. Not deployed.
**Reviewers:** Claude (browser walk-through + code) and Codex CLI (`codex exec`, read-only, code review against the
same rubric). Each finding says who found it. Where we disagreed, the decision and the reason are written down.
**Rubric:** `client-project-pipeline/references/review-rubric.md` (Nielsen H1–H10, WCAG 2.2 AA, RTL, states,
design-system consistency, responsive).

## Coverage

| Flow | Breakpoint | Language | Theme | Input | Result |
|------|-----------|----------|-------|-------|--------|
| 1 Sign up + join | 375 | AR | light | **keyboard only** | Pass after fixes |
| 1 Sign up + join | 375 | AR | light | mouse | Pass after fixes |
| 2 Read + react + reply (2 levels) + save | 1440 | AR (French story inside) | dark | mouse | Pass |
| 3 Write (Arabic-digit phone) → held → approved → notification | 1440 | EN (writer), EN (moderator), AR (notification) | light / dark | mouse | Pass after fixes |
| 4 Recover with code (+ lockout after 5 tries) | 768 | FR | dark | mouse | Pass |
| 5 Moderator queue + reports (Esc closes dialog) | 1440 | EN | light | mouse + keyboard | Pass |
| States: error (`?simulate=error`), 404 | 375 | FR, AR | light | — | Pass |
| Header | 375 / 768 / 1440 | AR / FR / EN | light / dark | — | Pass after fixes |

Automated: `npm run check` = tokens + contrast (70/70 pairs AA in both themes), i18n key parity, ESLint, TypeScript,
Vitest (17 tests: PII detection incl. Arabic-Indic digits, password strength, nicknames, locale matching).

Not covered yet: a real screen reader pass (VoiceOver / TalkBack), real phones, 320 px reflow and 200 % zoom,
reduced-motion on a real device, Playwright end-to-end tests (Phase 6).

## Critical

| # | Location | Issue | Criterion | Fix | Found by | Status |
|---|----------|-------|-----------|-----|----------|--------|
| C1 | Write → Moderation, all breakpoints, all languages | The content-note (veil) text was not scanned for identifying details, and was not redacted on approval, but it is shown publicly. | Product rule: PII is held; anonymity | Scan title + body + veil; redact all three on approval; show all three in the preview. | Codex | **Resolved** |
| C2 | Write, replies, chat — AR | Phone numbers typed with Arabic-Indic digits (`٠٥٥٥ ١٢ ٣٤ ٥٦`, `۰۵۵۵…`) were not detected, so they were published without review. | Product rule: PII is held | Normalise Arabic-Indic digits before matching (offsets preserved). Covered by tests; verified in the browser in Flow 3. | Codex | **Resolved** |
| C3 | Every page with community cards / auth card — 375 — AR | The page was 438 px wide on a 375 px phone (horizontal scroll). Two causes: a non-wrapping "Every post reviewed" badge, and decorative blurs inside `overflow-hidden` that the browser scrolled when a field got focus — which pushed the guidelines checkbox off-screen in sign-up step 3. | WCAG 1.4.10 Reflow; Flow 1 blocked on phones | Badges wrap; cards `min-w-0`; decorative wrappers use `overflow-clip` (not a scroll container). | Claude | **Resolved** |

## Important

| # | Location | Issue | Criterion | Fix | Found by | Status |
|---|----------|-------|-----------|-----|----------|--------|
| I1 | Sign up step 2 — keyboard | Arrowing through the age select landed on "Under 18" and immediately swapped the whole page for the refusal screen. | WCAG 3.2.2 On Input; H5 | The refusal appears only when the member presses Continue. | Claude | **Resolved** |
| I2 | Header — 375 | Both crisis buttons rendered (class conflict `hidden` vs `inline-flex`); at 768 FR the full label wrapped on two lines and crowded the header. | Product rule: crisis help one tap away; H8 | `cn()` now uses tailwind-merge; icon-only crisis button (with label) below `lg`, full label from `lg`. | Claude (+ Codex for "two taps on phones") | **Resolved** |
| I3 | Story reader | Reacting did not re-render reliably (same object returned to React state). | H1 Visibility of status | Return fresh objects. Verified: 31 → 32, `aria-pressed` true. | Codex | **Resolved** |
| I4 | Report dialog | Rate-limited reports closed the dialog and said "Thank you". | H1, H9 | Show the rate-limit message and keep the dialog open. | Codex | **Resolved** |
| I5 | Sign in, sign up, write, forgot, moderation, reactions, save, replies, chat | A failed service call left buttons spinning with no message. | H9; states | `try / finally` everywhere, plain-language error, input kept. Codex's verification pass marked the first fix PARTIAL (story actions and chat were still unguarded); those were then fixed too. | Codex | **Resolved** |
| I6 | Blocking | A blocked author's story stayed reachable by direct link and in Saved. | Acceptance rule "blocking hides" | Same filter in `getStory` and `listSaved`. | Codex | **Resolved** |
| I7 | Forgot password (prototype inbox) | The fake inbox showed the latest reset link of *any* account. | Correctness, privacy | Inbox shows only the mail created by this request. | Codex | **Resolved** |
| I8 | Moderation | The preview showed only the redacted body, not the title. | Flow 3: moderator sees exactly what will be published | Preview title, body and veil. | Codex | **Resolved** |
| I9 | Audit panel, communities, discussions | Missing loading / error / empty states. | States checklist | Added. | Codex | **Resolved** |
| I10 | Sign up — errors | The error summary rendered at the top while the member was at the bottom of the form. | H9; WCAG 3.3.1 | Focus moves to the error summary. | Claude | **Resolved** |
| I11 | Write → "Held for review" | The confirmation opened scrolled to the bottom, its top cut off. | H1 | Scroll to top and focus the confirmation. | Claude | **Resolved** |
| I12 | Relative times — AR | "منذ 4 دقيقة" (wrong plural). | H2 Match with the real world | `Intl.RelativeTimeFormat` → "قبل 3 دقائق", "قبل ساعتين". | Claude | **Resolved** |
| I13 | Seed content | Seeded stories carry reaction counts (14, 22, 31…). Codex flagged them as invented statistics. | Product rule "no invented statistics" | **Kept, with reason:** these are sample stories inside a prototype that is labelled as a prototype in every footer; platform-level numbers (members, stories, communities) do show `000`. **Must be removed before any real launch**; the seed file says so. | Codex | **Open — owner decision** |
| I14 | Navigation (automation only) | Twice, opening `/fr/signin` or `/en/signin` right after another page landed on the locale home. No code path does this and it did not reproduce in three further tries. | — | Check on a real device; if it reproduces, capture the stack with the history hook used in the review. | Claude | **Open — not reproduced** |

## Polish

| # | Location | Issue | Fix | Found by | Status |
|---|----------|-------|-----|----------|--------|
| P1 | Write — mood picker | Custom radiogroup had no name or arrow keys. | `aria-label` + roving tabindex + arrows (RTL-aware). | Codex | **Resolved** |
| P2 | Report note, decision reasons | Member text fields lacked `dir="auto"`. | Added. | Codex | **Resolved** |
| P3 | Copy link / copy code | "Copied" was announced even when the clipboard failed. | Announce only on success; otherwise explain. | Codex | **Resolved** |
| P4 | Hero, story body | Arbitrary font size / line-height outside the token scale. | New `5xl` (56 px) step in `tokens.json`; story body uses the base leading. | Codex | **Resolved** |
| P5 | Choice cards (radio / checkbox) | Accessible name came only from the wrapping label. | Explicit `aria-labelledby`. | Claude | **Resolved** |
| P6 | Recovery code box — 375 | Code broke across two lines mid-group. | One line, smaller size on phones. | Claude | **Resolved** |
| P7 | Story reader | Reply count did not update after replying. | Quiet reload of the story. | Claude | **Resolved** |
| P8 | Sign up — avatar | 8 shapes + 4 colours are 12 separate tab stops. | Roving tabindex like the mood picker. | Claude / Codex | Open |
| P9 | Moderation audit | Shows a raw id instead of the story title. | Store and show the title. | Claude | Open |
| P10 | Profile — blocked list | Shows member ids, not nicknames. | Resolve nicknames. | Claude | Open |
| P11 | All AR / FR copy | Written by AI. | Native-speaker review before launch. | Brief | Open |

## Disagreements

- **Seed reaction counts (I13):** Codex says remove; Claude kept them for the demo and documented why. Owner decides.
- **"Critical" vs "Important" for mobile overflow (C3):** Codex did not see it (it can't render the page); Claude rated
  it Critical because the guidelines checkbox was unreachable on a phone in Arabic, which blocks Flow 1.

## Verification pass

After the fixes, Codex re-read the diff (`b6648dd..HEAD`) and marked C1, C2, I1–I4, I6–I9 **FIXED** with file:line
evidence and found no new bugs. It marked error handling **PARTIAL**; the remaining handlers were added and
`npm run check` + `next build` pass. Claude re-walked the affected screens in the browser (375 / 768 / 1440).
