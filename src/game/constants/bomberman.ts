import { FrameData } from "@/engine/types";
import { Direction } from "./entities";

/* ============================
   Basic Constants and Enums
   ============================ */

// Movement speed of the Bomberman character
export const WALK_SPEED = 40;

// Possible states of the Bomberman
export enum BombermanStateType {
  IDLE = "idle",
  MOVING = "moving",
  DEATH = "death",
}

// Available colors for Bomberman characters
export enum BombermanColor {
  WHITE = "white",
  BLACK = "black",
  BLUE = "blue",
  RED = "red",
  GREEN = "green",
}

// Type definition for player data
type BombermanPlayerDataItem = {
  color: BombermanColor;
  column: number;
  row: number;
};

// Predefined player data for each color
export const BombermanPlayerData: readonly BombermanPlayerDataItem[] = [
  { color: BombermanColor.WHITE, column: 1, row: 2 },
  { color: BombermanColor.BLACK, column: 11, row: 14 },
  { color: BombermanColor.BLUE, column: 11, row: 2 },
  { color: BombermanColor.RED, column: 1, row: 14 },
  { color: BombermanColor.GREEN, column: 6, row: 8 },
] as const;

/* ============================
   Frame Data Definitions
   ============================ */

// Type for frame keys to ensure consistency
type FrameKey =
  | "idle-down"
  | "move-down-1"
  | "move-down-2"
  | "idle-side"
  | "move-side-1"
  | "move-side-2"
  | "idle-up"
  | "move-up-1"
  | "move-up-2"
  | "idle-down-left"
  | "idle-up-left"
  | "death-1"
  | "death-2"
  | "death-3"
  | "death-4"
  | "death-5"
  | "death-6"
  | "death-7"
  | "death-8"
  | "death-9";

// Centralized frame data for animations
export const frames: Record<FrameKey, FrameData> = {
  "idle-down": [
    [4, 5, 17, 22],
    [8, 15],
  ],
  "move-down-1": [
    [30, 5, 17, 22],
    [7, 15],
  ],
  "move-down-2": [
    [61, 5, 17, 22],
    [9, 15],
  ],
  "idle-side": [
    [79, 5, 18, 22],
    [7, 15],
  ],
  "move-side-1": [
    [104, 5, 17, 21],
    [8, 15],
  ],
  "move-side-2": [
    [129, 5, 18, 22],
    [8, 15],
  ],
  "idle-up": [
    [154, 4, 17, 22],
    [8, 15],
  ],
  "move-up-1": [
    [180, 4, 17, 22],
    [7, 15],
  ],
  "move-up-2": [
    [211, 5, 17, 22],
    [9, 15],
  ],
  "idle-down-left": [
    [5, 55, 17, 20],
    [6, 15],
  ],
  "idle-up-left": [
    [30, 55, 17, 20],
    [6, 15],
  ],
  "death-1": [
    [10, 30, 21, 20],
    [10, 15],
  ],
  "death-2": [
    [44, 30, 19, 19],
    [9, 15],
  ],
  "death-3": [
    [75, 30, 22, 20],
    [11, 15],
  ],
  "death-4": [
    [108, 30, 22, 21],
    [11, 15],
  ],
  "death-5": [
    [142, 31, 20, 20],
    [10, 15],
  ],
  "death-6": [
    [175, 32, 20, 19],
    [10, 15],
  ],
  "death-7": [
    [207, 33, 21, 19],
    [11, 15],
  ],
  "death-8": [
    [240, 32, 22, 21],
    [11, 15],
  ],
  "death-9": [
    [273, 32, 22, 21],
    [11, 15],
  ],
};

/* ============================
   Animation Definitions
   ============================ */

// Type for animation frames ensuring consistency
export type AnimationFrame = [FrameKey, number];

// Animations mapped by state and direction
export const animations = {
  moveAnimations: {
    [Direction.LEFT]: [
      ["idle-side", 8],
      ["move-side-1", 8],
      ["idle-side", 8],
      ["move-side-2", 8],
    ],
    [Direction.RIGHT]: [
      ["idle-side", 8],
      ["move-side-1", 8],
      ["idle-side", 8],
      ["move-side-2", 8],
    ],
    [Direction.UP]: [
      ["idle-up", 8],
      ["move-up-1", 8],
      ["idle-up", 8],
      ["move-up-2", 8],
    ],
    [Direction.DOWN]: [
      ["idle-down", 8],
      ["move-down-1", 8],
      ["idle-down", 8],
      ["move-down-2", 8],
    ],
  } as Record<Direction, AnimationFrame[]>,
  deathAnimation: [
    ["death-1", 8],
    ["death-2", 8],
    ["death-1", 8],
    ["death-2", 8],
    ["death-1", 8],
    ["death-2", 8],
    ["death-3", 8],
    ["death-4", 8],
    ["death-5", 8],
    ["death-6", 8],
    ["death-7", 8],
    ["death-8", 8],
    ["death-9", 8],
    ["death-9", -1],
  ] as AnimationFrame[],
};

// Frame data organized by Bomberman color
export const bombermanFrames: Record<BombermanColor, [FrameKey, FrameData][]> =
  {
    [BombermanColor.WHITE]: [
      [
        "idle-down",
        [
          [4, 5, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-down-1",
        [
          [30, 5, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-down-2",
        [
          [61, 5, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-side",
        [
          [79, 5, 18, 22],
          [7, 15],
        ],
      ],
      [
        "move-side-1",
        [
          [104, 5, 17, 21],
          [8, 15],
        ],
      ],
      [
        "move-side-2",
        [
          [129, 5, 18, 22],
          [8, 15],
        ],
      ],
      [
        "idle-up",
        [
          [154, 4, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-up-1",
        [
          [180, 4, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-up-2",
        [
          [211, 4, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-down-left",
        [
          [5, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "idle-up-left",
        [
          [30, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "death-1",
        [
          [10, 30, 21, 20],
          [10, 15],
        ],
      ],
      [
        "death-2",
        [
          [44, 30, 19, 19],
          [9, 15],
        ],
      ],
      [
        "death-3",
        [
          [75, 30, 22, 20],
          [11, 15],
        ],
      ],
      [
        "death-4",
        [
          [108, 30, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-5",
        [
          [142, 31, 20, 20],
          [10, 15],
        ],
      ],
      [
        "death-6",
        [
          [175, 32, 20, 19],
          [10, 15],
        ],
      ],
      [
        "death-7",
        [
          [207, 33, 21, 19],
          [11, 15],
        ],
      ],
      [
        "death-8",
        [
          [240, 32, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-9",
        [
          [273, 32, 22, 21],
          [11, 15],
        ],
      ],
    ],
    [BombermanColor.BLACK]: [
      [
        "idle-down",
        [
          [4, 80, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-down-1",
        [
          [30, 80, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-down-2",
        [
          [61, 80, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-side",
        [
          [79, 80, 18, 22],
          [7, 15],
        ],
      ],
      [
        "move-side-1",
        [
          [104, 80, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-side-2",
        [
          [129, 80, 18, 22],
          [8, 15],
        ],
      ],
      [
        "idle-up",
        [
          [154, 79, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-up-1",
        [
          [180, 79, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-up-2",
        [
          [211, 79, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-down-left",
        [
          [5, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "idle-up-left",
        [
          [30, 55, 17, 20],
          [6, 15],
        ],
      ],

      [
        "death-1",
        [
          [10, 105, 21, 22],
          [10, 15],
        ],
      ],
      [
        "death-2",
        [
          [44, 105, 19, 22],
          [9, 15],
        ],
      ],
      [
        "death-3",
        [
          [75, 105, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-4",
        [
          [108, 105, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-5",
        [
          [142, 106, 20, 21],
          [10, 15],
        ],
      ],
      [
        "death-6",
        [
          [175, 107, 20, 20],
          [10, 15],
        ],
      ],
      [
        "death-7",
        [
          [207, 108, 21, 19],
          [11, 15],
        ],
      ],
      [
        "death-8",
        [
          [240, 107, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-9",
        [
          [273, 107, 22, 21],
          [11, 15],
        ],
      ],
    ],
    [BombermanColor.RED]: [
      [
        "idle-down",
        [
          [4, 286, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-down-1",
        [
          [30, 286, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-down-2",
        [
          [61, 286, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-side",
        [
          [79, 286, 18, 22],
          [7, 15],
        ],
      ],
      [
        "move-side-1",
        [
          [104, 286, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-side-2",
        [
          [129, 286, 18, 22],
          [8, 15],
        ],
      ],
      [
        "idle-up",
        [
          [154, 285, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-up-1",
        [
          [180, 285, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-up-2",
        [
          [211, 285, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-down-left",
        [
          [5, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "idle-up-left",
        [
          [30, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "death-1",
        [
          [10, 311, 21, 22],
          [10, 15],
        ],
      ],
      [
        "death-2",
        [
          [44, 311, 19, 22],
          [9, 15],
        ],
      ],
      [
        "death-3",
        [
          [75, 311, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-4",
        [
          [108, 311, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-5",
        [
          [142, 312, 20, 21],
          [10, 15],
        ],
      ],
      [
        "death-6",
        [
          [175, 313, 20, 20],
          [10, 15],
        ],
      ],
      [
        "death-7",
        [
          [207, 314, 21, 19],
          [11, 15],
        ],
      ],
      [
        "death-8",
        [
          [240, 313, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-9",
        [
          [273, 313, 22, 21],
          [11, 15],
        ],
      ],
    ],
    [BombermanColor.BLUE]: [
      [
        "idle-down",
        [
          [4, 336, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-down-1",
        [
          [30, 336, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-down-2",
        [
          [61, 336, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-side",
        [
          [79, 336, 18, 22],
          [7, 15],
        ],
      ],
      [
        "move-side-1",
        [
          [104, 336, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-side-2",
        [
          [129, 336, 18, 22],
          [8, 15],
        ],
      ],
      [
        "idle-up",
        [
          [154, 335, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-up-1",
        [
          [180, 335, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-up-2",
        [
          [211, 335, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-down-left",
        [
          [5, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "idle-up-left",
        [
          [30, 55, 17, 20],
          [6, 15],
        ],
      ],
      [
        "death-1",
        [
          [10, 361, 21, 22],
          [10, 15],
        ],
      ],
      [
        "death-2",
        [
          [44, 361, 19, 22],
          [9, 15],
        ],
      ],
      [
        "death-3",
        [
          [75, 361, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-4",
        [
          [108, 361, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-5",
        [
          [142, 362, 20, 21],
          [10, 15],
        ],
      ],
      [
        "death-6",
        [
          [175, 363, 20, 20],
          [10, 15],
        ],
      ],
      [
        "death-7",
        [
          [207, 364, 21, 19],
          [11, 15],
        ],
      ],
      [
        "death-8",
        [
          [240, 363, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-9",
        [
          [273, 363, 22, 21],
          [11, 15],
        ],
      ],
    ],
    [BombermanColor.GREEN]: [
      [
        "idle-down",
        [
          [4, 386, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-down-1",
        [
          [30, 386, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-down-2",
        [
          [61, 386, 17, 22],
          [9, 15],
        ],
      ],
      [
        "idle-side",
        [
          [79, 386, 18, 22],
          [7, 15],
        ],
      ],
      [
        "move-side-1",
        [
          [104, 386, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-side-2",
        [
          [129, 386, 18, 22],
          [8, 15],
        ],
      ],
      [
        "idle-up",
        [
          [154, 385, 17, 22],
          [8, 15],
        ],
      ],
      [
        "move-up-1",
        [
          [180, 385, 17, 22],
          [7, 15],
        ],
      ],
      [
        "move-up-2",
        [
          [211, 385, 17, 22],
          [9, 15],
        ],
      ],

      [
        "death-1",
        [
          [10, 411, 21, 22],
          [10, 15],
        ],
      ],
      [
        "death-2",
        [
          [44, 411, 19, 22],
          [9, 15],
        ],
      ],
      [
        "death-3",
        [
          [75, 411, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-4",
        [
          [108, 411, 22, 22],
          [11, 15],
        ],
      ],
      [
        "death-5",
        [
          [142, 412, 20, 21],
          [10, 15],
        ],
      ],
      [
        "death-6",
        [
          [175, 413, 20, 20],
          [10, 15],
        ],
      ],
      [
        "death-7",
        [
          [207, 414, 21, 19],
          [11, 15],
        ],
      ],
      [
        "death-8",
        [
          [240, 413, 22, 21],
          [11, 15],
        ],
      ],
      [
        "death-9",
        [
          [273, 413, 22, 21],
          [11, 15],
        ],
      ],
    ],
  } as const;

/**
 * Retrieves the frame data for a specific Bomberman color.
 *
 * @param color - The color of the Bomberman.
 * @returns A Map of frame names to their corresponding FrameData.
 */
export const getBombermanFrames = (color: BombermanColor) =>
  new Map([...bombermanFrames[color]]);
