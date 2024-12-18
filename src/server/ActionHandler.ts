import { PlayerControls } from "./types";

export class ActionHandler {
  private heldKeys: string[];
  private pressedKeys: string[];
  private handledPressedKeys: Set<string>; // Track which pressed keys we've already handled

  constructor() {
    this.heldKeys = [];
    this.pressedKeys = [];
    this.handledPressedKeys = new Set();
  }

  public update(controls: PlayerControls) {
    // If a key is no longer in pressedKeys, remove it from handled keys
    this.handledPressedKeys.forEach((key) => {
      if (!controls.pressedKeys.includes(key)) {
        this.handledPressedKeys.delete(key);
      }
    });

    this.heldKeys = controls.heldKeys;
    this.pressedKeys = controls.pressedKeys;
  }

  public isLeft(): boolean {
    return this.heldKeys.includes("ArrowLeft");
  }

  public isRight(): boolean {
    return this.heldKeys.includes("ArrowRight");
  }

  public isUp(): boolean {
    return this.heldKeys.includes("ArrowUp");
  }

  public isDown(): boolean {
    return this.heldKeys.includes("ArrowDown");
  }

  // Modified to only return true once per press
  public isAction(): boolean {
    if (
      this.pressedKeys.includes("Space") &&
      !this.handledPressedKeys.has("Space")
    ) {
      this.handledPressedKeys.add("Space");
      return true;
    }
    return false;
  }
}
