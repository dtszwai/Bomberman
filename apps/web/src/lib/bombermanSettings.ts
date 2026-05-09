import { BOMBERMAN_MAPS, POWERUP_PRESETS } from "@arcade/games-bomberman/sim";

export const mapOptions = BOMBERMAN_MAPS;
export const powerupPresetOptions = POWERUP_PRESETS;

export const getMapName = (mapId: string) =>
  mapOptions.find((map) => map.id === mapId)?.name ?? "Classic";

export const getPowerupPresetName = (presetId: string) =>
  powerupPresetOptions.find((preset) => preset.id === presetId)?.name ??
  "Classic";

export const getMatchModeName = (tournamentMode: boolean) =>
  tournamentMode ? "Tournament" : "Casual";
