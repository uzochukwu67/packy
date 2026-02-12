import { useAccount } from "wagmi";
import { Loader2, Ticket, ExternalLink, CheckCircle2, Trophy, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatToken } from "@/contracts/types";
import { formatDistance } from "date-fns";
import {
  useUserBets,
  useCompleteBetInfo,
  useClaimWinnings,
  useCancelBet,
  useRoundMetadata,
  formatLBT
} from "@/hooks/contracts/useBettingCore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BetCardProps {
  betId: bigint;
  onActionSuccess?: () => void;
}

function BetCard({ betId, onActionSuccess }: BetCardProps) {
  const { toast } = useToast();
  const { bet, claimStatus, roundMetadata, isLoading } = useCompleteBetInfo(betId);
  const { claimWinnings, isConfirming: isClaiming, isSuccess: isClaimSuccess } = useClaimWinnings();
  const { cancelBet, isConfirming: isCancelling, isSuccess: isCancelSuccess } = useCancelBet();

  const handleClaim = async () => {
    try {
      await claimWinnings(betId);
    } catch (err: any) {
      toast({
        title: "Claim Failed",
        description: err.message || "Failed to claim winnings.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBet(betId);
    } catch (err: any) {
      toast({
        title: "Cancellation Failed",
        description: err.message || "Bets can only be cancelled before the round starts.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!bet || !claimStatus) return null;

  // Determine status based on blockchain data
  const getStatus = () => {
    if (bet.status === 3) return { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle };
    if (claimStatus.isClaimed) return { label: 'Claimed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 };

    // Check if settled
    if (roundMetadata?.settled) {
      if (claimStatus.isWon) return { label: 'Won', color: 'bg-green-100 text-green-700 border-green-200', icon: Trophy, canClaim: true };
      return { label: 'Lost', color: 'bg-red-50 text-red-500 border-red-100', icon: AlertCircle };
    }

    // Pending status (active)
    const canCancel = Date.now() / 1000 < Number(roundMetadata?.roundStartTime || 0);
    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, canCancel };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all hover:shadow-md group"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border border-transparent", status.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 leading-none">Bet #{betId.toString()}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Placed {formatDistance(new Date(Number(bet.timestamp) * 1000), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stake</p>
              <p className="text-lg font-mono font-bold text-gray-900">{formatLBT(bet.amount)} <span className="text-xs font-normal text-gray-400">LBT</span></p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Potential Return</p>
              <p className={cn(
                "text-lg font-mono font-bold",
                status.label === 'Won' || status.label === 'Claimed' ? "text-green-600" : "text-gray-900"
              )}>
                {formatLBT(claimStatus.totalPayout || bet.potentialPayout)} <span className="text-xs font-normal text-gray-400">LBT</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
              <Ticket className="w-3 h-3" />
              <span>Round {bet.roundId.toString()}</span>
              <span className="text-gray-300">•</span>
              <span>{bet.legCount} Leg {bet.legCount > 1 ? 'Parlay' : 'Single'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {status.canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Cancel Bet
              </button>
            )}

            {status.canClaim && (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isClaiming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                Claim Winnings
              </button>
            )}

            <a
              href={`https://testnet.bscscan.com/address/${bet.bettor}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyBets() {
  const { address, isConnected } = useAccount();
  const { data: betIds, isLoading } = useUserBets(address);

  // Reverse IDs to show newest first
  const sortedBetIds = betIds ? [...(betIds as bigint[])].reverse() : [];

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-border shadow-sm text-center"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
            <Ticket className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500 max-w-sm">
            Connect your wallet to track your betting history, check results, and claim your winnings.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">My Bets</h1>
          <p className="text-gray-500 mt-2">Historical view of your Protocol V3.0 betting activity.</p>
        </div>
        {sortedBetIds.length > 0 && (
          <div className="bg-white px-4 py-2 rounded-2xl border border-border shadow-sm flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gray-900">{sortedBetIds.length}</span>
            <span className="text-sm text-gray-500">Total Bets</span>
          </div>
        )}
      </div>

      <div className="space-y-4 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
            <p className="text-sm text-gray-400 font-medium animate-pulse">Syncing with blockchain...</p>
          </div>
        ) : sortedBetIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-border border-dashed">
            <Ticket className="w-16 h-16 text-gray-100 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No bets found</h3>
            <p className="text-sm text-gray-400 max-w-xs text-center mt-1">
              You haven't placed any bets yet. Head over to the dashboard to start playing!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedBetIds.map((id) => (
              <BetCard key={id.toString()} betId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
