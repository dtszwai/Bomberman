import * as control from "../engine/inputHandler";
import { GameTime } from "../engine/types";
import { Stage, Bomberman } from "../entities";
import { BlockSystem, BombSystem, PowerupSystem } from "../systems";
import { BombermanStateType, Control, GAME_TIME } from "../constants";
import type { GameSnapshot, GameState } from "../types";

/**
 * Class representing the battle scene in the game.
 * Manages game entities, systems, and handles game logic specific to the battle.
 */
export class BattleScene {
  /** The game stage containing the map and related data */
  private stage: Stage;
  /** System managing power-ups within the game */
  private powerupSystem: PowerupSystem;
  /** System managing destructible blocks */
  private blockSystem: BlockSystem;
  /** System managing bombs placed by players */
  private bombSystem: BombSystem;
  /** Array of players participating in the battle */
  private players: Bomberman[] = [];
  /** Remaining time in the game */
  private remainingTime: [number, number] = [...GAME_TIME];
  /** Accumulated time to track sub-second time */
  private accumulatedTime: number = 0;

  /**
   * Creates an instance of BattleScene.
   * @param state - The current state of the game, including player scores.
   * @param onEnd - Callback invoked when the battle ends, receiving the winner's ID.
   */
  constructor(
    private state: GameState,
    private onEnd: (winnerId: number) => void,
    private inputHandlers?: control.InputHandler[]
  ) {
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
  }

  private createLocalInputHandler(playerId: number) {
    return {
      isLeft: () => control.isLeft(playerId),
      isRight: () => control.isRight(playerId),
      isUp: () => control.isUp(playerId),
      isDown: () => control.isDown(playerId),
      isAction: () => control.isControlPressed(playerId, Control.ACTION),
    };
  }

  /**
   * Adds a new player to the battle.
   *
   * @param id - The unique identifier for the player.
   * @param time - The current game time.
   */
  private addPlayer(id: number) {
    const inputHandler = this.inputHandlers
      ? this.inputHandlers[id]
      : this.createLocalInputHandler(id);

    this.players.push(
      new Bomberman(
        id,
        this.stage.getCollisionTileAt,
        this.bombSystem.addBomb,
        this.removePlayer,
        inputHandler
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
    // Accumulate the time passed
    this.accumulatedTime += time.secondsPassed;

    // Only update the timer when we've accumulated a full second
    if (this.accumulatedTime >= 1) {
      const secondsToDecrease = Math.floor(this.accumulatedTime);
      this.accumulatedTime -= secondsToDecrease;

      const totalSeconds = this.remainingTime[0] * 60 + this.remainingTime[1];
      const newTotalSeconds = Math.max(0, totalSeconds - secondsToDecrease);

      this.remainingTime = [
        Math.floor(newTotalSeconds / 60),
        Math.floor(newTotalSeconds % 60),
      ];
    }

    this.blockSystem.update(time);
    this.bombSystem.update(time);
    this.powerupSystem.update(time);

    this.players.sort((a, b) => a.position.y - b.position.y);
    this.players.forEach((player) => player.update(time));
    this.checkEndGame();
  }

  /**
   * Serializes the current state of the battle scene.
   */
  public serialize(): GameSnapshot {
    return {
      stage: this.stage.serialize(),
      players: this.players.map((player) => player.serialize()),
      blocks: this.blockSystem.serialize().blocks,
      bombs: this.bombSystem.serialize().bombs,
      explosions: this.bombSystem.serialize().explosions,
      powerups: this.powerupSystem.serialize(),
      hud: { time: this.remainingTime, state: this.state },
    };
  }
}
