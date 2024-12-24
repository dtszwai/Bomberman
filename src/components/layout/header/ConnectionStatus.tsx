import { Loader, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSocket } from "@/hooks/useSocket";

export const ConnectionStatus = () => {
  const { connected, connecting } = useSocket();
  if (connected && !connecting) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {connecting ? (
            <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400 animate-pulse" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {connecting
              ? "Connecting to server..."
              : "Disconnected from server"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
