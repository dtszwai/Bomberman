import { useState } from "react";
import { Bot, Minus, Plus, RotateCcw, User } from "lucide-react";
import {
  LocalGameContainer,
  type LocalActor,
} from "@arcade/games-bomberman/ui";
import { Button } from "@/components/ui/button";

const MAX_BOTS = 4;
const MIN_BOTS = 1;

// Large odd primes give each bot a distinct PRNG stream from the same base.
const BOT_SEED_BASE = 0x10ca1b07;
const BOT_SEED_STRIDE = 0x1f123bb5;

const createActors = (botCount: number): LocalActor[] => [
  { kind: "human-local", inputIndex: 0, name: "Player 1" },
  ...Array.from({ length: botCount }, (_, index): LocalActor => ({
    kind: "bot",
    difficulty: "hell",
    name: `CPU ${index + 2}`,
    seed: BOT_SEED_BASE + index * BOT_SEED_STRIDE,
  })),
];

export const OfflineDemoRoute = () => {
  const [botCount, setBotCount] = useState(MIN_BOTS);
  const [restartCount, setRestartCount] = useState(0);
  const gameKey = `${restartCount}:${botCount}`;

  const restart = () => setRestartCount((n) => n + 1);

  const adjustBots = (delta: number) =>
    setBotCount((count) =>
      Math.min(MAX_BOTS, Math.max(MIN_BOTS, count + delta))
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Bomberman Arena</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Player 1
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bot className="h-4 w-4" />
                {botCount} CPU
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustBots(-1)}
              disabled={botCount <= MIN_BOTS}
            >
              <Minus />
              Bot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustBots(1)}
              disabled={botCount >= MAX_BOTS}
            >
              <Plus />
              Bot
            </Button>
            <Button size="sm" onClick={restart}>
              <RotateCcw />
              Restart
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-black">
          <div className="mx-auto aspect-[256/232] max-h-[calc(100vh-9rem)] w-full max-w-[calc((100vh-9rem)*256/232)]">
            <LocalGameContainer key={gameKey} actors={createActors(botCount)} />
          </div>
        </div>
      </main>
    </div>
  );
};
