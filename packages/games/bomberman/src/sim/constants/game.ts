export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

/**
 * Server simulation tick rate. 30 Hz is enough for grid-based movement —
 * the client interpolates between snapshots for visual smoothness.
 */
export const SERVER_TICK_HZ = 30;
export const SERVER_TICK_MS = 1000 / SERVER_TICK_HZ;

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 232;

export const TILE_SIZE = 16;
export const HALF_TILE_SIZE = TILE_SIZE / 2;

export const STAGE_OFFSET_Y = 24;

export const NUM_PLAYERS = 2;
export const MAX_WINS = 2;

export const DEBUG = false;
