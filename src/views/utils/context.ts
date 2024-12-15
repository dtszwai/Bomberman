import { Context2D, FrameData, FrameDimensions } from "@/engine/types";

export function createCanvasContext(
  container: HTMLElement,
  width = 256,
  height = 256
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  Object.assign(canvas.style, {
    imageRendering: "pixelated",
    width: "100%",
    objectFit: "contain",
  });

  container.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to find canvas context");
  }

  return {
    canvas,
    context,
  };
}

export function removeCanvas(container: HTMLElement) {
  const canvas = container.querySelector("canvas");
  if (canvas) {
    container.removeChild(canvas);
  }
}

/**
 * Draw a section of an image
 */
export function drawFrame(
  context: Context2D,
  image: HTMLImageElement,
  dimensions: FrameDimensions,
  x: number,
  y: number,
  scale: [number, number] = [1, 1]
) {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = dimensions;

  context.scale(scale[0], scale[1]);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x * scale[0],
    y * scale[1],
    sourceWidth,
    sourceHeight
  );
  context.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Draw a section of an image using an origin point
 * @param context destination context
 * @param image source image data
 * @param frame the frame data array (includes both dimensions and origin point)
 * @param x x coord destination position
 * @param y y coord destination potition
 * @param scale used for horizontal/vertical flipping (defaults to 1, 1)
 */
export function drawFrameOrigin(
  context: Context2D,
  image: HTMLImageElement,
  frame: FrameData,
  x: number,
  y: number,
  scale: [number, number] = [1, 1]
) {
  const [dimensions, [originX, originY]] = frame;
  drawFrame(
    context,
    image,
    dimensions,
    x - originX * scale[0],
    y - originY * scale[1],
    scale
  );
}

/**
 * Draw a section of an image based on a tiled grid layout.
 */
export function drawTile(
  context: Context2D,
  image: HTMLImageElement,
  tile: number,
  x: number,
  y: number,
  tileSize = 16
) {
  const tilesPerRow = Math.floor(image.width / tileSize);

  context.drawImage(
    image,
    (tile % tilesPerRow) * tileSize,
    Math.floor(tile / tilesPerRow) * tileSize,
    tileSize,
    tileSize,
    x,
    y,
    tileSize,
    tileSize
  );
}
