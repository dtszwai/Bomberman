import { controls } from "../game/config/controls";

export interface ControlState {
  heldKeys: string[];
  pressedKeys: string[];
}

export class KeyTracker {
  private readonly mappedKeys: string[];
  private heldKeys = new Set<string>();
  private pressedKeys = new Set<string>();
  private usedKeys = new Set<string>();

  constructor() {
    this.mappedKeys = controls
      .map(({ keyboard }) => Object.values(keyboard))
      .flat();
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
}
