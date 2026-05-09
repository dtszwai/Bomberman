import { FRAME_TIME } from "./game";

/* ============================
   Bomb Frame Constants
   ============================ */

/**
 * Base frame index for bomb-related animations.
 */
export const BASE_FRAME = 187;

/**
 * Derived frame indices for different bomb orientations.
 */
export const BombFrames = {
  HORIZONTAL: BASE_FRAME + 88,
  VERTICAL: BASE_FRAME + 60,
  RIGHT_LAST: BASE_FRAME + 56,
  LEFT_LAST: BASE_FRAME + 84,
  TOP_LAST: BASE_FRAME + 4,
  BOTTOM_LAST: BASE_FRAME + 32,
} as const;

/**
 * Duration before a bomb explodes after being placed.
 */
export const FUSE_TIMER = 3000;

/* ============================
   Animation Delays and Sequences
   ============================ */

/**
 * Delay between each bomb frame during the fuse animation.
 */
export const BOMB_FRAME_DELAY = 16 * FRAME_TIME;

/**
 * Delay before the bomb explosion animation starts.
 */
export const BOMB_EXPLODE_DELAY = 8 * FRAME_TIME;

/**
 * Sequence of frame indices for the bomb fuse animation.
 */
export const BOMB_ANIMATION_SEQUENCE = [0, 1, 2, 1];

/**
 * Delay between each explosion frame.
 */
export const EPLOSION_FRAME_DELAY = 4 * FRAME_TIME;

/**
 * Sequence of frame indices for the explosion animation.
 */
export const EXPLOSION_ANIMATION_SEQUENCE = [3, 29, 30, 31, 30, 29, 28];

/**
 * Delay between each block frame during the explosion.
 */
export const BLOCK_FRAME_DELAY = 4 * FRAME_TIME;

/**
 * Sequence of frame indices for the flame animation.
 */
export const FLAME_ANIMATION_SEQUENCE = [0, 1, 2, 3, 2, 1, 0];

export const FlameDirectionLookup = [
  [0, -1], // Left
  [1, 0], // Down
  [0, 1], // Right
  [-1, 0], // Up
];
