import type { RoundSeeds } from "../types";

export interface DeterministicRng {
  next(): number;
  nextInt(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T | undefined;
}

const DEFAULT_SEED = 0x9e3779b9;
const UINT32_RANGE = 0x100000000;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export const createSeededRng = (seed: number): DeterministicRng => {
  let state = seed >>> 0 || DEFAULT_SEED;

  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / UINT32_RANGE;
  };

  const nextInt = (maxExclusive: number) =>
    maxExclusive <= 0 ? 0 : Math.floor(next() * maxExclusive);

  const pick = <T>(items: readonly T[]) =>
    items.length === 0 ? undefined : items[nextInt(items.length)];

  return { next, nextInt, pick };
};

const mixByte = (hash: number, byte: number): number =>
  Math.imul(hash ^ byte, FNV_PRIME) >>> 0;

const mixNumber = (hash: number, value: number): number => {
  let nextHash = hash;
  const normalized = value >>> 0;
  for (let shift = 0; shift < 32; shift += 8) {
    nextHash = mixByte(nextHash, (normalized >>> shift) & 0xff);
  }
  return nextHash;
};

const mixString = (hash: number, value: string): number => {
  let nextHash = hash;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    nextHash = mixByte(nextHash, code & 0xff);
    nextHash = mixByte(nextHash, code >>> 8);
  }
  return nextHash;
};

export const deriveSeed = (
  baseSeed: number,
  ...parts: readonly (number | string)[]
): number => {
  let hash = mixNumber(FNV_OFFSET_BASIS, baseSeed);
  for (const part of parts) {
    hash = mixByte(hash, 0xff);
    hash =
      typeof part === "number" ? mixNumber(hash, part) : mixString(hash, part);
  }
  return hash || DEFAULT_SEED;
};

export const createRoundSeeds = (
  matchSeed: number,
  roundIndex: number
): RoundSeeds => ({
  matchSeed: matchSeed >>> 0,
  roundIndex,
  mapSeed: deriveSeed(matchSeed, roundIndex, "map"),
  powerupSeed: deriveSeed(matchSeed, roundIndex, "powerups"),
  botSeedBase: deriveSeed(matchSeed, roundIndex, "bots"),
});

export const createRuntimeSeed = (): number => {
  const bytes = new Uint32Array(1);
  if (globalThis.crypto) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] || DEFAULT_SEED;
  }

  const timeSeed = Date.now() ^ Math.floor(globalThis.performance?.now() ?? 0);
  return deriveSeed(timeSeed, "runtime");
};
