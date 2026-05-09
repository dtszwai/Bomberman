import { MapTile, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../sim/constants";
import { Tile } from "@arcade/realtime-core";
import { GameSnapshot, RoundStartPayload } from "../../sim/types";
import { BattleSceneRenderer } from "../views/BattleSceneRenderer";
import { BlockRenderData } from "../views/components/Block";
import { BombRenderData } from "../views/components/Bomb";
import { ExplosionRenderData } from "../views/components/Explosion";
import { PowerupsRenderData } from "../views/components/Powerups";
import { Camera } from "@arcade/canvas-renderer";
import { createCanvasContext, removeCanvas } from "@arcade/canvas-renderer";

export interface GameControllerConfig {
  width?: number;
  height?: number;
  container: HTMLElement;
}

/** Derived per-frame render state. Controllers synthesise this from their
 *  source of truth (local scene vs. wire snapshot + event log) and hand it
 *  to the base class to paint. */
export interface RenderInput {
  snapshot: GameSnapshot;
  destroyedCells: Tile[];
  blockDestructions: BlockRenderData[];
  bombs: BombRenderData[];
  explosions: ExplosionRenderData[];
  powerups: PowerupsRenderData;
}

const cellKey = (cell: Tile) => `${cell.row},${cell.column}`;

export abstract class BaseGameController {
  protected renderer: BattleSceneRenderer | null = null;
  protected camera: Camera;
  protected context: CanvasRenderingContext2D | null = null;
  protected container: HTMLElement;

  private tileMap: MapTile[][] = [];
  private initialBlockCells: Set<string> = new Set();

  constructor(config: GameControllerConfig) {
    const { width = SCREEN_WIDTH, height = SCREEN_HEIGHT, container } = config;
    this.container = container;
    this.camera = new Camera(0, 0);
    this.initialize(width, height);
  }

  private initialize(width: number, height: number) {
    const { context } = createCanvasContext(this.container, width, height);
    this.context = context;
    this.renderer = new BattleSceneRenderer(context, this.camera);
  }

  public abstract start(): void;
  public abstract stop(): void;

  /**
   * Install the round's static data (tilemap + initial blocks). Called once
   * per round on round-start event (online) or on scene construction (local).
   */
  public setRoundData(payload: RoundStartPayload) {
    this.tileMap = payload.tileMap.map((row) => [...row]);
    this.initialBlockCells = new Set(
      payload.initialBlocks.map((b) => cellKey(b.cell))
    );
  }

  private reconcileTileMap(destroyedCells: Tile[]) {
    for (const cell of destroyedCells) {
      if (!this.initialBlockCells.has(cellKey(cell))) continue;
      if (this.tileMap[cell.row]?.[cell.column] === MapTile.BLOCK) {
        this.tileMap[cell.row][cell.column] = MapTile.FLOOR;
      }
    }
  }

  protected update(input: RenderInput) {
    if (!this.renderer) return;

    this.reconcileTileMap(input.destroyedCells);

    this.renderer.update({
      hud: input.snapshot.hud,
      players: input.snapshot.players,
      bombs: input.bombs,
      blocks: input.blockDestructions,
      explosions: input.explosions,
      powerups: input.powerups,
      stage: this.tileMap,
    });
    this.renderer.render();
  }

  protected cleanup() {
    if (this.container) {
      removeCanvas(this.container);
      this.renderer = null;
      this.context = null;
    }
  }
}
