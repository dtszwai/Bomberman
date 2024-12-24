import { Bomb, Flame } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export const AnimatedLogo = () => {
  const { connected, connecting } = useSocket();

  return (
    <div className="relative group cursor-pointer">
      <div className="relative transition-transform duration-300 group-hover:scale-110">
        <Bomb
          className={`w-8 md:w-10 h-8 md:h-10 ${
            connecting
              ? "text-yellow-400"
              : connected
              ? "text-cyan-400"
              : "text-gray-400"
          } ${connected ? "animate-pulse" : "animate-none"}`}
        />
        <Flame
          className={`w-3 md:w-4 h-3 md:h-4 text-purple-400 absolute -top-1 -right-1
          transition-all duration-300 group-hover:text-purple-300 group-hover:scale-125`}
        />
      </div>
    </div>
  );
};
