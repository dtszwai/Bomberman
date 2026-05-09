import type { KeyBindings } from "@arcade/realtime-core";
import { Control } from "../constants/controls";
import { controls } from "./controls";

/**
 * Bomberman's per-player key map flattened to {@link KeyBindings} — the
 * realtime-core vocabulary. Lets KeyTracker stay game-agnostic while
 * bomberman still owns its Control enum.
 */
export const KEY_BINDINGS: KeyBindings[] = controls.map((c) => ({
  left: c.keyboard[Control.LEFT],
  right: c.keyboard[Control.RIGHT],
  up: c.keyboard[Control.UP],
  down: c.keyboard[Control.DOWN],
  action: c.keyboard[Control.ACTION],
}));
