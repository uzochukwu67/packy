import { Trophy, Star, ShieldCheck, Loader2, CheckCircle2, Coins, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSeasonPool,
  useMakePrediction,
  useUserPrediction,
  useCheckWinner,
  useClaimReward,
  useTeamPredictionCount
} from "@/hooks/contracts/useSeasonPredictor";
import { useCurrentSeason, useTeam, useCurrentSeasonData } from "@/hooks/contracts/useGameCore";
import { formatToken } from "@/contracts/types";
import { useToast } from "@/hooks/use-toast";

export default function Season() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const { isConnected, address } = useAccount();
  const { toast } = useToast();

  // Get current season data
  const { data: seasonId } = useCurrentSeason();
  const { data: season } = useCurrentSeasonData();
  const { data: poolData } = useSeasonPool(seasonId);
  const { data: userPredictionData } = useUserPrediction(seasonId, address);
  const { data: checkWinnerData } = useCheckWinner(seasonId, address);

  // Write operations
  const { makePrediction, isConfirming: isPredicting, isSuccess: predictSuccess } = useMakePrediction();
  const { claimReward, isConfirming: isClaiming, isSuccess: claimSuccess } = useClaimReward();

  // Parse pool data
  const prizePool = poolData ? (poolData as any)[0] : 0n;
  const winnerDeclared = poolData ? (poolData as any)[4] : false;

  // Check if user can claim
  const canClaim = checkWinnerData ? (checkWinnerData as any)[0] : false;
  const prizeAmount = checkWinnerData ? (checkWinnerData as any)[1] : 0n;

  // Check if predictions are locked (season started)
  const predictionsLocked = season ? Number(season.currentRound) > 12 : false;

  // Parse user prediction (timestamp > 0 means they predicted)
  const hasPredicted = !!userPredictionData && (userPredictionData as any)[1] > 0n;
  const predictedTeamId = hasPredicted ? Number((userPredictionData as any)[0]) : null;
  const hasClaimed = hasPredicted && (userPredictionData as any)[2];

  // Set selected team from user's prediction
  useEffect(() => {
    if (hasPredicted && predictedTeamId !== null) {
      setSelectedTeam(predictedTeamId);
    }
  }, [hasPredicted, predictedTeamId]);

  // Handle success
  useEffect(() => {
    if (predictSuccess) {
      toast({
        title: "Prediction Submitted! 🎯",
        description: "Your season winner prediction has been recorded.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    }
  }, [predictSuccess, toast]);

  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: "Prize Claimed! 🎉",
        description: `You received ${formatToken(prizeAmount)} LEAGUE tokens!`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
    }
  }, [claimSuccess, prizeAmount, toast]);

  const handlePredict = async () => {
    if (selectedTeam === null || !isConnected || !seasonId) return;
    try {
      await makePrediction(seasonId, selectedTeam);
    } catch (err: any) {
      console.error("Prediction failed:", err);
      toast({
        title: "Prediction Failed",
        description: err.message || "Failed to submit prediction.",
        variant: "destructive",
      });
    }
  };

  const handleClaim = async () => {
    if (!seasonId || !isConnected) return;
    try {
      await claimReward(seasonId);
    } catch (err: any) {
      console.error("Claim failed:", err);
      toast({
        title: "Claim Failed",
        description: err.message || "Failed to claim prize.",
        variant: "destructive",
      });
    }
  };

  // Skip total predictors since distribution is gone
  const totalPredictors = 0;

  // Fetch team names for all 20 teams
  const TEAM_IDS = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 p-8 md:p-12 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy className="w-64 h-64 rotate-12" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-4"
          >
            <Star className="w-4 h-4" />
            Season {seasonId ? seasonId.toString() : "..."}
            {season?.active && (
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">ACTIVE</span>
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            Predict the Champion
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-lg mb-8 leading-relaxed"
          >
            Lock in your prediction for the season winner. The prize pool accumulates until the final whistle. Correct predictions share the entire pot!
          </motion.p>

          <div className="flex flex-wrap gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[160px] border border-white/20"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Prize Pool
              </p>
              <p className="text-2xl font-mono font-bold text-primary">
                {prizePool ? formatToken(prizePool) : "0"} LEAGUE
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[160px] border border-white/20"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Participants
              </p>
              <p className="text-2xl font-mono font-bold">{totalPredictors.toLocaleString()}</p>
            </motion.div>
          </div>

          {/* Status Messages */}
          {hasPredicted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 text-sm"
            >
              <p className="font-semibold">✓ You've made your prediction!</p>
              <p className="text-blue-200 text-xs mt-1">You predicted: Team #{predictedTeamId}</p>
            </motion.div>
          )}

          {canClaim && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-green-500/20 border border-green-400/30 rounded-xl p-3"
            >
              <p className="font-semibold text-green-200">🎉 Congratulations! You can claim your prize!</p>
              <p className="text-green-300 text-xs mt-1">Prize: {formatToken(prizeAmount)} LEAGUE</p>
            </motion.div>
          )}

          {predictionsLocked && !hasPredicted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 text-sm"
            >
              <p className="font-semibold">🔒 Predictions are locked</p>
              <p className="text-amber-200 text-xs mt-1">Season has already started. Wait for next season!</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Team Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TEAM_IDS.map((teamId) => {
          const { data: team } = useTeam(teamId);
          const isSelected = selectedTeam === teamId;
          const isPredicted = predictedTeamId === teamId;

          return (
            <motion.div
              key={teamId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: teamId * 0.02 }}
              onClick={() => !hasPredicted && !predictionsLocked && setSelectedTeam(teamId)}
              className={cn(
                "group cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-300 relative overflow-hidden",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-xl scale-105"
                  : isPredicted
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                    : "border-border hover:border-gray-300 hover:shadow-lg hover:-translate-y-1",
                (hasPredicted || predictionsLocked) && !isPredicted && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xl shadow-md border border-primary/20">
                  {team?.name?.charAt(0) || "T"}
                </div>
                {isSelected && !hasPredicted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-primary text-white p-1.5 rounded-full shadow-lg"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </motion.div>
                )}
                {isPredicted && (
                  <div className="bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 relative z-10 line-clamp-1">
                {team?.name || `Team ${teamId}`}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500 relative z-10">
                <span>View team details</span>
                {isPredicted && (
                  <span className="font-semibold text-primary">Your Pick</span>
                )}
              </div>

              {/* Selection Overlay Effect */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                  isSelected
                    ? "from-primary/10 to-primary/5 opacity-100"
                    : isPredicted
                      ? "from-blue-500/10 to-blue-500/5 opacity-100"
                      : "from-primary/5 to-transparent opacity-0 group-hover:opacity-100"
                )}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end pt-4"
      >
        <AnimatePresence mode="wait">
          {canClaim && !hasClaimed ? (
            <motion.button
              key="claim"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleClaim}
              disabled={!isConnected || isClaiming}
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-white shadow-xl active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                isClaiming
                  ? "bg-gray-400"
                  : claimSuccess
                    ? "bg-green-500 shadow-green-500/25"
                    : "bg-green-600 hover:bg-green-700 shadow-green-600/25"
              )}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Claiming Prize...
                </>
              ) : claimSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Prize Claimed!
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  Claim Prize ({formatToken(prizeAmount)} LEAGUE)
                </>
              )}
            </motion.button>
          ) : hasClaimed ? (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-8 py-4 rounded-xl font-bold bg-green-100 text-green-700 border-2 border-green-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Reward Claimed
            </motion.div>
          ) : hasPredicted ? (
            <motion.div
              key="predicted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-8 py-4 rounded-xl font-bold bg-blue-100 text-blue-700 border-2 border-blue-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Prediction Locked
            </motion.div>
          ) : (
            <motion.button
              key="predict"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handlePredict}
              disabled={!selectedTeam || !isConnected || isPredicting || predictionsLocked}
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-white shadow-xl active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                isPredicting
                  ? "bg-gray-400"
                  : predictSuccess
                    ? "bg-green-500 shadow-green-500/25"
                    : "bg-primary hover:bg-primary/90 shadow-primary/25"
              )}
            >
              {isPredicting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : predictSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Submitted!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Confirm Prediction (Free)
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
