import { useSocket } from "@/hooks/useSocket";

export const UserInfo = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { me: user } = useSocket();

  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg 
      bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors duration-200
      ${isMobile ? "w-full" : ""}`}
    >
      <div
        className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 
        flex items-center justify-center text-white text-sm font-medium"
      >
        {getUserInitial()}
      </div>
      <span className="text-gray-300">{user?.name || "Guest"}</span>
    </div>
  );
};
