import type { Position } from "@arcade/realtime-core";
import { Camera } from "../Camera";
import { Context2D, FrameDimensions } from "../types";

const translateCoordinate = (value: number, cameraValue: number): number =>
  Math.floor(value - cameraValue) + 0.5;

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

  context.moveTo(translatedX - 4, translatedY - 0.5);
  context.lineTo(translatedX + 5, translatedY - 0.5);

  context.moveTo(translatedX + 0.5, translatedY - 5);
  context.lineTo(translatedX + 0.5, translatedY + 4);

  context.stroke();
};

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
