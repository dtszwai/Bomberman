import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSocket } from "@/hooks/useSocket";

export const ConnectionToast = () => {
  const { connected, connecting } = useSocket();
  if (connected) return null;

  return (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert
        className={`shadow-lg ${
          connecting ? "bg-yellow-950/90" : "bg-red-950/90"
        } border-none text-white backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3">
          <AlertDescription className="text-sm font-medium">
            {connecting ? (
              "Connecting to the server..."
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="flex items-center gap-1 ml-2">
                  Connection lost. Please check your internet connection and try
                  again.
                </span>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

export default ConnectionToast;
