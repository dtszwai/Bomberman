import { GamepadThumbstick } from "@/engine/constants/control";
import { Control } from "@/game/constants/controls";
import { controls } from "@/game/config/controls";
const heldKeys = new Set();
const pressedKeys = new Set();

const gamePads = new Map();
const pressedButtons = new Set();

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

function handleGamepadConnected(event: GamepadEvent) {
  const {
    gamepad: { index, axes, buttons },
  } = event;

  gamePads.set(index, { axes, buttons });
}

function handleGamepadDisconnected(event: GamepadEvent) {
  const {
    gamepad: { index },
  } = event;

  gamePads.delete(index);
}

// Control event handlers

export function registerKeyEvents() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
}

export function registerGamepadEvents() {
  window.addEventListener("gamepadconnected", handleGamepadConnected);
  window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
}

export function unregisterKeyEvents() {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
}

export function unregisterGamepadEvents() {
  window.removeEventListener("gamepadconnected", handleGamepadConnected);
  window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
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

export const isButtonDown = (padId: number, button: number) =>
  gamePads.get(padId)?.buttons[button].pressed ?? false;

export function isButtonPressed(padId: number, button: number) {
  const key = `${padId}-${button}`;

  if (isButtonDown(padId, button) && !pressedButtons.has(key)) {
    pressedButtons.add(key);
    return true;
  }

  return false;
}

export const isAxeGreater = (padId: number, axe: number, value: number) =>
  gamePads.get(padId)?.axes[axe] >= value;

export const isAxeLower = (padId: number, axe: number, value: number) =>
  gamePads.get(padId)?.axes[axe] <= value;

export const isControlDown = (id: number, control: string) =>
  isKeyDown(controls[id].keyboard[control]) ||
  isButtonDown(id, controls[id].gamePad[control]);

export const isControlPressed = (id: number, control: string) =>
  isKeyPressed(controls[id].keyboard[control]) ||
  isButtonPressed(id, controls[id].gamePad[control]);

export const isLeft = (id: number) =>
  isControlDown(id, Control.LEFT) ||
  isAxeLower(
    id,
    controls[id].gamePad[GamepadThumbstick.HORIZONTAL_AXE_ID],
    -controls[id].gamePad[GamepadThumbstick.DEAD_ZONE]
  );

export const isRight = (id: number) =>
  isControlDown(id, Control.RIGHT) ||
  isAxeGreater(
    id,
    controls[id].gamePad[GamepadThumbstick.HORIZONTAL_AXE_ID],
    controls[id].gamePad[GamepadThumbstick.DEAD_ZONE]
  );

export const isUp = (id: number) =>
  isControlDown(id, Control.UP) ||
  isAxeLower(
    id,
    controls[id].gamePad[GamepadThumbstick.VERTICAL_AXE_ID],
    -controls[id].gamePad[GamepadThumbstick.DEAD_ZONE]
  );

export const isDown = (id: number) =>
  isControlDown(id, Control.DOWN) ||
  isAxeGreater(
    id,
    controls[id].gamePad[GamepadThumbstick.VERTICAL_AXE_ID],
    controls[id].gamePad[GamepadThumbstick.DEAD_ZONE]
  );

export const isIdle = (id: number) =>
  !(isLeft(id) || isRight(id) || isUp(id) || isDown(id));
