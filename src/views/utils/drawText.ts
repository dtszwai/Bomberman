import { loadImage } from "../utils/image";
import FontUrl from "@assets/images/font.png";
import { drawFrame } from "../utils";
import { Context2D, FrameDimensions } from "../types";

type FrameKey = `alpha-${
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | ":"
  | "@"
  | "-"
  | "!"
  | "/"}`;

const frames: Readonly<Record<FrameKey, FrameDimensions>> = {
  "alpha-0": [16, 8, 8, 8],
  "alpha-1": [24, 8, 8, 8],
  "alpha-2": [32, 8, 8, 8],
  "alpha-3": [40, 8, 8, 8],
  "alpha-4": [48, 8, 8, 8],
  "alpha-5": [56, 8, 8, 8],
  "alpha-6": [64, 8, 8, 8],
  "alpha-7": [72, 8, 8, 8],
  "alpha-8": [80, 8, 8, 8],
  "alpha-9": [88, 8, 8, 8],
  "alpha-:": [96, 8, 8, 8],
  "alpha-@": [8, 32, 8, 8],
  "alpha--": [16, 32, 8, 8],
  "alpha-!": [24, 32, 8, 8],
  "alpha-/": [32, 32, 8, 8],
};

const fontImage = loadImage(FontUrl);

/**
 * Draws the specified text onto the provided canvas context.
 *
 * @param context - The 2D rendering context of the canvas.
 * @param text - The text string to be drawn.
 * @param baseX - The x-coordinate where the text drawing starts.
 * @param baseY - The y-coordinate where the text drawing starts.
 */
export function drawText(
  context: Context2D,
  text: string,
  baseX: number,
  baseY: number
) {
  let xOffset = 0;

  for (const char of text) {
    if (char !== " ") {
      drawFrame(
        context,
        fontImage,
        frames[`alpha-${char}` as FrameKey],
        baseX + xOffset,
        baseY
      );
      xOffset += 8;
    }
  }
}
