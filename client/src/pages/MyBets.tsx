import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Loader2, Ticket, ExternalLink, CheckCircle2, Trophy } from "lucide-react";
import { formatToken } from "@/contracts/types";
import { formatDistance } from "date-fns";
import { useClaimWinnings } from "@/hooks/contracts/useBettingCore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Bet {
  id: number;
  betId: string;
  bettor: string;
  seasonId: string;
  roundId: string;
  amount: string;
  matchIndices: number[];
  outcomes: number[];
  parlayMultiplier: string;
  potentialWinnings: string;
  status: string;
  txHash: string;
  placedAt: string;
  settledAt: string | null;
}

// Component for individual bet row with claim functionality
function BetRow({ bet, onClaimed }: { bet: Bet; onClaimed: () => void }) {
  const { toast } = useToast();
  const { claimWinnings, isConfirming, isSuccess } = useClaimWinnings();

  const won = bet.status === 'won';
  const finalPayout = BigInt(bet.potentialWinnings);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Winnings Claimed! 🎉",
        description: `You received ${formatToken(finalPayout)} LBT tokens!`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
      onClaimed();
    }
  }, [isSuccess, finalPayout, toast, onClaimed]);

  const handleClaim = async () => {
    try {
      await claimWinnings(BigInt(bet.betId));
    } catch (err: any) {
      console.error("Claim failed:", err);
      toast({
        title: "Claim Failed",
        description: err.message || "Failed to claim winnings.",
        variant: "destructive",
      });
    }
  };

  const stakeAmount = parseFloat(formatToken(BigInt(bet.amount)));
  const potentialWinnings = parseFloat(formatToken(BigInt(bet.potentialWinnings)));
  const parlayMultiplier = parseFloat(formatToken(BigInt(bet.parlayMultiplier)));

  const getOutcomeLabel = (outcome: number) => {
    if (outcome === 1) return "Home";
    if (outcome === 2) return "Away";
    return "Draw";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'claimed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const formatBetDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const showClaimButton = won && bet.status === 'won';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      {/* Bet Details */}
      <div className="col-span-12 md:col-span-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">#{bet.betId}</span>
          <a
            href={`https://sepolia.etherscan.io/tx/${bet.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-gray-500">{formatBetDate(bet.placedAt)}</p>
      </div>

      {/* Round */}
      <div className="col-span-6 md:col-span-2 text-center">
        <span className="inline-block bg-secondary px-2 py-1 rounded-md text-xs font-medium text-gray-700">
          S{bet.seasonId} • R{bet.roundId}
        </span>
      </div>

      {/* Selections */}
      <div className="col-span-6 md:col-span-2 text-center">
        <div className="space-y-1">
          {bet.matchIndices.length === 1 ? (
            <span className="inline-block bg-blue-50 px-2 py-1 rounded text-xs font-medium text-blue-700">
              Single: M{bet.matchIndices[0]} • {getOutcomeLabel(bet.outcomes[0])}
            </span>
          ) : (
            <>
              <span className="inline-block bg-purple-50 px-2 py-1 rounded text-xs font-bold text-purple-700">
                {bet.matchIndices.length}-Leg Parlay
              </span>
              <div className="text-[10px] text-gray-500">
                {bet.matchIndices.slice(0, 3).map((idx, i) => (
                  <span key={i} className="block">
                    M{idx}: {getOutcomeLabel(bet.outcomes[i])}
                  </span>
                ))}
                {bet.matchIndices.length > 3 && (
                  <span className="block text-gray-400">+{bet.matchIndices.length - 3} more</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stake */}
      <div className="col-span-4 md:col-span-2 text-center">
        <p className="font-mono text-sm font-bold text-gray-900">
          {stakeAmount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">LBT</p>
      </div>

      {/* Status / Action */}
      <div className="col-span-4 md:col-span-2 text-center">
        {showClaimButton ? (
          <button
            onClick={handleClaim}
            disabled={isConfirming}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              isConfirming
                ? "bg-gray-200 text-gray-500"
                : isSuccess
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md"
            )}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Claiming...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Claimed!
              </>
            ) : (
              <>
                <Trophy className="w-3 h-3 mr-1" />
                Claim
              </>
            )}
          </button>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(bet.status)}`}>
            {bet.status}
          </span>
        )}
        {bet.matchIndices.length > 1 && (
          <p className="text-[10px] text-purple-600 mt-1">
            {parlayMultiplier.toFixed(2)}x bonus
          </p>
        )}
      </div>

      {/* Payout */}
      <div className="col-span-4 md:col-span-1 text-right">
        <p className={cn(
          "font-mono text-sm font-bold",
          bet.status === 'won' || bet.status === 'claimed' ? 'text-green-600' : bet.status === 'lost' ? 'text-gray-400' : 'text-gray-900'
        )}>
          {bet.status === 'lost' ? '-' : potentialWinnings.toFixed(2)}
        </p>
        {bet.status !== 'lost' && (
          <p className="text-xs text-gray-500">LBT</p>
        )}
      </div>
    </motion.div>
  );
}

export default function MyBets() {
  const { address, isConnected } = useAccount();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bets/${address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bets');
      }

      const data = await response.json();
      setBets(data);
    } catch (err: any) {
      console.error('Error fetching bets:', err);
      setError(err.message || 'Failed to load bets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [address]);

  if (!isConnected) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-border shadow-sm"
        >
          <Ticket className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-500 text-center max-w-md">
            Please connect your wallet to view your betting history.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">My Bets</h1>
          <p className="text-muted-foreground">Track your betting history and claim winnings.</p>
        </div>
        {bets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-border shadow-sm"
          >
            <Ticket className="w-4 h-4 text-primary" />
            <span className="font-bold text-gray-900">{bets.length}</span> total bets
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 mb-2 font-semibold">Error loading bets</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchBets}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No bets yet</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Start placing bets on matches to see them appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Bet Details</div>
              <div className="col-span-2 text-center">Round</div>
              <div className="col-span-2 text-center">Selections</div>
              <div className="col-span-2 text-center">Stake</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Payout</div>
            </div>

            {/* Table Body */}
            <div>
              {bets.map((bet, index) => (
                <BetRow
                  key={bet.id}
                  bet={bet}
                  onClaimed={fetchBets}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
