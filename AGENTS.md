# Project instructions

Shared instructions for AI coding agents (Codex reads this file; Claude Code reads it via CLAUDE.md).

## Project
- Repo: https://github.com/h7027170-wq/test2
- Product: **Nafess** — anonymous mental-health peer support. Brief, flows and status log: `docs/brief.md`. Review: `docs/review.md`.
- Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest. Locales `ar` (default, RTL), `fr`, `en`.
- v1 is a front-end prototype: data lives in the browser (`src/services/store.ts`). Screens only talk to `src/services/*`; that is where a real API plugs in.

## Commands
- `npm run dev` — dev server on http://localhost:3000
- `npm run check` — tokens + contrast, i18n parity, lint, typecheck, tests (must pass before a PR)
- `npm run tokens` — regenerate `src/styles/tokens.css` and `design-system/index.html` from `design-system/tokens.json`
- `npm run build` — production build

## Conventions
- Design tokens: edit `design-system/tokens.json` only, then `npm run tokens`. Components use token classes (`bg-surface`, `text-ink`), never raw hex.
- All UI text lives in `messages/{en,fr,ar}.json`; `en.json` is the reference. No emoji, no invented statistics, no emergency phone numbers.
- RTL: logical utilities only (`ms-`, `pe-`, `start-`…); directional icons flip; member text gets `dir="auto"`.
- Errors and crisis use the warm (clay) tokens, never red.

## Workflow
- Pull the latest `main` before starting work.
- Do each task on its own branch (e.g. `claude/<task>` or `codex/<task>`), never commit straight to `main`.
- Open a pull request for review; merge only after it's checked.
- Keep commits small with clear messages.
- Update this file when the stack, commands, or conventions change, so every agent stays in sync.
