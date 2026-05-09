import { GameTime, Tile } from "@arcade/realtime-core";
import { Bomberman } from "../entities/Bomberman";
import { TILE_SIZE, PowerupType } from "../constants";
import { rectanglesOverlap } from "../utils/collisions";
import type { EmitGameEvent, PowerupSnapshot } from "../types";

interface Powerup {
  id: number;
  cell: Tile;
  type: PowerupType;
}

export interface PowerupsSnapshot {
  powerups: Powerup[];
}

export class PowerupSystem {
  powerups: Powerup[] = [];
  private nextId = 0;

  constructor(
    private players: Bomberman[],
    private emit: EmitGameEvent
  ) {}

  public addPowerup = (cell: Tile, type: PowerupType) => {
    const id = this.nextId++;
    this.powerups.push({ id, cell, type });
    this.emit({ kind: "powerup:spawned", id, cell, type });
  };

  private removePowerup = (powerup: Powerup, playerId: number) => {
    const index = this.powerups.indexOf(powerup);
    if (index !== -1) {
      this.powerups.splice(index, 1);
      this.emit({
        kind: "powerup:collected",
        id: powerup.id,
        playerId,
      });
    }
  };

  private getCollisionRect = (powerup: Powerup) => ({
    x: powerup.cell.column * TILE_SIZE,
    y: powerup.cell.row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  });

  private checkPlayerCollisions() {
    for (const player of this.players) {
      for (const powerup of [...this.powerups]) {
        const playerRect = player.getCollisionRect();
        const powerupRect = this.getCollisionRect(powerup);
        if (rectanglesOverlap(playerRect, powerupRect)) {
          player.applyPowerup(powerup.type);
          this.removePowerup(powerup, player.id);
        }
      }
    }
  }

  public update(_time: GameTime) {
    this.checkPlayerCollisions();
  }

  public getLivePowerups(): PowerupSnapshot[] {
    return this.powerups.map((p) => ({ id: p.id, cell: p.cell, type: p.type }));
  }

  public serialize(): PowerupsSnapshot {
    return { powerups: [...this.powerups] };
  }
}
