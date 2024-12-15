import { Position } from "./types";

export class Camera {
  position: Position;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }
}
