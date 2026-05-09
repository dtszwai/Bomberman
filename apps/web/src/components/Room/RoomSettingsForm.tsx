import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { mapOptions, powerupPresetOptions } from "@/lib/bombermanSettings";
import { RoomSettings } from "@/types";
import { SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";

export type RoomSettingsFormState = Pick<
  RoomSettings,
  | "maxUsers"
  | "isPrivate"
  | "maxWins"
  | "roundTimeSeconds"
  | "mapId"
  | "powerupPreset"
  | "tournamentMode"
>;

export const DEFAULT_ROOM_SETTINGS_FORM: RoomSettingsFormState = {
  maxUsers: 4,
  isPrivate: false,
  maxWins: 2,
  roundTimeSeconds: 180,
  mapId: "classic",
  powerupPreset: "classic",
  tournamentMode: false,
};

interface RoomSettingsFormProps {
  description: string;
  initialSettings?: Partial<RoomSettings>;
  minPlayers?: number;
  submitLabel: string;
  title: string;
  error?: string | null;
  onSubmit: (settings: Partial<RoomSettings>) => void | Promise<void>;
}

export const normalizeRoomSettingsForm = (
  form: RoomSettingsFormState
): Partial<RoomSettings> => {
  const maxWins = form.tournamentMode
    ? Math.max(form.maxWins, 3)
    : form.maxWins;

  return {
    ...form,
    maxWins,
    allowSpectators: false,
    roomCode: null,
  };
};

export const RoomSettingsForm = ({
  description,
  initialSettings,
  minPlayers = 2,
  submitLabel,
  title,
  error,
  onSubmit,
}: RoomSettingsFormProps) => {
  const [form, setForm] = useState<RoomSettingsFormState>({
    ...DEFAULT_ROOM_SETTINGS_FORM,
    ...initialSettings,
  });

  const updateForm = <K extends keyof RoomSettingsFormState>(
    key: K,
    value: RoomSettingsFormState[K]
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "tournamentMode" && value === true) {
        next.maxWins = Math.max(next.maxWins, 3);
      }
      if (key === "maxUsers") {
        next.maxUsers = Math.max(Number(value), minPlayers);
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(normalizeRoomSettingsForm(form));
  };

  return (
    <>
      <DialogTitle className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
        {title}
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        {description}
      </DialogDescription>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-gray-300">
            Players
            <select
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={form.maxUsers}
              onChange={(event) =>
                updateForm("maxUsers", Number(event.target.value))
              }
            >
              {[2, 3, 4].map((count) => (
                <option disabled={count < minPlayers} key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-gray-300">
            Wins
            <input
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              min={form.tournamentMode ? 3 : 1}
              max={7}
              type="number"
              value={form.maxWins}
              onChange={(event) =>
                updateForm("maxWins", Number(event.target.value))
              }
            />
          </label>
        </div>

        <label className="space-y-1 text-sm text-gray-300">
          Map
          <select
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
            value={form.mapId}
            onChange={(event) => updateForm("mapId", event.target.value)}
          >
            {mapOptions.map((map) => (
              <option key={map.id} value={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-gray-300">
            Round time
            <select
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={form.roundTimeSeconds}
              onChange={(event) =>
                updateForm("roundTimeSeconds", Number(event.target.value))
              }
            >
              <option value={120}>2:00</option>
              <option value={180}>3:00</option>
              <option value={300}>5:00</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-gray-300">
            Power-ups
            <select
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
              value={form.powerupPreset}
              onChange={(event) =>
                updateForm("powerupPreset", event.target.value)
              }
            >
              {powerupPresetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300">
            <input
              checked={form.tournamentMode}
              className="accent-cyan-500"
              type="checkbox"
              onChange={(event) =>
                updateForm("tournamentMode", event.target.checked)
              }
            />
            Tournament
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300">
            <input
              checked={form.isPrivate}
              className="accent-cyan-500"
              type="checkbox"
              onChange={(event) =>
                updateForm("isPrivate", event.target.checked)
              }
            />
            Private
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </>
  );
};
