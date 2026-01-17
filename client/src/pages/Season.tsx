import { Trophy, Star, ShieldCheck, Loader2, CheckCircle2, Coins, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useSeasonPrizePool, 
  useMakePrediction, 
  useUserPrediction,
  useCanClaimPrize,
  useClaimPrize,
  usePredictionDistribution
} from "@/hooks/contracts/useSeasonPredictor";
import { useCurrentSeason, useTeam, useSeason } from "@/hooks/contracts/useGameEngine";
import { formatToken } from "@/contracts/types";
import { useToast } from "@/hooks/use-toast";

export default function Season() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const { isConnected, address } = useAccount();
  const { toast } = useToast();

  // Get current season data
  const { data: seasonId } = useCurrentSeason();
  const { data: season } = useSeason(seasonId);
  const { data: prizePool } = useSeasonPrizePool(seasonId);
  const { data: userPrediction } = useUserPrediction(seasonId, address);
  const { data: canClaimData } = useCanClaimPrize(seasonId, address);
  const { data: distribution } = usePredictionDistribution(seasonId);

  // Write operations
  const { makePrediction, isConfirming: isPredicting, isSuccess: predictSuccess } = useMakePrediction();
  const { claimPrize, isConfirming: isClaiming, isSuccess: claimSuccess } = useClaimPrize();

  // Check if user can claim
  const canClaim = canClaimData ? canClaimData[0] : false;
  const prizeAmount = canClaimData ? canClaimData[1] : 0n;

  // Check if predictions are locked (season started)
  const predictionsLocked = season ? Number(season.currentRound) > 0 : false;

  // Parse user prediction (returns type(uint256).max if no prediction)
  const hasPredicted = userPrediction !== undefined && userPrediction !== BigInt(2**256 - 1);
  const predictedTeamId = hasPredicted ? Number(userPrediction) : null;

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
    if (selectedTeam === null || !isConnected) return;
    try {
      await makePrediction(selectedTeam);
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
      await claimPrize(seasonId);
    } catch (err: any) {
      console.error("Claim failed:", err);
      toast({
        title: "Claim Failed",
        description: err.message || "Failed to claim prize.",
        variant: "destructive",
      });
    }
  };

  // Calculate total predictors
  const totalPredictors = distribution 
    ? Array.from(distribution).reduce((sum, count) => sum + Number(count), 0)
    : 0;

  // Fetch team names for all 20 teams
  const TEAM_IDS = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#D2691E] font-bold tracking-widest uppercase text-sm mb-4">
             <Star className="w-4 h-4" /> Season 2024/25
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Predict the Champion</h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Lock in your prediction for the season winner. The prize pool accumulates until the final whistle. Correct predictions share the entire pot!
          </p>
          
          <div className="flex flex-wrap gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[140px]">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Prize Pool</p>
              <p className="text-2xl font-mono font-bold text-[#D2691E]">150.5 ETH</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[140px]">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Participants</p>
              <p className="text-2xl font-mono font-bold">1,240</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEAMS.map((team) => (
          <div 
            key={team.id}
            onClick={() => setSelectedTeam(team.id)}
            className={cn(
              "group cursor-pointer rounded-2xl border bg-white p-6 transition-all duration-300 relative overflow-hidden",
              selectedTeam === team.id 
                ? "border-primary ring-2 ring-primary/20 shadow-xl" 
                : "border-border hover:border-gray-300 hover:shadow-lg hover:-translate-y-1"
            )}
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md", team.color)}>
                {team.name.charAt(0)}
              </div>
              {selectedTeam === team.id && (
                <div className="bg-primary text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1 relative z-10">{team.name}</h3>
            <p className="text-sm text-gray-500 relative z-10">Current Rank: #{(team.id % 4) + 1}</p>

            {/* Selection Overlay Effect */}
            <div className={cn(
              "absolute inset-0 bg-primary/5 transition-opacity duration-300",
              selectedTeam === team.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            )} />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-8">
        <button 
          disabled={!selectedTeam}
          className="px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Prediction (0.1 ETH)
        </button>
      </div>
    </div>
  );
}
