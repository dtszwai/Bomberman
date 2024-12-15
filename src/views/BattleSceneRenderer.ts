import { Camera } from "./Camera";
import { Context2D } from "./types";
import { StageRenderData, StageRenderer } from "./components/Stage";
import { BattleHudRenderData, BattleHudView } from "./components/BattleHud";
import { BlockRenderData, BlockRenderer } from "./components/Block";
import { PowerupRenderer, PowerupsRenderData } from "./components/Powerups";
import { BombRenderer, BombRenderData } from "./components/Bomb";
import { BombermanRenderData, BombermanRenderer } from "./components/Bomberman";
import { ExplosionRenderer, ExplosionRenderData } from "./components/Explosion";
import { BaseRenderer } from "./BaseRenderer";
import { HALF_TILE_SIZE, STAGE_OFFSET_Y } from "@/game/constants";

export interface Snapshot {
  hud: BattleHudRenderData;
  players: BombermanRenderData[];
  blocks: BlockRenderData[];
  stage: StageRenderData;
  bombs: BombRenderData[];
  explosions: ExplosionRenderData[];
  powerups: PowerupsRenderData;
}

/**
 * Renderer class for the battle scene, orchestrating all component renderers.
 */
export class BattleSceneRenderer extends BaseRenderer<Snapshot> {
  private stageRenderer: StageRenderer;
  private hudRenderer: BattleHudView;
  private bombermanRenderer: BombermanRenderer;
  private blockRenderer: BlockRenderer;
  private bombRenderer: BombRenderer;
  private explosionRenderer: ExplosionRenderer;
  private powerupRenderer: PowerupRenderer;

  /**
   * Constructs a new BattleSceneRenderer.
   * @param context - The 2D rendering context.
   * @param camera - The camera instance for viewport calculations.
   */
  constructor(context: Context2D, camera: Camera) {
    super(context, camera);
    this.camera.position = { x: HALF_TILE_SIZE, y: -STAGE_OFFSET_Y };
    this.stageRenderer = new StageRenderer(context, camera);
    this.hudRenderer = new BattleHudView(context, camera);
    this.blockRenderer = new BlockRenderer(context, camera);
    this.bombRenderer = new BombRenderer(context, camera);
    this.explosionRenderer = new ExplosionRenderer(context, camera);
    this.powerupRenderer = new PowerupRenderer(context, camera);
    this.bombermanRenderer = new BombermanRenderer(context, camera);
  }

  /**
   * Updates all component renderers with the latest snapshot data.
   * @param snapshot - The latest snapshot of the battle scene.
   */
  public update(snapshot: Snapshot) {
    this.hudRenderer.update(snapshot.hud);
    this.stageRenderer.update(snapshot.stage);
    this.blockRenderer.update(snapshot.blocks);
    this.bombRenderer.update(snapshot.bombs);
    this.explosionRenderer.update(snapshot.explosions);
    this.powerupRenderer.update(snapshot.powerups);
    this.bombermanRenderer.update(snapshot.players);
  }

  /**
   * Renders the entire battle scene by delegating to component renderers.
   */
  public render() {
    this.stageRenderer.render();
    this.hudRenderer.render();
    this.powerupRenderer.render();
    this.blockRenderer.render();
    this.bombRenderer.render();
    this.explosionRenderer.render();
    this.bombermanRenderer.render();
  }
}
