import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawBox, drawCross, drawFrameOrigin } from "../utils";
import BombermanUrl from "@assets/images/bomberman.png";
import {
  AnimationFrame,
  BombermanPlayerData,
  DEBUG,
  Direction,
  getBombermanFrames,
  HALF_TILE_SIZE,
  TILE_SIZE,
} from "@/game/constants";
import type { Position, Rect } from "@/engine/types";

export interface BombermanRenderData {
  id: number;
  position: Position;
  direction: Direction;
  animation: AnimationFrame[];
  animationFrameIndex: number;
}

export class BombermanRenderer extends BaseRenderer {
  private static image = loadImage(BombermanUrl);
  private players: BombermanRenderData[] = [];

  public update(renderData: BombermanRenderData[]) {
    this.players = renderData;
  }

  public render() {
    this.players.forEach(this.renderPlayer);
  }

  private renderPlayer = (player: BombermanRenderData) => {
    const frameKey = player.animation[player.animationFrameIndex][0];
    const playerData = BombermanPlayerData[player.id];
    const frames = getBombermanFrames(playerData.color);
    const frame = frames.get(frameKey)!;

    drawFrameOrigin(
      this.context,
      BombermanRenderer.image,
      frame,
      Math.floor(player.position.x - this.camera.position.x),
      Math.floor(player.position.y - this.camera.position.y),
      [player.direction === Direction.LEFT ? 1 : -1, 1]
    );

    if (DEBUG) {
      this.renderDebug(player);
    }
  };

  private renderDebug = (player: BombermanRenderData) => {
    const collisionBox: Rect = {
      x: player.position.x - HALF_TILE_SIZE / 2,
      y: player.position.y - HALF_TILE_SIZE / 2,
      width: HALF_TILE_SIZE,
      height: HALF_TILE_SIZE,
    };

    // Draw the full tile collision box
    drawBox(
      this.context,
      this.camera,
      [
        player.position.x - HALF_TILE_SIZE,
        player.position.y - HALF_TILE_SIZE,
        TILE_SIZE - 1,
        TILE_SIZE - 1,
      ],
      "#FFFF00"
    );

    // Draw the collision rectangle
    drawBox(
      this.context,
      this.camera,
      [collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height],
      "#FF0000"
    );

    // Draw a cross at Bomberman's position for debugging
    drawCross(this.context, this.camera, player.position, "#FFF");
  };
}
