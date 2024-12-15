import { Context2D, FrameDimensions, Position } from "../types";
import { Camera } from "../Camera";

/**
 * Helper function to translate and floor coordinates based on camera position.
 */
const translateCoordinate = (value: number, cameraValue: number): number =>
  Math.floor(value - cameraValue) + 0.5;

/**
 * Draws a cross at the specified position on the canvas.
 *
 * @param context - The rendering context of the canvas.
 * @param camera - The camera object to translate world coordinates to screen coordinates.
 * @param position - The position where the cross should be drawn.
 * @param color - The color of the cross. Defaults to white.
 */
export const drawCross = (
  context: Context2D,
  camera: Camera,
  position: Position,
  color: string = "#FFF"
) => {
  const translatedX = translateCoordinate(position.x, camera.position.x) - 0.5;
  const translatedY = translateCoordinate(position.y, camera.position.y) - 0.5;

  context.beginPath();
  context.strokeStyle = color;

  // Horizontal line of the cross
  context.moveTo(translatedX - 4, translatedY - 0.5);
  context.lineTo(translatedX + 5, translatedY - 0.5);

  // Vertical line of the cross
  context.moveTo(translatedX + 0.5, translatedY - 5);
  context.lineTo(translatedX + 0.5, translatedY + 4);

  context.stroke();
};

/**
 * Draws a rectangular box on the canvas.
 *
 * @param context - The rendering context of the canvas.
 * @param camera - The camera object to translate world coordinates to screen coordinates.
 * @param dimensions - The dimensions of the box [x, y, width, height].
 * @param color - The color of the box. Defaults to white.
 */
export const drawBox = (
  context: Context2D,
  camera: Camera,
  dimensions: FrameDimensions,
  color: string = "#FFF"
) => {
  if (!Array.isArray(dimensions)) return;

  const [x = 0, y = 0, width = 0, height = 0] = dimensions;

  const translatedX = translateCoordinate(x, camera.position.x);
  const translatedY = translateCoordinate(y, camera.position.y);

  const BOX_OPACITY_FILL = "44";
  const BOX_OPACITY_STROKE = "AA";

  context.beginPath();
  context.strokeStyle = `${color}${BOX_OPACITY_STROKE}`;
  context.fillStyle = `${color}${BOX_OPACITY_FILL}`;

  context.fillRect(translatedX, translatedY, width, height);
  context.rect(translatedX, translatedY, width, height);
  context.stroke();
};
