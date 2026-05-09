import { Camera } from "./Camera";
import { Context2D } from "./types";

/**
 * Abstract base class for all canvas views. Holds the 2D context and
 * a {@link Camera} reference; subclasses implement update/render.
 */
export abstract class BaseRenderer<T = unknown> {
  public constructor(protected context: Context2D, protected camera: Camera) {}

  public abstract update(snapshot: T): void;
  public abstract render(): void;
}
