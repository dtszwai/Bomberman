import { Camera } from "@/engine";
import { GameTime, Scene } from "@/engine/types";
import { Stage } from "@/game/entities/Stage";
import { HALF_TILE_SIZE, STAGE_OFFSET_Y } from "../constants/game";
import { BattleHud } from "../entities/BattleHud";
import { Bomberman } from "../entities/Bomberman";
import { BombSystem } from "../systems/BombSystem";
import { BlockSystem } from "../systems/BlockSystem";
import { PowerupSystem } from "../systems/PowerupSystem";
import { BombermanStateType } from "../constants/bomberman";
import type { GameState } from "../types";

/**
 * Class representing the battle scene in the game.
 * Manages game entities, systems, and handles game logic specific to the battle.
 */
export class BattleScene implements Scene {
  /** The game stage containing the map and related data */
  private stage: Stage;
  /** Heads-Up Display managing UI elements like scores and timers */
  private hud: BattleHud;
  /** System managing power-ups within the game */
  private powerupSystem: PowerupSystem;
  /** System managing destructible blocks */
  private blockSystem: BlockSystem;
  /** System managing bombs placed by players */
  private bombSystem: BombSystem;
  /** Array of players participating in the battle */
  private players: Bomberman[] = [];

  /**
   * Creates an instance of BattleScene.
   *
   * @param time - The current game time.
   * @param camera - The camera handling viewport transformations.
   * @param state - The current state of the game, including player scores.
   * @param onEnd - Callback invoked when the battle ends, receiving the winner's ID.
   */
  constructor(
    time: GameTime,
    camera: Camera,
    state: GameState,
    private onEnd: (winnerId: number) => void
  ) {
    this.hud = new BattleHud(time, state);
    this.stage = new Stage();
    this.powerupSystem = new PowerupSystem(this.players);
    this.blockSystem = new BlockSystem(
      this.stage.updateMapAt,
      this.stage.getCollisionTileAt,
      this.powerupSystem.addPowerup
    );
    this.bombSystem = new BombSystem(
      this.stage.collisionMap,
      this.blockSystem.addBlock
    );

    state.wins.forEach((_, id) => this.addPlayer(id));
    camera.position = { x: HALF_TILE_SIZE, y: -STAGE_OFFSET_Y };
  }

  /**
   * Adds a new player to the battle.
   *
   * @param id - The unique identifier for the player.
   * @param time - The current game time.
   */
  private addPlayer(id: number) {
    this.players.push(
      new Bomberman(
        id,
        this.stage.getCollisionTileAt,
        this.bombSystem.addBomb,
        this.removePlayer
      )
    );
  }

  /**
   * Removes a player from the battle based on their ID.
   *
   * @param id - The unique identifier of the player to remove.
   */
  private removePlayer = (id: number) => {
    const index = this.players.findIndex((player) => player.id === id);
    if (index >= 0) this.players.splice(index, 1);
  };

  /**
   * Checks whether the game has reached an end condition.
   * If only one player remains alive, the game ends and the winner is declared.
   */
  private checkEndGame() {
    if (this.players.length > 1) return;

    const isLastPlayerAlive =
      this.players.length === 1 &&
      this.players[0].currentState.type !== BombermanStateType.DEATH;

    this.onEnd(isLastPlayerAlive ? this.players[0].id : -1);
  }

  /**
   * Updates all game systems and players.
   */
  public update(time: GameTime) {
    this.hud.update(time);
    this.blockSystem.update(time);
    this.bombSystem.update(time);
    this.powerupSystem.update(time);

    this.players.sort((a, b) => a.position.y - b.position.y);
    this.players.forEach((player) => player.update(time));
    this.checkEndGame();
  }

  /**
   * Draws all game elements onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    this.stage.draw(context, camera);
    this.hud.draw(context);
    this.powerupSystem.draw(context, camera);
    this.blockSystem.draw(context, camera);
    this.bombSystem.draw(context, camera);
    this.players.forEach((player) => player.draw(context, camera));
  }
}
