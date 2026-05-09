# Bomberman Online

A multiplayer Bomberman arcade game built as a TypeScript monorepo. The
frontend is a Vite + React app, the backend is a Node + Socket.IO server, and
the reusable game, lobby, transport, storage, rendering, and netcode engines
live under workspace packages.

<p align="center">
  <img src="./screenshots/in-game.png" alt="Gameplay screenshot" width="600" />
</p>

<p align="center">
  <a href="https://dtszwai.github.io/Bomberman/">Play the deployed frontend</a>
</p>

## Features

- Online rooms with realtime Socket.IO lobby and game state updates.
- Seat-based rooms for 2-4 players with ready states and host-controlled starts.
- CPU players with configurable names and difficulty.
- Room settings for player count, privacy, map, power-up preset, tournament mode,
  and max wins.
- Chat in the lobby and rooms.
- Deterministic Bomberman simulation with server snapshots, discrete game
  events, client resync payloads, and bot verification coverage.
- Optional Postgres-backed match/replay persistence through Drizzle.

<p align="center">
  <img src="./screenshots/lobby.png" alt="Lobby screenshot" width="600" />
</p>

<p align="center">
  <img src="./screenshots/in-room.png" alt="Room screenshot" width="600" />
</p>

## How to Play

1. Create or join a room from the lobby.
2. Choose a seat, add bots if you are the host, and mark yourself ready.
3. Start the match once the room has enough actors and ready players.
4. Use arrow keys to move and space to place bombs.
5. Collect power-ups to increase bomb range, add bombs, and move faster.

## Requirements

- Node.js compatible with the workspace toolchain.
- pnpm 9.
- Optional: Postgres if you want replay persistence.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start the backend:

```bash
pnpm server:dev
```

Start the frontend in a second terminal:

```bash
pnpm dev
```

By default, the web app connects to `ws://localhost:3000` and the server listens
on `0.0.0.0:3000`.

## Environment

```bash
# Frontend
VITE_SOCKET_URL=ws://localhost:3000

# Server
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*

# Postgres (optional; leave blank to disable replay persistence)
DATABASE_URL=postgres://user:password@localhost:5432/arcade
```

If `DATABASE_URL` is unset, the server still runs and disables replay storage.

## Commands

```bash
pnpm dev          # run @arcade/web with Vite
pnpm build        # type-check and build @arcade/web
pnpm preview      # preview the built web app
pnpm lint         # run eslint across the workspace
pnpm server       # run @arcade/server once
pnpm server:dev   # run @arcade/server in watch mode
pnpm verify:bots  # run deterministic bot verification
```

## Workspace Layout

```text
apps/
  web/       Vite + React client
  server/    Node + Socket.IO server
packages/
  canvas-renderer/        shared canvas rendering primitives
  games/bomberman/        Bomberman sim, room runtime, bots, and React UI
  lobby/                  users, rooms, chat, room actions, and broadcasts
  netcode/                snapshot buffering and interpolation helpers
  protocol/               shared wire types and event names
  realtime-core/          tick/input primitives
  storage/                Drizzle/Postgres persistence
  transport/              Socket.IO client/server transport helpers
```

The Bomberman package exposes three subpaths:

```ts
import { BattleScene } from "@arcade/games-bomberman/sim";
import { BombermanRoom } from "@arcade/games-bomberman/room";
import { OnlineGameContainer } from "@arcade/games-bomberman/ui";
```

## Architecture Notes

- Shared protocol types live in `@arcade/protocol`; apps and packages use those
  instead of app-local wire shapes.
- The server composes `@arcade/lobby`, `@arcade/games-bomberman/room`, and
  `@arcade/storage` to create rooms, broadcast lobby updates, and run matches.
- The game simulation emits snapshots for continuous state and one-shot events
  for bombs, explosions, block destruction, power-ups, and player deaths.
- The web app imports game UI from `@arcade/games-bomberman/ui` and keeps the
  app-specific route, socket context, and room controls in `apps/web`.
- The `@/*` alias is scoped to `apps/web/src/*`; workspace packages should use
  package imports instead of reaching into app code.

## Validation

There is no general test suite yet. Use the current verification commands:

```bash
pnpm build
pnpm lint
pnpm verify:bots
```
