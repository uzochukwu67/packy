import { Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface PointsToastProps {
  points: number;
  reason: "bet_placed" | "bet_won";
}

export function PointsToast({ points, reason }: PointsToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-3 rounded-xl shadow-lg"
    >
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        {reason === "bet_won" ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <Award className="w-5 h-5" />
        )}
      </div>
      <div>
        <div className="font-bold text-sm">
          {reason === "bet_won" ? "Bet Won!" : "Bet Placed!"}
        </div>
        <div className="text-xs text-white/90">
          +{points} {points === 1 ? "point" : "points"} earned
        </div>
      </div>
      <div className="ml-2 text-2xl font-bold">+{points}</div>
    </motion.div>
  );
}
