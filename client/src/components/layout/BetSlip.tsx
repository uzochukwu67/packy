import { useBetSlip } from "@/context/BetSlipContext";
import { X, Trash2, Ticket, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, usePublicClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { usePlaceBet, useCurrentParlayMultiplier } from "@/hooks/contracts/useBettingPool";
import { useCurrentRound, useCurrentSeason } from "@/hooks/contracts/useGameEngine";
import { useLeagueAllowance, useApproveLeague } from "@/hooks/contracts/useLeagueToken";
import { parseToken, formatToken, formatOdds } from "@/contracts/types";
import { useEffect, useState } from "react";
import { DEPLOYED_ADDRESSES } from "@/contracts/addresses";
import BettingPoolABI from "@/abis/bettingpool.json";
import { decodeEventLog } from "viem";

export function BetSlip() {
  const { bets, removeBet, clearSlip, stake, setStake, isOpen, toggleSlip } = useBetSlip();
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [needsApproval, setNeedsApproval] = useState(false);
  const publicClient = usePublicClient();

  // Get current round and season
  const { data: roundId } = useCurrentRound();
  const { data: seasonId } = useCurrentSeason();

  // Check token allowance
  const { data: allowance, refetch: refetchAllowance } = useLeagueAllowance(address);

  // Token approval
  const {
    approve,
    isConfirming: isApproving,
    isSuccess: approveSuccess,
    isPending: approvePending,
  } = useApproveLeague();

  // Extract match indices and outcomes from bet slip
  const matchIndices = bets.map(bet => {
    const [, matchIndex] = bet.matchId.split('-');
    return parseInt(matchIndex);
  });

  const outcomes = bets.map(bet => {
    // Map selection to outcome number: 1=HOME, 2=AWAY, 3=DRAW
    if (bet.selection === "Home") return 1;
    if (bet.selection === "Away") return 2;
    return 3; // Draw
  });

  // Get parlay multiplier
  const { data: parlayInfo } = useCurrentParlayMultiplier(
    roundId,
    matchIndices,
    bets.length
  );

  // Blockchain bet placement
  const { placeBet, isConfirming, isSuccess, isPending, error, hash } = usePlaceBet();

  // Calculate odds and potential return
  const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
  const basePotentialReturn = stake * totalOdds;

  // Apply parlay multiplier if available
  const parlayMultiplier = parlayInfo ? formatOdds(parlayInfo[0]) : 1.0;
  const finalPotentialReturn = basePotentialReturn * parlayMultiplier;

  const formattedOdds = totalOdds.toFixed(2);
  const formattedReturn = finalPotentialReturn.toFixed(2);

  // Check if approval is needed when stake changes
  useEffect(() => {
    if (stake > 0 && allowance !== undefined) {
      const stakeInWei = parseToken(stake.toString());
      setNeedsApproval(allowance < stakeInWei);
    }
  }, [stake, allowance]);

  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      toast({
        title: "Approval Successful! ✓",
        description: "You can now place your bet.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    }
  }, [approveSuccess, refetchAllowance, toast]);

  // Save bet to database and show success notification
  useEffect(() => {
    // Only run once when bet is successfully placed (hash changes)
    if (!isSuccess || !hash) return;

    let hasRun = false;

    const saveBetToDatabase = async () => {
      if (hasRun || !publicClient || !address || !seasonId || !roundId) return;
      hasRun = true;

      try {
        // The backend event listener will handle saving to database
        // We just need to show success notification and clear slip
        toast({
          title: "Bet Placed Successfully! 🎉",
          description: `Staked ${stake} LEAGUE tokens. Check "My Bets" to track your wager.`,
          className: "bg-green-50 border-green-200 text-green-900",
        });
        clearSlip();
      } catch (err) {
        console.error('Error handling bet success:', err);
      }
    };

    saveBetToDatabase();
  }, [isSuccess, hash]); // Only depend on isSuccess and hash

  // Show error notification
  useEffect(() => {
    if (error) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleApprove = async () => {
    if (stake <= 0) return;
    try {
      const stakeInWei = parseToken(stake.toString());
      // Approve a bit more to avoid having to approve again soon
      const approvalAmount = stakeInWei * BigInt(10);
      await approve(approvalAmount);
    } catch (err: any) {
      console.error("Failed to approve tokens:", err);
    }
  };

  const handlePlaceBet = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place a bet.",
        variant: "destructive"
      });
      return;
    }

    if (bets.length === 0) return;
    if (stake <= 0) {
      toast({
        title: "Invalid stake",
        description: "Please enter a stake amount greater than 0.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert stake to wei (18 decimals for LEAGUE token)
      const stakeInWei = parseToken(stake.toString());

      // Place bet on blockchain
      await placeBet(matchIndices, outcomes, stakeInWei);
    } catch (err: any) {
      console.error("Failed to place bet:", err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleSlip}
        className="fixed bottom-6 right-6 z-50 md:hidden bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/30"
      >
        <Ticket className="w-6 h-6" />
        {bets.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
            {bets.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-border h-screen sticky top-0 hidden lg:flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.02)]">
      <div className="p-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Ticket className="w-4 h-4" />
          </div>
          <h2 className="font-display font-bold text-lg">Bet Slip</h2>
        </div>
        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
          {bets.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {bets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Your slip is empty.</p>
              <p className="text-xs mt-1 opacity-70">Select odds from any match to start betting.</p>
            </div>
          ) : (
            bets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-secondary/50 rounded-xl p-3 border border-border group hover:border-primary/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-gray-500">{bet.matchTitle}</span>
                  <button
                    onClick={() => removeBet(bet.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={isPending || isConfirming}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{bet.selection}</span>
                  <span className="bg-white px-2 py-1 rounded-md text-sm font-bold text-primary shadow-sm border border-gray-100">
                    {bet.odds.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 border-t border-border bg-gray-50/50 space-y-4">
        {bets.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Odds</span>
                <span className="font-bold font-mono">{formattedOdds}</span>
              </div>

              {/* Parlay Multiplier Indicator */}
              {bets.length > 1 && parlayInfo && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-purple-700 uppercase">Parlay Bonus</span>
                    <span className="text-sm font-bold text-purple-700">{parlayMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-xs text-purple-600">
                    <span>Tier {parlayInfo[1].toString()}</span>
                    <span>{parlayInfo[2].toString()} left in tier</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stake (LEAGUE)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                    disabled={isPending || isConfirming}
                    className="w-full pl-3 pr-16 py-2.5 bg-white border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">LEAGUE</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <span className="text-xs font-bold text-green-700 uppercase">Potential Return</span>
                <div className="text-right">
                  <div className="font-bold text-green-700 font-mono">{formattedReturn} LEAGUE</div>
                  {bets.length > 1 && parlayMultiplier > 1 && (
                    <div className="text-xs text-green-600">
                      (Base: {basePotentialReturn.toFixed(2)} × {parlayMultiplier.toFixed(2)}x)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={clearSlip}
                disabled={isPending || isConfirming || approvePending || isApproving}
                className="col-span-1 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={!stake || !isConnected || approvePending || isApproving}
                  className={cn(
                    "col-span-3 py-3 rounded-xl font-bold text-white shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    approvePending || isApproving
                      ? "bg-gray-400"
                      : approveSuccess
                      ? "bg-green-500"
                      : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
                  )}
                >
                  {approvePending || isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {approvePending ? "Approving..." : "Confirming..."}
                    </>
                  ) : approveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Approved!
                    </>
                  ) : (
                    "Approve LEAGUE"
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePlaceBet}
                  disabled={!stake || !isConnected || isPending || isConfirming}
                  className={cn(
                    "col-span-3 py-3 rounded-xl font-bold text-white shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    isPending || isConfirming
                      ? "bg-gray-400"
                      : isSuccess
                      ? "bg-green-500"
                      : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {isPending && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pending...
                    </>
                  )}
                  {isConfirming && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  )}
                  {isSuccess && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Success!
                    </>
                  )}
                  {!isPending && !isConfirming && !isSuccess && "Place Bet"}
                </button>
              )}
            </div>

            {/* Transaction Status */}
            {(isPending || isConfirming || approvePending || isApproving) && (
              <div className="text-xs text-center text-gray-500">
                {(approvePending || isApproving) && "Approving token spending..."}
                {isPending && "Waiting for wallet to confirm bet..."}
                {isConfirming && "Transaction submitted. Waiting for confirmation..."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
