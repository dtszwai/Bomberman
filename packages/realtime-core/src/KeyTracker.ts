import type { InputHandler, KeyBindings } from "./types";

export interface ControlState {
  heldKeys: string[];
  pressedKeys: string[];
}

/**
 * Tracks held/pressed keyboard state for N players and hands out
 * {@link InputHandler}s keyed by seat. Game-agnostic: takes per-player
 * {@link KeyBindings} so any game can plug its own action→key map.
 */
export class KeyTracker {
  private readonly mappedKeys: string[];
  private heldKeys = new Set<string>();
  private pressedKeys = new Set<string>();
  private usedKeys = new Set<string>();

  constructor(private readonly bindings: KeyBindings[]) {
    this.mappedKeys = bindings.flatMap((b) => [
      b.left,
      b.right,
      b.up,
      b.down,
      b.action,
    ]);
  }

  handleKeyDown(code: string): ControlState | null {
    if (!this.mappedKeys.includes(code)) return null;

    this.heldKeys.add(code);
    if (!this.usedKeys.has(code)) {
      this.pressedKeys.add(code);
      this.usedKeys.add(code);
    }

    return this.getState();
  }

  handleKeyUp(code: string): ControlState | null {
    if (!this.mappedKeys.includes(code)) return null;

    this.heldKeys.delete(code);
    this.pressedKeys.delete(code);
    this.usedKeys.delete(code);

    return this.getState();
  }

  reset(): void {
    this.heldKeys.clear();
    this.pressedKeys.clear();
    this.usedKeys.clear();
  }

  private getState(): ControlState {
    return {
      heldKeys: Array.from(this.heldKeys),
      pressedKeys: Array.from(this.pressedKeys),
    };
  }

  /**
   * Build an {@link InputHandler} for a local seat. The returned handler
   * reads this tracker's live state, so callers can hand it to the sim
   * without knowing anything about keyboards.
   *
   * `isAction` consumes the press (one-shot).
   */
  public createInputHandler(playerId: number): InputHandler {
    const keys = this.bindings[playerId];
    const handledPressed = new Set<string>();

    const isDown = (code: string) => this.heldKeys.has(code);
    const consumePress = (code: string) => {
      if (!this.pressedKeys.has(code)) {
        handledPressed.delete(code);
        return false;
      }
      if (handledPressed.has(code)) return false;
      handledPressed.add(code);
      return true;
    };

    return {
      isLeft: () => isDown(keys.left),
      isRight: () => isDown(keys.right),
      isUp: () => isDown(keys.up),
      isDown: () => isDown(keys.down),
      isAction: () => consumePress(keys.action),
    };
  }
}
