import type { UserControls } from "@arcade/protocol";
import type { KeyBindings } from "@arcade/realtime-core";

const DEFAULT_BINDINGS: KeyBindings = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  action: "Space",
};

export class ActionHandler {
  private heldKeys: string[];
  private pressedKeys: string[];
  /** Track which pressed keys we've already handled */
  private handledPressedKeys: Set<string>;
  /** Highest accepted packet seq; stale packets are dropped. */
  private lastSeq: number = -1;

  constructor(private readonly bindings: KeyBindings = DEFAULT_BINDINGS) {
    this.heldKeys = [];
    this.pressedKeys = [];
    this.handledPressedKeys = new Set();
  }

  public update(controls: UserControls) {
    if (controls.seq <= this.lastSeq) return;
    this.lastSeq = controls.seq;

    this.handledPressedKeys.forEach((key) => {
      if (!controls.pressedKeys.includes(key)) {
        this.handledPressedKeys.delete(key);
      }
    });

    this.heldKeys = controls.heldKeys;
    this.pressedKeys = controls.pressedKeys;
  }

  public isUp = () => this.heldKeys.includes(this.bindings.up);
  public isDown = () => this.heldKeys.includes(this.bindings.down);
  public isLeft = () => this.heldKeys.includes(this.bindings.left);
  public isRight = () => this.heldKeys.includes(this.bindings.right);

  public isAction = () => {
    const actionKey = this.bindings.action;
    if (
      this.pressedKeys.includes(actionKey) &&
      !this.handledPressedKeys.has(actionKey)
    ) {
      this.handledPressedKeys.add(actionKey);
      return true;
    }
    return false;
  };
}
