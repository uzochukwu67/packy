import { Coins, TrendingUp, ArrowUpRight, ArrowDownLeft, Lock, Loader2, CheckCircle2, AlertCircle, Percent, DollarSign, Activity, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import {
  useLiquidityPoolStats,
  useUserLPPosition,
  useAddLiquidity,
  useRemoveLiquidity,
  usePreviewDeposit,
  usePreviewWithdrawal,
  useLPProfitLoss,
  useMaxWithdrawableAmount,
  usePartialWithdrawal
} from "@/hooks/contracts/useLiquidityPool";
import { useLeagueBalance, useLeagueAllowanceForLP, useApproveLeagueForLP } from "@/hooks/contracts/useLeagueToken";
import { DEPLOYED_ADDRESSES } from "@/contracts/addresses";
import { formatToken, parseToken } from "@/contracts/types";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Liquidity() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [needsApproval, setNeedsApproval] = useState(false);

  // Fetch real contract data
  const {
    totalLiquidity,
    availableLiquidity,
    lockedLiquidity,
    utilizationRate,
    isLoading: statsLoading
  } = useLiquidityPoolStats();

  const {
    amount: userLPAmount,
    shares: userShares,
    percentage: userPercentage,
    isLoading: positionLoading
  } = useUserLPPosition(address);

  // V2.5 NEW: Profit/Loss tracking
  const { data: profitLoss } = useLPProfitLoss(address);
  const { data: maxWithdrawable } = useMaxWithdrawableAmount(address);

  const { balance: userBalance, formattedBalance } = useLeagueBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useLeagueAllowanceForLP(address);

  // Preview calculations
  const amountBigInt = amount ? parseToken(amount) : 0n;
  const { data: previewShares } = usePreviewDeposit(activeTab === 'deposit' ? amountBigInt : undefined);
  const sharesToWithdraw = activeTab === 'withdraw' && amount ? parseToken(amount) : undefined;
  const { data: previewAmount } = usePreviewWithdrawal(sharesToWithdraw);

  // Token approval
  const { approve, isConfirming: isApproving, isSuccess: approveSuccess, isPending: approvePending } = useApproveLeagueForLP();

  // Liquidity operations
  const { addLiquidity, isConfirming: isDepositing, isSuccess: depositSuccess } = useAddLiquidity();
  const { removeLiquidity, isConfirming: isWithdrawing, isSuccess: withdrawSuccess } = useRemoveLiquidity();
  const { partialWithdrawal, isConfirming: isPartialWithdrawing, isSuccess: partialWithdrawSuccess } = usePartialWithdrawal();

  // Calculate APY (simple estimate based on utilization)
  const estimatedAPY = utilizationRate ? (Number(utilizationRate) / 100) * 0.05 : 0; // 5% base * utilization

  // Extract P/L data (V2.5)
  const netDeposit = profitLoss ? (profitLoss as [bigint, bigint, bigint, bigint])[0] : 0n;
  const currentValue = profitLoss ? (profitLoss as [bigint, bigint, bigint, bigint])[1] : 0n;
  const unrealizedPL = profitLoss ? (profitLoss as [bigint, bigint, bigint, bigint])[2] : 0n;
  const realizedPL = profitLoss ? (profitLoss as [bigint, bigint, bigint, bigint])[3] : 0n;

  const maxWithdrawableAmount = maxWithdrawable ? (maxWithdrawable as [bigint, bigint])[0] : 0n;

  // Calculate total P/L percentage
  const totalPL = unrealizedPL + realizedPL;
  const plPercentage = netDeposit > 0n ? (Number(totalPL) / Number(netDeposit)) * 100 : 0;

  // Real Stats
  const stats = [
    {
      label: "Total Liquidity",
      value: statsLoading ? "..." : `${formatToken(totalLiquidity || 0n)} LEAGUE`,
      subValue: `Available: ${formatToken(availableLiquidity || 0n)}`,
      change: `${Number(utilizationRate || 0n) / 100}% Utilized`,
      icon: Lock
    },
    {
      label: "My Position",
      value: positionLoading ? "..." : `${formatToken(currentValue || userLPAmount || 0n)} LEAGUE`,
      subValue: userPercentage ? `${(Number(userPercentage) / 100).toFixed(2)}% of pool` : "0% of pool",
      change: userShares ? `${formatToken(userShares)} shares` : "No position",
      icon: Coins
    },
    {
      label: "Profit/Loss",
      value: positionLoading ? "..." : `${Number(totalPL) >= 0 ? '+' : ''}${formatToken(totalPL)} LEAGUE`,
      subValue: `Unrealized: ${Number(unrealizedPL) >= 0 ? '+' : ''}${formatToken(unrealizedPL)}`,
      change: `${plPercentage >= 0 ? '+' : ''}${plPercentage.toFixed(2)}%`,
      icon: plPercentage >= 0 ? TrendingUp : Activity,
      isProfit: plPercentage >= 0
    },
  ];

  // Check if approval is needed
  useEffect(() => {
    if (activeTab === 'deposit' && amount && allowance !== undefined) {
      const amountInWei = parseToken(amount);
      setNeedsApproval(allowance < amountInWei);
    }
  }, [amount, allowance, activeTab]);

  // Refetch after approval
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      toast({
        title: "Approval Successful! ✓",
        description: "You can now deposit liquidity.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    }
  }, [approveSuccess, refetchAllowance, toast]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess) {
      toast({
        title: "Liquidity Added! 🎉",
        description: `Successfully deposited ${amount} LEAGUE tokens.`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
      setAmount('');
    }
  }, [depositSuccess, amount, toast]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess || partialWithdrawSuccess) {
      toast({
        title: "Liquidity Withdrawn! 💰",
        description: `Successfully withdrew ${amount} LEAGUE tokens.`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
      setAmount('');
    }
  }, [withdrawSuccess, partialWithdrawSuccess, amount, toast]);

  const handleApprove = async () => {
    if (!amount) return;
    try {
      const amountInWei = parseToken(amount);
      // Approve 10x to avoid multiple approvals
      await approve(amountInWei * 10n);
    } catch (err: any) {
      console.error("Approval failed:", err);
      toast({
        title: "Approval Failed",
        description: err.message || "Failed to approve tokens.",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = async () => {
    if (!amount || !isConnected) return;
    try {
      const amountInWei = parseToken(amount);
      await addLiquidity(amountInWei);
    } catch (err: any) {
      console.error("Deposit failed:", err);
      toast({
        title: "Deposit Failed",
        description: err.message || "Failed to deposit liquidity.",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !isConnected) return;
    try {
      const amountInWei = parseToken(amount);
      // V2.5: Use partial withdrawal for specific amounts
      await partialWithdrawal(amountInWei);
    } catch (err: any) {
      console.error("Withdrawal failed:", err);
      toast({
        title: "Withdrawal Failed",
        description: err.message || "Failed to withdraw liquidity.",
        variant: "destructive",
      });
    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'deposit' && userBalance) {
      setAmount(formatToken(userBalance));
    } else if (activeTab === 'withdraw' && maxWithdrawableAmount) {
      // V2.5: Use max withdrawable amount (considers locked liquidity)
      setAmount(formatToken(maxWithdrawableAmount));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Liquidity Pool</h1>
        <p className="text-zinc-500 font-medium">Provide liquidity to the house bankroll and earn share of profits.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900 p-6 rounded-2xl border border-white/5 shadow-sm hover:shadow-cyan-500/5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-xl",
                'isProfit' in stat && stat.isProfit === false
                  ? "bg-red-500/10 text-red-500"
                  : "bg-cyan-500/10 text-cyan-500"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest",
                'isProfit' in stat && stat.isProfit === false
                  ? "bg-red-500/10 text-red-500"
                  : "bg-cyan-500/10 text-cyan-500"
              )}>{stat.change}</span>
            </div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-display font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
            {stat.subValue && (
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{stat.subValue}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Interaction Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Action Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/20"
        >
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('deposit')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all duration-300 relative",
                activeTab === 'deposit' ? "text-primary bg-primary/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="relative z-10">Deposit Liquidity</span>
              {activeTab === 'deposit' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all duration-300 relative",
                activeTab === 'withdraw' ? "text-primary bg-primary/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className="relative z-10">Withdraw Liquidity</span>
              {activeTab === 'withdraw' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700">
                  {activeTab === 'deposit' ? 'Deposit Amount (LEAGUE)' : 'Withdraw Amount (LEAGUE)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isDepositing || isWithdrawing || approvePending || isApproving}
                    className="w-full px-4 py-4 bg-zinc-950 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-lg text-white disabled:opacity-50"
                  />
                  <button
                    onClick={setMaxAmount}
                    disabled={isDepositing || isWithdrawing || approvePending || isApproving}
                    className="absolute right-3 top-3 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {activeTab === 'deposit'
                      ? `Balance: ${formattedBalance} LEAGUE`
                      : `Max Withdrawable: ${formatToken(maxWithdrawableAmount)} LEAGUE`
                    }
                  </span>
                  {activeTab === 'deposit' && amount && previewShares && (
                    <span className="text-primary font-semibold">
                      ≈ {formatToken(previewShares)} shares
                    </span>
                  )}
                  {activeTab === 'withdraw' && userLPAmount && maxWithdrawableAmount < userLPAmount && (
                    <span className="text-orange-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {formatToken(userLPAmount - maxWithdrawableAmount)} locked
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <AnimatePresence mode="wait">
              {activeTab === 'deposit' && needsApproval ? (
                <motion.button
                  key="approve"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleApprove}
                  disabled={!isConnected || !amount || approvePending || isApproving}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-white shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    approvePending || isApproving ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
                  )}
                >
                  {approvePending || isApproving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {approvePending ? "Approving..." : "Confirming..."}
                    </>
                  ) : (
                    "Approve LEAGUE"
                  )}
                </motion.button>
              ) : (
                <motion.button
                  key="action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                  disabled={
                    !isConnected ||
                    !amount ||
                    isDepositing ||
                    isWithdrawing ||
                    isPartialWithdrawing ||
                    (activeTab === 'withdraw' && !userLPAmount)
                  }
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-white shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    isDepositing || isWithdrawing || isPartialWithdrawing
                      ? "bg-gray-400"
                      : depositSuccess || withdrawSuccess || partialWithdrawSuccess
                        ? "bg-green-500"
                        : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {isDepositing || isWithdrawing || isPartialWithdrawing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : depositSuccess || withdrawSuccess || partialWithdrawSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Success!
                    </>
                  ) : (
                    <>
                      {activeTab === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      {activeTab === 'deposit' ? "Add Liquidity" : "Withdraw Liquidity"}
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Status Messages */}
            {(isDepositing || isWithdrawing || approvePending || isApproving) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-center text-gray-500"
              >
                {approvePending || isApproving ? "Approving token spending..." : "Transaction in progress..."}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right: Info / History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 md:p-8 border border-border/50 shadow-sm"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <Percent className="w-5 h-5 text-cyan-400" />
            How it works
          </h3>
          <ul className="space-y-4 mb-8">
            {[
              "Deposit LEAGUE tokens into the shared liquidity pool used to pay out winning bets.",
              "Earn a share of the house edge (5% protocol fee) on every bet placed.",
              "Withdraw your initial deposit plus accumulated rewards at any time (0.5% exit fee)."
            ].map((text, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0 text-[10px] font-black">
                  {i + 1}
                </div>
                <p className="text-sm text-zinc-400 font-medium">{text}</p>
              </motion.li>
            ))}
          </ul>

          {/* V2.5 Position Stats */}
          {isConnected && userLPAmount && userLPAmount > 0n && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Your LP Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Net Deposited:</span>
                  <span className="font-mono font-semibold text-blue-900">{formatToken(netDeposit)} LEAGUE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Current Value:</span>
                  <span className="font-mono font-semibold text-blue-900">{formatToken(currentValue)} LEAGUE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Unrealized P/L:</span>
                  <span className={cn(
                    "font-mono font-semibold",
                    Number(unrealizedPL) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {Number(unrealizedPL) >= 0 ? '+' : ''}{formatToken(unrealizedPL)} LEAGUE
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Realized P/L:</span>
                  <span className={cn(
                    "font-mono font-semibold",
                    Number(realizedPL) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {Number(realizedPL) >= 0 ? '+' : ''}{formatToken(realizedPL)} LEAGUE
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pool Stats */}
          <div className="bg-zinc-950/50 border border-white/5 rounded-xl p-6 mb-4">
            <h4 className="font-bold text-gray-900 text-sm mb-3">Pool Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Locked Liquidity:</span>
                <span className="font-mono font-semibold">{formatToken(lockedLiquidity || 0n)} LEAGUE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Utilization:</span>
                <span className="font-mono font-semibold">{(Number(utilizationRate || 0n) / 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Withdrawal Fee:</span>
                <span className="font-mono font-semibold">0.5%</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <h4 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Risk Warning
            </h4>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Liquidity providers act as the counterparty to bettors. While the house has a statistical edge, short-term variance can result in temporary losses to the pool.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
