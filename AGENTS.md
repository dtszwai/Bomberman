# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (Vite + React) — @arcade/web
pnpm dev           # start frontend dev server
pnpm build         # tsc type-check + vite build
pnpm lint          # eslint (whole workspace)

# Backend (Node + Socket.IO) — @arcade/server
pnpm server        # run server once
pnpm server:dev    # run server with watch/hot-reload
```

Root scripts are thin wrappers that run `pnpm --filter @arcade/web ...` or `pnpm --filter @arcade/server ...`. You can also invoke the filters directly.

No test suite exists. Type-check via `pnpm build`.

Environment: copy `.env` with `VITE_SOCKET_URL` (client) and `PORT`, `HOST`, `CORS_ORIGIN` (server). Server defaults to `ws://localhost:3000`.

## Architecture

Full-stack TypeScript monorepo. Leaf engines live under `packages/`, the game lives at `packages/games/bomberman/` (with `sim`/`room`/`ui` subpath exports), and the two apps live under `apps/` — `apps/web` (Vite + React client) and `apps/server` (Node + Socket.IO). Wire types come from `@arcade/games-bomberman/sim` (events, snapshots, game state). Deployed frontend to GitHub Pages; backend is a separate Node process.

### Path aliases
`@/*` → `apps/web/src/*` (configured in `apps/web/tsconfig.json` and resolved by `vite-tsconfig-paths`). The alias is scoped to `apps/web` only — packages never reach into apps.
