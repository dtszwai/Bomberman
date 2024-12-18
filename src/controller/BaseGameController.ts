import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/game/constants";
import { GameSnapshot } from "@/game/types";
import { BattleSceneRenderer } from "@/views/BattleSceneRenderer";
import { Camera } from "@/views/Camera";
import { createCanvasContext, removeCanvas } from "@/views/utils";

export interface GameControllerConfig {
  width?: number;
  height?: number;
  container: HTMLElement;
}

export abstract class BaseGameController {
  protected renderer: BattleSceneRenderer | null = null;
  protected camera: Camera;
  protected context: CanvasRenderingContext2D | null = null;
  protected container: HTMLElement;

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

  protected update(snapshot: GameSnapshot) {
    if (!this.renderer) return;

    this.renderer.update({
      ...snapshot,
      blocks: snapshot.blocks
        .map((block) => block.entity)
        .filter((entity) => typeof entity !== "undefined"),
      stage: snapshot.stage.tileMap,
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
