import { useCallback, useEffect, useRef, useState } from "react";
import { Events, ServerEvents } from "@/events";
import { socket } from "@/apis/socket";
import { controls } from "@/game/config/controls";

export function useGame() {
  const [snapshot, setSnapshot] = useState<ServerEvents["gameState"] | null>(
    null
  );
  const [heldKeys] = useState(new Set<string>());
  const [pressedKeys] = useState(new Set<string>());
  // Track keys that have been used and shouldn't trigger again until released
  const [usedKeys] = useState(new Set<string>());

  const previousHeldKeys = useRef<string[]>([]);
  const previousPressedKeys = useRef<string[]>([]);

  const handleGameState = useCallback((state: ServerEvents["gameState"]) => {
    setSnapshot(state);
  }, []);

  const mappedKeys = controls
    .map(({ keyboard }) => Object.values(keyboard))
    .flat();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!mappedKeys.includes(event.code)) return;
      event.preventDefault();

      heldKeys.add(event.code);

      // Only add to pressedKeys if the key hasn't been used yet
      if (!usedKeys.has(event.code)) {
        pressedKeys.add(event.code);
        usedKeys.add(event.code); // Mark the key as used
      }

      const currentHeldKeys = Array.from(heldKeys);
      const currentPressedKeys = Array.from(pressedKeys);

      if (
        !areArraysEqual(currentHeldKeys, previousHeldKeys.current) ||
        !areArraysEqual(currentPressedKeys, previousPressedKeys.current)
      ) {
        socket.emit(Events.PLAYER_CONTROLS, {
          heldKeys: currentHeldKeys,
          pressedKeys: currentPressedKeys,
        });

        previousHeldKeys.current = currentHeldKeys;
        previousPressedKeys.current = currentPressedKeys;
      }
    },
    [heldKeys, mappedKeys, pressedKeys, usedKeys]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!mappedKeys.includes(event.code)) return;
      event.preventDefault();

      heldKeys.delete(event.code);
      pressedKeys.delete(event.code);
      usedKeys.delete(event.code); // Reset the used state when key is released

      const currentHeldKeys = Array.from(heldKeys);
      const currentPressedKeys = Array.from(pressedKeys);

      socket.emit(Events.PLAYER_CONTROLS, {
        heldKeys: currentHeldKeys,
        pressedKeys: currentPressedKeys,
      });

      previousHeldKeys.current = currentHeldKeys;
      previousPressedKeys.current = currentPressedKeys;
    },
    [heldKeys, mappedKeys, pressedKeys, usedKeys]
  );

  const areArraysEqual = (arr1: string[], arr2: string[]) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    socket.on(Events.GAME_STATE, handleGameState);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      socket.off(Events.GAME_STATE, handleGameState);
    };
  }, [handleKeyDown, handleKeyUp, handleGameState]);

  return { snapshot };
}
