# Nafess · نَفَس

Anonymous mental-health peer support for Algeria. Arabic (default, right-to-left), French and English; light and dark themes.

> **Version 1 is a clickable prototype.** Accounts, stories, moderation and recovery are simulated and stored in your
> browser only. Nothing is sent to a server. Use "Reset demo data" in the footer to start over.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 (you are redirected to `/ar`, `/fr` or `/en` from your browser language).

Demo accounts (password `breathe-slowly-2026`, from `src/data/seed.ts`):

| Nickname | Role |
|----------|------|
| `demo-member` | member |
| `demo-moderator` | moderator (opens the moderation panel) |
| `demo-suspended` | shows the suspended-account message |

Add `?simulate=error` to any URL to see the error states.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run check` | Token contrast (WCAG AA), i18n key parity, lint, typecheck, unit tests |
| `npm run tokens` | Regenerates CSS variables and the design-system page from `design-system/tokens.json` |
| `npm run build` / `npm start` | Production build and server |

## Where things are

- `docs/brief.md` — brief, screens, the 5 main flows, decisions (status log)
- `docs/review.md` — Phase 5 review (Claude + Codex), with status of every finding
- `design-system/` — `tokens.json` (source of truth), `index.html` (visual page), `contrast.json`
- `src/app/[locale]/` — every screen
- `src/services/` — the only data layer screens use (mock today, API later)
- `messages/` — all UI text

## Not done yet

Real backend and database, real email, chat backend, Darija locale, verified crisis numbers, native-speaker review
of Arabic and French, end-to-end tests, hosting.
