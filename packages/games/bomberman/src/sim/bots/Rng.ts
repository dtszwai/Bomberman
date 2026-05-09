import { BotRng } from "./BotTypes";

const DEFAULT_SEED = 0x9e3779b9;
const UINT32_RANGE = 0x100000000;

export const createDeterministicRng = (seed: number): BotRng => {
  let state = seed >>> 0 || DEFAULT_SEED;

  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / UINT32_RANGE;
  };

  const nextInt = (maxExclusive: number) => maxExclusive <= 0 ? 0 : Math.floor(next() * maxExclusive);

  const pick = <T>(items: readonly T[]) => items.length === 0 ? undefined : items[nextInt(items.length)];

  return { next, nextInt, pick };
};
