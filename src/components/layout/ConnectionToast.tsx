import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSocket } from "@/hooks/useSocket";

export const ConnectionToast = () => {
  const { connected, connecting } = useSocket();

  if (connected) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full p-4 flex justify-center items-end sm:top-2 sm:bottom-auto sm:items-start md:top-4 z-[200]">
      <div className="w-full max-w-sm sm:max-w-md">
        <Alert
          className={`shadow-lg ${
            connecting ? "bg-yellow-950/90" : "bg-red-950/90"
          } border-none text-white backdrop-blur-sm transition-all duration-200 ease-in-out`}
        >
          <div className="flex items-center gap-2 w-full">
            <AlertDescription className="text-xs sm:text-sm md:text-base font-medium">
              {connecting ? (
                <span className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                  Connecting to the server...
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex items-center gap-1">
                    Connection lost. Please check your internet connection and
                    try again.
                  </span>
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  );
};

export default ConnectionToast;
