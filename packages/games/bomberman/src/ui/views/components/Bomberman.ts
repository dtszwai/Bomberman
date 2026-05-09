import { BaseRenderer } from "@arcade/canvas-renderer";
import { loadImage, drawBox, drawCross, drawFrameOrigin } from "@arcade/canvas-renderer";
import BombermanUrl from "../../assets/images/bomberman.png";
import {
  BombermanPlayerData,
  BombermanStateType,
  DEBUG,
  Direction,
  FRAME_TIME,
  HALF_TILE_SIZE,
  TILE_SIZE,
  animations,
  getBombermanFrames,
} from "../../../sim/constants";
import type { Position } from "@arcade/canvas-renderer";

export interface BombermanRenderData {
  id: number;
  position: Position;
  direction: Direction;
  currentState: BombermanStateType;
  stateChangedAt: number;
}

const FRAME_STEP_MS = 8 * FRAME_TIME;

export class BombermanRenderer extends BaseRenderer {
  private static image = loadImage(BombermanUrl);
  private players: BombermanRenderData[] = [];

  public update(renderData: BombermanRenderData[]) {
    this.players = renderData;
  }

  public render() {
    this.players.forEach(this.renderPlayer);
  }

  private resolveFrameKey(player: BombermanRenderData) {
    const now = Date.now();
    const elapsed = Math.max(0, now - player.stateChangedAt);

    if (player.currentState === BombermanStateType.DEATH) {
      const anim = animations.deathAnimation;
      const step = Math.floor(elapsed / FRAME_STEP_MS);
      const idx = Math.min(step, anim.length - 1);
      return anim[idx][0];
    }

    const anim = animations.moveAnimations[player.direction];
    if (player.currentState === BombermanStateType.MOVING) {
      const idx = Math.floor(elapsed / FRAME_STEP_MS) % anim.length;
      return anim[idx][0];
    }
    return anim[0][0];
  }

  private renderPlayer = (player: BombermanRenderData) => {
    const frameKey = this.resolveFrameKey(player);
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
    const collisionBox = {
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
