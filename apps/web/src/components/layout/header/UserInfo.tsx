import { useSocket } from "@/hooks/useSocket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const AVATAR_COLORS = [
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#ef4444",
  "#eab308",
] as const;

export const UserInfo = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { me: user, updateProfile } = useSocket();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarColor, setAvatarColor] = useState(
    user?.avatarColor ?? AVATAR_COLORS[0]
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatarColor(user?.avatarColor ?? AVATAR_COLORS[0]);
  }, [user?.avatarColor, user?.name]);

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "?";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await updateProfile({ name, avatarColor });
    if (!result.success) {
      setError(result.message ?? "Could not update profile");
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
        bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors duration-200
        ${isMobile ? "w-full" : ""}`}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ backgroundColor: user?.avatarColor ?? AVATAR_COLORS[0] }}
        >
          {getUserInitial()}
        </div>
        <span className="text-gray-300">{user?.name || "Guest"}</span>
        <Pencil className="ml-auto h-3.5 w-3.5 text-gray-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-gray-100 sm:max-w-sm">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Set the name and color shown in rooms and chat.
          </DialogDescription>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1 text-sm text-gray-300">
              Name
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100"
                maxLength={20}
                minLength={3}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm text-gray-300">Avatar color</span>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    aria-label={`Use ${color}`}
                    className={`h-8 rounded-md border ${
                      avatarColor === color
                        ? "border-white"
                        : "border-gray-700"
                    }`}
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <DialogFooter>
              <Button type="submit">Save Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
