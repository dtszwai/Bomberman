import { useSocket } from "@/hooks/useSocket";
import { Loader, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ConnectionStatus = () => {
  const { connected, connecting } = useSocket();
  if (connected && !connecting) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center rounded-full bg-gray-800/50 p-1.5">
            {connecting ? (
              <Loader className="w-4 h-4 text-yellow-400 animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm font-medium">
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
