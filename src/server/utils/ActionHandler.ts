import { UserControls } from "../types";

export class ActionHandler {
  private heldKeys: string[];
  private pressedKeys: string[];
  /** Track which pressed keys we've already handled */
  private handledPressedKeys: Set<string>;

  constructor() {
    this.heldKeys = [];
    this.pressedKeys = [];
    this.handledPressedKeys = new Set();
  }

  public update(controls: UserControls) {
    // If a key is no longer in pressedKeys, remove it from handled keys
    this.handledPressedKeys.forEach((key) => {
      if (!controls.pressedKeys.includes(key)) {
        this.handledPressedKeys.delete(key);
      }
    });

    this.heldKeys = controls.heldKeys;
    this.pressedKeys = controls.pressedKeys;
  }

  public isUp = () => this.heldKeys.includes("ArrowUp");
  public isDown = () => this.heldKeys.includes("ArrowDown");
  public isLeft = () => this.heldKeys.includes("ArrowLeft");
  public isRight = () => this.heldKeys.includes("ArrowRight");

  public isAction = () => {
    if (
      this.pressedKeys.includes("Space") &&
      !this.handledPressedKeys.has("Space")
    ) {
      this.handledPressedKeys.add("Space");
      return true;
    }
    return false;
  };
}
