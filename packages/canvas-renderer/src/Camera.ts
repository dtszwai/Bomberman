import type { Position } from "@arcade/realtime-core";

export class Camera {
  position: Position;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }
}
