import {
  GameTime,
  InputHandler,
  Position,
  Rect,
  Tile,
  Velocity,
} from "@arcade/realtime-core";
import {
  FRAME_TIME,
  HALF_TILE_SIZE,
  TILE_SIZE,
  CollisionTile,
  PowerupType,
  animations,
  BombermanPlayerData,
  BombermanStateType,
  WALK_SPEED,
  Direction,
  MovementLookup,
  FUSE_TIMER,
} from "../constants";
import { collisionOffsets } from "../utils/collisions";

interface State {
  type: BombermanStateType;
  init: (time: GameTime) => void;
  update: (time: GameTime) => void;
}

export interface BombermanSnapshot {
  id: number;
  position: Position;
  currentState: BombermanStateType;
  velocity: Velocity;
  direction: Direction;
  bombAmount: number;
  bombStrength: number;
  availableBombs: number;
  speedMultiplier: number;
  shieldCount: number;
  bombFuseMs: number;
  stateChangedAt: number;
}

export class Bomberman {
  /** Current position of the Bomberman */
  public position: Position;
  /** The current state of the Bomberman */
  public currentState: State;

  /** Current velocity of the Bomberman */
  private velocity: Velocity = { x: 0, y: 0 };
  /** Current direction the Bomberman is facing */
  private direction: Direction = Direction.DOWN;
  /** Current animation frames based on direction */
  private animation = animations.moveAnimations[this.direction];
  /** All possible states of the Bomberman */
  private states: Record<BombermanStateType, State>;

  /** Base speed time for movement */
  private baseSpeedTime = WALK_SPEED;
  /** Multiplier to adjust Bomberman's speed */
  private speedMultiplier = 1.2;
  /** Maximum number of bombs Bomberman can place */
  private bombAmount = 1;
  /** Strength of the bombs Bomberman places */
  private bombStrength = 1;
  /** Number of bombs currently available for placement */
  private availableBombs = this.bombAmount;
  /** Fuse length for newly placed bombs. */
  private bombFuseMs = FUSE_TIMER;
  /** One shield charge prevents one fatal flame hit. */
  private shieldCount = 0;

  /** The last cell where a bomb was placed */
  private lastBombCell?: Tile;
  /** Current frame index in the animation */
  private animationFrameIndex = 0;
  /** Timestamp for scheduling the next frame update */
  private nextAnimationUpdate = 0;
  /** Wall-clock timestamp when currentState last changed (for client anim derivation) */
  private stateChangedAt = 0;

  /**
   * Creates an instance of Bomberman.
   *
   * @param id - Unique identifier for the Bomberman instance.
   * @param getStageCollisionTileAt - Callback to retrieve the collision tile at a given cell.
   * @param onBombPlaced - Callback invoked when a bomb is placed.
   * @param onBombermanDeath - Callback invoked when the Bomberman dies.
   */
  constructor(
    public id: number,
    private getStageCollisionTileAt: (cell: Tile) => CollisionTile,
    private onBombPlaced: (
      ownerId: number,
      cell: Tile,
      strength: number,
      fuseMs: number,
      time: GameTime,
      onExploded: () => void
    ) => void,
    private onBombermanDeath: (id: number, at: number) => void,
    private inputHandler: InputHandler
  ) {
    const { row, column } = BombermanPlayerData[id];
    this.position = {
      x: row * TILE_SIZE + HALF_TILE_SIZE,
      y: column * TILE_SIZE + HALF_TILE_SIZE,
    };
    this.states = this.initializeStates();
    this.currentState = this.states[BombermanStateType.IDLE];
  }

  private initializeStates = () => ({
    [BombermanStateType.IDLE]: {
      type: BombermanStateType.IDLE,
      init: this.handleIdleInit,
      update: this.handleIdleState,
    },
    [BombermanStateType.MOVING]: {
      type: BombermanStateType.MOVING,
      init: this.handleMovingInit,
      update: this.handleMovingState,
    },
    [BombermanStateType.DEATH]: {
      type: BombermanStateType.DEATH,
      init: this.handleDeathInit,
      update: this.handleDeathState,
    },
  });

  private getCurrentCell = (): Tile => ({
    row: Math.floor(this.position.y / TILE_SIZE),
    column: Math.floor(this.position.x / TILE_SIZE),
  });

  private resetVelocity = () => Object.assign(this.velocity, { x: 0, y: 0 });

  private changeState = (newState: BombermanStateType, time: GameTime) => {
    this.currentState = this.states[newState];
    this.animationFrameIndex = 0;
    this.stateChangedAt = time.previous;
    this.currentState.init(time);
    this.nextAnimationUpdate =
      time.previous + this.animation[this.animationFrameIndex][1] * FRAME_TIME;
  };

  // --------------------- State Initialization Methods ---------------------

  private handleIdleInit = () => this.resetVelocity();

  private handleMovingInit = () => (this.animationFrameIndex = 1);

  private handleDeathInit = () => {
    this.resetVelocity();
    this.animation = animations.deathAnimation;
  };

  // --------------------- General State Handling ---------------------

  private handleGeneralState = (time: GameTime) => {
    const { direction, velocity } = this.getMovement(time);
    if (this.inputHandler.isAction()) {
      this.handleBombPlacement(time);
    }
    this.animation = animations.moveAnimations[direction];
    this.direction = direction;
    return velocity;
  };

  private handleIdleState = (time: GameTime) => {
    const velocity = this.handleGeneralState(time);
    if (!this.isZero(velocity)) {
      this.changeState(BombermanStateType.MOVING, time);
    }
  };

  private handleMovingState = (time: GameTime) => {
    this.velocity = this.handleGeneralState(time);
    if (this.isZero(this.velocity))
      this.changeState(BombermanStateType.IDLE, time);
  };

  private handleDeathState = (time: GameTime) => {
    if (this.animation[this.animationFrameIndex][1] === -1) {
      this.onBombermanDeath(this.id, time.previous);
    }
  };

  // --------------------- Bomb Handling ---------------------

  /**
   * Callback invoked when a bomb explodes to replenish available bombs.
   */
  private handleBombExploded = () => {
    if (this.availableBombs < this.bombAmount) {
      this.availableBombs += 1;
    }
  };

  /**
   * Places a bomb at the current position if possible.
   */
  private handleBombPlacement = (time: GameTime) => {
    if (this.availableBombs <= 0) return;

    const playerCell = this.getCurrentCell();

    if (this.getStageCollisionTileAt(playerCell) !== CollisionTile.EMPTY)
      return;

    this.availableBombs -= 1;
    this.lastBombCell = playerCell;
    this.onBombPlaced(
      this.id,
      playerCell,
      this.bombStrength,
      this.bombFuseMs,
      time,
      this.handleBombExploded
    );
  };

  // --------------------- Movement Handling ---------------------

  /**
   * Determines the movement direction and velocity based on player input.
   *
   * Facing follows the requested input direction. Actual velocity may differ
   * temporarily when the resolver applies corner correction to align the
   * player with a lane.
   */
  private getMovement(time: GameTime): {
    direction: Direction;
    velocity: Velocity;
  } {
    if (this.inputHandler.isLeft()) {
      return this.resolveMovement(Direction.LEFT, time);
    } else if (this.inputHandler.isRight()) {
      return this.resolveMovement(Direction.RIGHT, time);
    } else if (this.inputHandler.isUp()) {
      return this.resolveMovement(Direction.UP, time);
    } else if (this.inputHandler.isDown()) {
      return this.resolveMovement(Direction.DOWN, time);
    } else return { direction: this.direction, velocity: { x: 0, y: 0 } };
  }

  /**
   * Resolves actual movement for the requested direction. When the player is
   * slightly off-axis, the collision solver may apply a perpendicular velocity
   * to realign with the lane, but the requested direction remains the facing.
   *
   * @param direction - The desired movement direction.
   * @returns Facing direction plus the resolved velocity for this tick.
   */
  private resolveMovement(direction: Direction, time: GameTime): {
    direction: Direction;
    velocity: Velocity;
  } {
    const collisionTiles = this.getCollisionTiles(direction);

    if (this.shouldBlockMovement(collisionTiles)) {
      return { direction, velocity: { x: 0, y: 0 } };
    }

    if (
      collisionTiles.some(
        (tile) => this.getCollisionTile(tile) >= CollisionTile.WALL
      )
    ) {
      if (this.getCollisionTile(this.getForwardTile(direction)) >= CollisionTile.WALL) {
        return { direction, velocity: { x: 0, y: 0 } };
      }

      return {
        direction,
        velocity: this.getLaneCorrectionVelocity(direction, time),
      };
    }

    return { direction, velocity: { ...MovementLookup[direction] } };
  }

  /**
   * Moves the player toward the center of the current lane without overshooting.
   * This prevents left/right oscillation when vertical movement needs a small
   * horizontal correction, and vice versa.
   */
  private getLaneCorrectionVelocity(
    direction: Direction,
    time: GameTime
  ): Velocity {
    const speedPerTick =
      this.baseSpeedTime * this.speedMultiplier * time.secondsPassed;

    if (speedPerTick <= 0) {
      return { x: 0, y: 0 };
    }

    if (direction === Direction.UP || direction === Direction.DOWN) {
      const laneCenterX = this.getCurrentCell().column * TILE_SIZE + HALF_TILE_SIZE;
      const deltaX = laneCenterX - this.position.x;

      return {
        x: this.clampAxisVelocity(deltaX / speedPerTick),
        y: 0,
      };
    }

    const laneCenterY = this.getCurrentCell().row * TILE_SIZE + HALF_TILE_SIZE;
    const deltaY = laneCenterY - this.position.y;

    return {
      x: 0,
      y: this.clampAxisVelocity(deltaY / speedPerTick),
    };
  }

  private clampAxisVelocity(value: number) {
    if (value > 1) return 1;
    if (value < -1) return -1;
    return value;
  }

  private getForwardTile(direction: Direction): Tile {
    const currentCell = this.getCurrentCell();
    const movement = MovementLookup[direction];

    return {
      row: currentCell.row + movement.y,
      column: currentCell.column + movement.x,
    };
  }

  /**
   * Retrieves the collision tile type for a given tile, considering the last bomb placement.
   * If the tile is the same as the last bomb cell, it is considered empty to allow movement.
   *
   * @param tile - The tile to check.
   * @returns The collision tile type.
   */
  private getCollisionTile({ row, column }: Tile): CollisionTile {
    if (row === this.lastBombCell?.row && column === this.lastBombCell.column) {
      return CollisionTile.EMPTY;
    }
    return this.getStageCollisionTileAt({ row, column });
  }

  /**
   * Retrieves the collision tiles based on the current direction.
   *
   * @param direction - The direction to check for collisions.
   * @returns An array of tiles that Bomberman might collide with.
   */
  private getCollisionTiles = (direction: Direction): Tile[] =>
    collisionOffsets[direction].map(({ dx, dy }) => ({
      row: Math.floor((this.position.y + dy) / TILE_SIZE),
      column: Math.floor((this.position.x + dx) / TILE_SIZE),
    }));

  /**
   * Determines whether movement should be blocked based on collision tiles.
   *
   * @param tiles - The tiles to check for potential collisions.
   * @returns `true` if movement should be blocked; otherwise, `false`.
   */
  private shouldBlockMovement(tiles: Tile[]) {
    const collisionTiles = tiles.map((tile) => this.getCollisionTile(tile));
    const [tile1, tile2] = collisionTiles;
    return tile1 >= CollisionTile.WALL && tile2 >= CollisionTile.WALL;
  }

  // --------------------- Position and Animation Updates ---------------------

  /**
   * Updates Bomberman's position based on the current velocity and elapsed time.
   */
  private updatePosition(time: GameTime): void {
    const deltaTime =
      this.baseSpeedTime * this.speedMultiplier * time.secondsPassed;
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  /**
   * Updates the animation frame based on the elapsed time.
   */
  private updateAnimation(time: GameTime) {
    const { previous } = time;
    if (
      previous < this.nextAnimationUpdate ||
      this.currentState.type === BombermanStateType.IDLE
    )
      return;

    this.animationFrameIndex =
      (this.animationFrameIndex + 1) % this.animation.length;
    const frameDuration = this.animation[this.animationFrameIndex][1];
    this.nextAnimationUpdate = previous + frameDuration * FRAME_TIME;
  }

  // --------------------- Collision and State Updates ---------------------

  /**
   * Resets the last bomb cell if the bomb has exploded or the player has moved away.
   *
   * @param currentCell - The current tile cell of the Bomberman.
   */
  private resetLastBombCell({ row, column }: Tile): void {
    if (!this.lastBombCell) return;

    const isSameCell =
      row === this.lastBombCell.row && column === this.lastBombCell.column;

    const isBombStillPresent =
      this.getCollisionTile(this.lastBombCell) === CollisionTile.BOMB;

    if (!isSameCell && !isBombStillPresent) {
      this.lastBombCell = undefined;
    }
  }

  /**
   * Checks if the Bomberman has collided with a flame tile and handles death state.
   */
  private checkFlameTileCollision(tile: Tile, time: GameTime) {
    if (
      this.getStageCollisionTileAt(tile) === CollisionTile.FLAME &&
      this.currentState.type !== BombermanStateType.DEATH
    ) {
      if (this.shieldCount > 0) {
        this.shieldCount -= 1;
        return;
      }
      this.changeState(BombermanStateType.DEATH, time);
    }
  }

  /**
   * Updates the cell underneath the Bomberman, handling bomb cell reset and flame collisions.
   */
  private updateCellUnderneath(time: GameTime) {
    const playerCell = this.getCurrentCell();
    this.resetLastBombCell(playerCell);
    this.checkFlameTileCollision(playerCell, time);
  }

  // --------------------- Power-Up Handling ---------------------
  /**
   * Applies a power-up effect to the Bomberman based on the type of power-up collected.
   *
   * @param type - The type of power-up to apply.
   */
  public applyPowerup(type: PowerupType) {
    switch (type) {
      case PowerupType.Flame:
        this.bombStrength += 1;
        break;
      case PowerupType.Bomb:
        this.bombAmount += 1;
        this.availableBombs += 1;
        break;
      case PowerupType.Speed:
        this.speedMultiplier += 0.4;
        break;
      case PowerupType.Shield:
        this.shieldCount += 1;
        break;
      case PowerupType.Fuse:
        this.bombFuseMs = Math.max(1200, this.bombFuseMs - 350);
        break;
      default:
        break;
    }
  }

  // --------------------- Main Update Method ---------------------

  /**
   * Updates the Bomberman's state, position, animation, and collision each game tick.
   */
  public update(time: GameTime) {
    this.updatePosition(time);
    this.currentState.update(time);
    this.updateAnimation(time);
    this.updateCellUnderneath(time);
  }

  // --------------------- Utility Methods ---------------------

  /**
   * Retrieves the collision rectangle for the Bomberman, used for collision detection.
   *
   * @returns The collision rectangle.
   */
  public getCollisionRect = (): Rect => ({
    x: this.position.x - HALF_TILE_SIZE / 2,
    y: this.position.y - HALF_TILE_SIZE / 2,
    width: HALF_TILE_SIZE,
    height: HALF_TILE_SIZE,
  });

  /**
   * Serializes the current state of the Bomberman.
   *
   * @returns The serialized Bomberman state.
   */
  public serialize = (): BombermanSnapshot => ({
    id: this.id,
    position: this.position,
    currentState: this.currentState.type,
    velocity: this.velocity,
    direction: this.direction,
    bombAmount: this.bombAmount,
    bombStrength: this.bombStrength,
    availableBombs: this.availableBombs,
    speedMultiplier: this.speedMultiplier,
    shieldCount: this.shieldCount,
    bombFuseMs: this.bombFuseMs,
    stateChangedAt: this.stateChangedAt,
  });

  private isZero = (point: Velocity) => point.x === 0 && point.y === 0;
}
