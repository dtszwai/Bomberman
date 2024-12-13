import { Camera } from "@/engine";
import { drawFrame } from "@/engine/context";
import { GameTime, Tile } from "@/engine/types";
import PowerupsUrl from "@assets/images/powerups.png";
import { FRAME_TIME, TILE_SIZE } from "../constants/game";
import { Bomberman } from "../entities/Bomberman";
import { rectanglesOverlap } from "@/engine/utils/collisions";
import { loadImage } from "../utils/utils";
import { PowerupType } from "../constants/levelData";

/**
 * Interface representing a power-up entity within the game.
 */
interface Powerup {
  cell: Tile;
  type: PowerupType;
}

const FRAME_DELAY = 8 * FRAME_TIME;

/**
 * PowerupSystem manages all power-ups within the game stage,
 * including their spawning, rendering, and player interactions.
 */
export class PowerupSystem {
  /** Image asset for power-ups */
  private static image = loadImage(PowerupsUrl);
  /** Current frame of the power-up animation */
  private animationFrameIndex = 0;
  /** Timer to control animation frame changes */
  private nextAnimationUpdate = 0;
  /** Array of active power-ups on the stage */
  powerups: Powerup[] = [];

  /**
   * Creates an instance of PowerupSystem.
   *
   * @param players - Array of players in the game.
   */
  constructor(private players: Bomberman[]) {}

  /**
   * Adds a new power-up to the system.
   *
   * @param cell - The tile where the power-up is located.
   * @param type - The type of the power-up.
   */
  public addPowerup = (cell: Tile, type: PowerupType) => {
    this.powerups.push({ cell, type });
  };

  /**
   * Removes a specified power-up from the system.
   *
   * @param powerup - The power-up to remove.
   */
  private removePowerup = (powerup: Powerup) => {
    const index = this.powerups.indexOf(powerup);
    if (index !== -1) {
      this.powerups.splice(index, 1);
    }
  };

  /**
   * Updates the animation state of power-ups.
   */
  private updateAnimation(time: GameTime) {
    if (time.previous > this.nextAnimationUpdate) {
      this.animationFrameIndex = 1 - this.animationFrameIndex;
      this.nextAnimationUpdate = time.previous + FRAME_DELAY;
    }
  }

  /**
   * Generates the collision rectangle for a given power-up.
   *
   * @param powerup - The power-up for which to generate the collision rectangle.
   * @returns An object representing the collision rectangle.
   */
  private getCollisionRect = (powerup: Powerup) => ({
    x: powerup.cell.column * TILE_SIZE,
    y: powerup.cell.row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  });

  /**
   * Checks for collisions between players and power-ups,
   * applies the power-up effect to the player, and removes the power-up.
   */
  private checkPlayerCollisions() {
    for (const player of this.players) {
      // Clone the array to prevent mutation issues
      for (const powerup of [...this.powerups]) {
        const playerRect = player.getCollisionRect();
        const powerupRect = this.getCollisionRect(powerup);
        if (rectanglesOverlap(playerRect, powerupRect)) {
          player.applyPowerup(powerup.type);
          this.removePowerup(powerup);
        }
      }
    }
  }

  /**
   * Updates the state of the PowerupSystem.
   */
  public update(time: GameTime) {
    this.updateAnimation(time);
    this.checkPlayerCollisions();
  }

  /**
   * Draws all active power-ups onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    for (const powerup of this.powerups) {
      const spriteX = 8 + this.animationFrameIndex * TILE_SIZE;
      const spriteY = 8 + (powerup.type - 1) * TILE_SIZE;

      drawFrame(
        context,
        PowerupSystem.image,
        [spriteX, spriteY, TILE_SIZE, TILE_SIZE],
        powerup.cell.column * TILE_SIZE - camera.position.x,
        powerup.cell.row * TILE_SIZE - camera.position.y
      );
    }
  }

  /**
   * Serializes the current state of the PowerupSystem.
   *
   * @returns The serialized power-up state.
   */
  serialize() {
    return {
      powerups: this.powerups.map((powerup) => ({
        cell: powerup.cell,
        type: powerup.type,
      })),
      animationFrameIndex: this.animationFrameIndex,
      nextAnimationUpdate: this.nextAnimationUpdate,
    };
  }
}
