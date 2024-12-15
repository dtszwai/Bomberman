import { Camera } from "./Camera";
import { Context2D } from "./types";

/**
 * Abstract base class for all views.
 * Provides common rendering functionality.
 */
export abstract class BaseRenderer<T = unknown> {
  /**
   * Initializes a new instance of the `BaseView` class.
   * @param context - The 2D rendering context.
   * @param camera - The camera used for rendering.
   */
  public constructor(protected context: Context2D, protected camera: Camera) {}

  /**
   * Updates the view with the provided snapshot.
   * Must be implemented by derived classes.
   * @param snapshot - The snapshot to update the view with.
   */
  public abstract update(snapshot: T): void;

  /**
   * Updates and renders the view.
   * Must be implemented by derived classes.
   */
  public abstract render(): void;
}
