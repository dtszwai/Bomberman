import { Control } from "@/game/constants/controls";
import { controls } from "@/game/config/controls";
const heldKeys = new Set();
const pressedKeys = new Set();

const mappedKeys = controls
  .map(({ keyboard }) => Object.values(keyboard))
  .flat();

function handleKeyDown(event: KeyboardEvent) {
  if (!mappedKeys.includes(event.code)) return;

  event.preventDefault();
  heldKeys.add(event.code);
}

function handleKeyUp(event: KeyboardEvent) {
  if (!mappedKeys.includes(event.code)) return;

  event.preventDefault();
  heldKeys.delete(event.code);
  pressedKeys.delete(event.code);
}

// Control event handlers

export function registerKeyEvents() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
}

export function unregisterKeyEvents() {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
}

// Control helpers

export const isKeyDown = (code: string) => heldKeys.has(code);

export function isKeyPressed(code: string) {
  if (heldKeys.has(code) && !pressedKeys.has(code)) {
    pressedKeys.add(code);
    return true;
  }

  return false;
}

export const isControlDown = (id: number, control: string) =>
  isKeyDown(controls[id].keyboard[control]);

export const isControlPressed = (id: number, control: string) =>
  isKeyPressed(controls[id].keyboard[control]);

export const isLeft = (id: number) => isControlDown(id, Control.LEFT);

export const isRight = (id: number) => isControlDown(id, Control.RIGHT);

export const isUp = (id: number) => isControlDown(id, Control.UP);

export const isDown = (id: number) => isControlDown(id, Control.DOWN);

export const isIdle = (id: number) =>
  !(isLeft(id) || isRight(id) || isUp(id) || isDown(id));
