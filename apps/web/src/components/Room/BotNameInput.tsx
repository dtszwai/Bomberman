import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface BotNameInputProps {
  name: string;
  onRename: (name: string) => void;
  className?: string;
}

export const BotNameInput = ({
  name,
  onRename,
  className = "",
}: BotNameInputProps) => {
  const [draft, setDraft] = useState(name);
  const skipNextSubmit = useRef(false);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  const submit = () => {
    if (skipNextSubmit.current) {
      skipNextSubmit.current = false;
      return;
    }

    const nextName = draft.trim();
    if (nextName === name) {
      setDraft(name);
      return;
    }

    if (nextName.length < 1 || nextName.length > 20) {
      setDraft(name);
      toast({
        title: "Invalid bot name",
        description: "Use 1 to 20 characters.",
        variant: "destructive",
      });
      return;
    }

    onRename(nextName);
  };

  return (
    <input
      aria-label="Bot name"
      className={`rounded border border-gray-700 bg-gray-950/80 px-2 py-0.5 text-center text-xs font-medium text-gray-200 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 ${className}`}
      maxLength={20}
      value={draft}
      onBlur={submit}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          skipNextSubmit.current = true;
          setDraft(name);
          event.currentTarget.blur();
        }
      }}
    />
  );
};
