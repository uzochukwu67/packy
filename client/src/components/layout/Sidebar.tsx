import { Link, useLocation } from "wouter";
import { LayoutDashboard, Coins, History, Trophy, Wallet, Droplet, CheckCircle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { useLeagueBalance } from "@/hooks/contracts/useLeagueToken";
import { useFaucet } from "@/hooks/useFaucet";
import { useState } from "react";
import { sepolia } from "wagmi/chains";

export function Sidebar() {
  const [location] = useLocation();
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balanceFloat, formattedBalance, refetch } = useLeagueBalance(address);
  const { requestTokens, isLoading, error } = useFaucet();
  const [showSuccess, setShowSuccess] = useState(false);

  const navItems = [
    { label: "Betting Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Liquidity Pool", icon: Coins, href: "/liquidity" },
    { label: "My Bets", icon: History, href: "/my-bets" },
    { label: "Round History", icon: Clock, href: "/history" },
    { label: "Season Predictor", icon: Trophy, href: "/season" },
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
    <aside className="w-64 border-r border-border bg-secondary flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-xl">
            P
          </div>
          <span className="font-display font-bold text-2xl text-gray-900 tracking-tight">Phantasma</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn("nav-item cursor-pointer", isActive ? "nav-item-active" : "nav-item-inactive")}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-200 space-y-3">
        {/* LEAGUE Balance Display */}
        {isConnected && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</span>
              <Coins className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-gray-900 font-mono">
              {balanceFloat.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">LEAGUE</div>
          </div>
        )}

        {/* Faucet Button */}
        {isConnected && (
          <button
            onClick={handleFaucetClick}
            disabled={isLoading || showSuccess}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              showSuccess
                ? "bg-green-500 text-white border-green-500"
                : "bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                Get 1000 LEAGUE
              </>
            )}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </div>
        )}

        {/* Wallet Connect/Disconnect */}
        <button
          onClick={handleWalletClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary/50 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Wallet className="w-4 h-4 text-primary" />
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
