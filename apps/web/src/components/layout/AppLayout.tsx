import { Toaster } from "../ui/toaster";
import { ConnectionToast } from "./ConnectionToast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ConnectionToast />
      {children}
      <Toaster />
    </div>
  );
};
