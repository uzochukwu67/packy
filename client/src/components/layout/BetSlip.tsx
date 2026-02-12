import { useBetSlip } from "@/context/BetSlipContext";
import { X, Trash2, Ticket, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, usePublicClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { usePlaceBet, useCurrentRound as useBettingRound } from "@/hooks/contracts/useBettingCore";
import { useCurrentRound, useCurrentSeason } from "@/hooks/contracts/useGameCore";
import { useLeagueAllowance, useApproveLeague } from "@/hooks/contracts/useLeagueToken";
import { parseToken, formatToken, formatOdds } from "@/contracts/types";
import { useEffect, useState } from "react";
import { DEPLOYED_ADDRESSES } from "@/contracts/addresses";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function BetSlip() {
  const { bets, removeBet, clearSlip, stake, setStake, isOpen, toggleSlip } = useBetSlip();
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [needsApproval, setNeedsApproval] = useState(false);
  const publicClient = usePublicClient();

  // Get current round and season
  const { data: gameRoundId } = useCurrentRound();
  const { data: bettingRoundId } = useBettingRound();
  const { data: seasonId } = useCurrentSeason();

  // Prioritize BettingCore round ID
  const roundId = bettingRoundId !== undefined ? bettingRoundId : gameRoundId;

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

  // Blockchain bet placement
  const { placeBet, isConfirming, isSuccess, isPending, error, hash } = usePlaceBet();

  // Calculate odds and potential return
  const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialReturn = stake * totalOdds;

  const formattedOdds = totalOdds.toFixed(2);
  const formattedReturn = potentialReturn.toFixed(2);

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
      if (hasRun || !publicClient || !address || seasonId === undefined || roundId === undefined) return;
      hasRun = true;

      try {
        // The backend event listener will handle saving to database
        // We just need to show success notification and clear slip
        toast({
          title: "Bet Placed Successfully! 🎉",
          description: `Staked ${stake} LBT tokens. Check "My Bets" to track your wager.`,
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
      // Convert stake to wei (18 decimals for LBT token)
      const stakeInWei = parseToken(stake.toString());

      // Place bet on blockchain via BettingCore (direct call)
      // Signature: placeBet(uint256 amount, uint256[] matchIndices, uint8[] predictions)
      await placeBet(stakeInWei, matchIndices, outcomes);
    } catch (err: any) {
      console.error("Failed to place bet:", err);
    }
  };

  // Bet slip content component (reusable for desktop and mobile)
  const BetSlipContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {bets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <Ticket className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-sm font-bold">Empty Slip</p>
              <p className="text-[10px] mt-1 opacity-70 uppercase tracking-widest leading-loose">Select odds from any match <br /> to start betting.</p>
            </div>
          ) : (
            bets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900 rounded-xl p-3 border border-white/5 group hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{bet.matchTitle}</span>
                  <button
                    onClick={() => removeBet(bet.id)}
                    className="text-zinc-700 hover:text-red-500 transition-colors"
                    disabled={isPending || isConfirming}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{bet.selection}</span>
                  </div>
                  <span className="bg-zinc-800 px-2 py-1 rounded text-sm font-mono font-bold text-cyan-400 border border-white/5">
                    {bet.odds.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 border-t border-white/5 bg-white/5 space-y-4">
        {bets.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-bold uppercase tracking-widest">Total Odds</span>
                <span className="font-black font-mono text-cyan-400 text-sm">{formattedOdds}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Stake (LBT)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                    disabled={isPending || isConfirming}
                    className="w-full pl-3 pr-16 py-3 bg-zinc-900 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-sm text-white disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-black text-zinc-600">LBT</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Potential Return</span>
                <div className="font-black text-cyan-400 font-mono text-lg">{formattedReturn}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={clearSlip}
                disabled={isPending || isConfirming || approvePending || isApproving}
                className="col-span-1 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-700 hover:text-red-500 hover:border-red-500/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={!stake || !isConnected || approvePending || isApproving}
                  className={cn(
                    "col-span-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    approvePending || isApproving
                      ? "bg-zinc-800 text-zinc-500"
                      : approveSuccess
                        ? "bg-green-500 text-black"
                        : "bg-white text-black hover:bg-cyan-400"
                  )}
                >
                  {approvePending || isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {approvePending ? "Approving" : "Confirming"}
                    </>
                  ) : approveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Approved
                    </>
                  ) : (
                    "Approve LBT"
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePlaceBet}
                  disabled={!stake || !isConnected || isPending || isConfirming}
                  className={cn(
                    "col-span-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    isPending || isConfirming
                      ? "bg-zinc-800 text-zinc-500"
                      : isSuccess
                        ? "bg-cyan-500 text-black"
                        : "bg-white text-black hover:bg-cyan-400 shadow-xl shadow-cyan-500/10"
                  )}
                >
                  {isPending && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                      Processing
                    </>
                  )}
                  {isConfirming && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                      Confirming
                    </>
                  )}
                  {isSuccess && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Placed!
                    </>
                  )}
                  {!isPending && !isConfirming && !isSuccess && "Place Wager"}
                </button>
              )}
            </div>

            {/* Transaction Status */}
            {(isPending || isConfirming || approvePending || isApproving) && (
              <div className="text-[10px] font-bold text-center text-zinc-600 uppercase tracking-widest animate-pulse">
                {(approvePending || isApproving) && "Sign Approval..."}
                {isPending && "Awaiting Wallet..."}
                {isConfirming && "Confirming on BSC..."}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Floating Button */}
      <button
        onClick={toggleSlip}
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-cyan-500 text-black p-4 rounded-full shadow-xl shadow-cyan-500/30 hover:bg-cyan-400 transition-colors"
      >
        <Ticket className="w-6 h-6" />
        {bets.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black rounded-full text-[10px] flex items-center justify-center font-bold">
            {bets.length}
          </span>
        )}
      </button>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={toggleSlip}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col bg-zinc-950">
          <SheetHeader className="p-5 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <Ticket className="w-4 h-4" />
                </div>
                <SheetTitle className="font-display font-bold text-lg text-white">Bet Slip</SheetTitle>
              </div>
              <span className="bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                {bets.length} SELS
              </span>
            </div>
          </SheetHeader>
          <BetSlipContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="w-80 bg-zinc-950 border-l border-white/5 h-screen sticky top-0 hidden lg:flex flex-col backdrop-blur-xl">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Ticket className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Bet Slip</h2>
          </div>
          <span className="bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">
            {bets.length} SELS
          </span>
        </div>
        <BetSlipContent />
      </div>
    </>
  );
}
