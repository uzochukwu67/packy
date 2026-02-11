import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Trophy, Wallet, Droplet, CheckCircle, Loader2, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useLeagueBalance } from "@/hooks/contracts/useLeagueToken";
import { useFaucet } from "@/hooks/useFaucet";
import { useUserPoints } from "@/hooks/usePoints";
import { useState } from "react";
import { sepolia } from "wagmi/chains";

export function Sidebar() {
  const [location] = useLocation();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balanceFloat, refetch } = useLeagueBalance(address);
  const { requestTokens, isLoading, error } = useFaucet();
  const { data: userPoints } = useUserPoints(address);
  const [showSuccess, setShowSuccess] = useState(false);

  const navItems = [
    { label: "Betting Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Bets", icon: History, href: "/my-bets" },
    { label: "Round History", icon: Clock, href: "/history" },
    { label: "Season Predictor", icon: Trophy, href: "/season" },
    { label: "Leaderboard", icon: Award, href: "/leaderboard" },
  ];

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({ connector: injected(), chainId: sepolia.id });
    }
  };

  const handleFaucetClick = async () => {
    try {
      await requestTokens();
      setShowSuccess(true);
      refetch(); // Refresh balance after getting tokens
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-zinc-950 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <span className="text-black font-black text-sm">P</span>
          </div>
          <span className="font-bold tracking-tighter text-white text-xl">PHANTASMA</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 space-y-3">
        {/* Points Display */}
        {isConnected && userPoints && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Testnet Points</span>
              <Award className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {userPoints.totalPoints.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
              <span>{userPoints.betsPlaced} bets</span>
              <span>{userPoints.betsWon} won</span>
            </div>
          </div>
        )}

        {/* LBT Balance Display */}
        {isConnected && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Balance</span>
              <Droplet className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {balanceFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">LBT</div>
          </div>
        )}

        {/* Faucet Button */}
        {isConnected && (
          <button
            onClick={handleFaucetClick}
            disabled={isLoading || showSuccess}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors",
              showSuccess
                ? "bg-cyan-500 text-black"
                : "bg-white text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Requesting...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Tokens Sent!
              </>
            ) : (
              <>
                <Droplet className="w-4 h-4" />
                Get 1000 LBT
              </>
            )}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </div>
        )}

        {/* Wallet Connect/Disconnect */}
        <button
          onClick={handleWalletClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-cyan-400/50 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"
        >
          <Wallet className="w-4 h-4" />
          {isConnected ? (
            <span className="truncate max-w-[120px]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    </aside>
  );
}
