import { Camera } from "@/engine";
import * as control from "@/engine/inputHandler";
import {
  FrameData,
  GameTime,
  Position,
  Rect,
  Tile,
  Velocity,
} from "@/engine/types";
import BombermanUrl from "@assets/images/bomberman.png";
import {
  CounterDirectionsLookup,
  Direction,
  MovementLookup,
} from "../constants/entities";
import {
  animations,
  BombermanPlayerData,
  BombermanStateType,
  getBombermanFrames,
  WALK_SPEED,
} from "../constants/bomberman";
import {
  DEBUG,
  FRAME_TIME,
  HALF_TILE_SIZE,
  TILE_SIZE,
} from "../constants/game";
import { drawFrameOrigin } from "@/engine/context";
import { isZero, loadImage } from "../utils/utils";
import { CollisionTile, PowerupType } from "../constants/levelData";
import { drawBox, drawCross } from "../utils/debug";
import { Control } from "../constants/controls";
import { collisionOffsets } from "@/engine/utils/collisions";

interface State {
  type: BombermanStateType;
  init: (time: GameTime) => void;
  update: (time: GameTime) => void;
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
  /** Image asset for the Bomberman */
  private image = loadImage(BombermanUrl);
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

  /** The last cell where a bomb was placed */
  private lastBombCell?: Tile;
  /** Frames data for animations */
  private frames: Map<string, FrameData>;
  /** Current frame index in the animation */
  private animationFrameIndex = 0;
  /** Timestamp for scheduling the next frame update */
  private nextAnimationUpdate = 0;

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
      cell: Tile,
      strength: number,
      time: GameTime,
      onExploded: () => void
    ) => void,
    private onBombermanDeath: (id: number) => void
  ) {
    const { row, column, color } = BombermanPlayerData[id];
    this.position = {
      x: row * TILE_SIZE + HALF_TILE_SIZE,
      y: column * TILE_SIZE + HALF_TILE_SIZE,
    };
    this.frames = getBombermanFrames(color);
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
    const [direction, velocity] = this.getMovement();
    if (control.isControlPressed(this.id, Control.ACTION)) {
      this.handleBombPlacement(time);
    }
    this.animation = animations.moveAnimations[direction];
    this.direction = direction;
    return velocity;
  };

  private handleIdleState = (time: GameTime) => {
    const velocity = this.handleGeneralState(time);
    if (!isZero(velocity)) this.changeState(BombermanStateType.MOVING, time);
  };

  private handleMovingState = (time: GameTime) => {
    this.velocity = this.handleGeneralState(time);
    if (isZero(this.velocity)) this.changeState(BombermanStateType.IDLE, time);
  };

  private handleDeathState = () => {
    if (this.animation[this.animationFrameIndex][1] === -1) {
      this.onBombermanDeath(this.id);
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
      playerCell,
      this.bombStrength,
      time,
      this.handleBombExploded
    );
  };

  // --------------------- Movement Handling ---------------------

  /**
   * Determines the movement direction and velocity based on player input.
   *
   * @returns A tuple containing the direction and corresponding velocity.
   */
  private getMovement(): [Direction, Velocity] {
    if (control.isLeft(this.id)) {
      return this.checkMovement(Direction.LEFT);
    } else if (control.isRight(this.id)) {
      return this.checkMovement(Direction.RIGHT);
    } else if (control.isUp(this.id)) {
      return this.checkMovement(Direction.UP);
    } else if (control.isDown(this.id)) {
      return this.checkMovement(Direction.DOWN);
    } else return [this.direction, { x: 0, y: 0 }];
  }

  /**
   * Checks if movement in the specified direction is possible and returns the appropriate direction and velocity.
   *
   * @param direction - The desired movement direction.
   * @returns A tuple containing the adjusted direction and corresponding velocity.
   */
  private checkMovement(direction: Direction): [Direction, Velocity] {
    const collisionTiles = this.getCollisionTiles(direction);

    if (this.shouldBlockMovement(collisionTiles)) {
      return [this.direction, { x: 0, y: 0 }];
    }

    const counterDirections = CounterDirectionsLookup[direction];
    for (let i = 0; i < collisionTiles.length; i++) {
      const tile = collisionTiles[i];
      if (this.getCollisionTile(tile) >= CollisionTile.WALL) {
        return [
          counterDirections[i],
          { ...MovementLookup[counterDirections[i]] },
        ];
      }
    }

    return [direction, { ...MovementLookup[direction] }];
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

  // --------------------- Rendering ---------------------

  /**
   * Draws the Bomberman on the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    const [frameKey] = this.animation[this.animationFrameIndex];
    const frame = this.frames.get(frameKey)!;

    drawFrameOrigin(
      context,
      this.image,
      frame,
      Math.floor(this.position.x - camera.position.x),
      Math.floor(this.position.y - camera.position.y),
      [this.direction === Direction.LEFT ? 1 : -1, 1]
    );

    if (!DEBUG) return;

    const collisionBox = this.getCollisionRect();

    // Draw the full tile collision box
    drawBox(
      context,
      camera,
      [
        this.position.x - HALF_TILE_SIZE,
        this.position.y - HALF_TILE_SIZE,
        TILE_SIZE - 1,
        TILE_SIZE - 1,
      ],
      "#FFFF00"
    );

    // Draw the collision rectangle
    drawBox(
      context,
      camera,
      [collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height],
      "#FF0000"
    );

    // Draw a cross at Bomberman's position for debugging
    drawCross(context, camera, this.position, "#FFF");
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
  public serialize = () => ({
    id: this.id,
    position: this.position,
    currentState: this.currentState.type,
    velocity: this.velocity,
    direction: this.direction,
    bombAmount: this.bombAmount,
    bombStrength: this.bombStrength,
    availableBombs: this.availableBombs,
    anmiationFrameIndex: this.animationFrameIndex,
    nextAnimationUpdate: this.nextAnimationUpdate,
    speedMultiplier: this.speedMultiplier,
  });
}
