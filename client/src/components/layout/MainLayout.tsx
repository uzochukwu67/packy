import { Sidebar } from "./Sidebar";
import { BetSlip } from "./BetSlip";
import { Menu, Zap, Shield, Calendar, Info, Award, Droplet, CheckCircle, Loader2, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Coins, History, Trophy } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useAccount } from "wagmi";
import { useLeagueBalance } from "@/hooks/contracts/useLeagueToken";
import { useFaucet } from "@/hooks/useFaucet";
import { useUserPoints } from "@/hooks/usePoints";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);

  const { address, isConnected } = useAccount();

  const { balanceFloat, refetch } = useLeagueBalance(address);
  const { requestTokens, isLoading, error } = useFaucet();
  const { data: userPoints } = useUserPoints(address);

  const navItems = [
    { label: "Betting Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Bets", icon: History, href: "/my-bets" },
    { label: "Season Predictor", icon: Trophy, href: "/season" },
    { label: "Leaderboard", icon: Award, href: "/leaderboard" },
  ];

  const handleFaucetClick = async () => {
    try {
      await requestTokens();
      setShowSuccess(true);
      refetch();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-black font-black font-display text-sm">P</div>
          <span className="font-display font-bold text-xl text-white">PHANTASMA</span>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger>
            <Menu className="w-6 h-6 text-gray-600" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] p-0 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-black font-black font-display text-sm">P</div>
                <span className="font-display font-bold text-2xl text-white">PHANTASMA</span>
              </div>
              <nav className="space-y-1 mb-6">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn("nav-item cursor-pointer", isActive ? "nav-item-active" : "nav-item-inactive")}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Wallet Section */}
            <div className="p-6 border-t border-white/5 space-y-3">
              {/* Points Display */}
              {isConnected && address && userPoints && (
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
              {isConnected && address && (
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
              {isConnected && address && (
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

              {/* Wallet Connect Button */}
              <WalletButton />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:min-w-0 pt-16 md:pt-0 overflow-y-auto h-screen scrollbar-hide">
        {/* Announcement Banner */}
        {/* <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 border-b-4 border-orange-600 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-white text-lg">Platform Update</span>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-white">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">BNB Chain</span>
                </div>

                <div className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />

                <div className="flex items-center gap-1.5 text-white">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Chainlink VRF</span>
                  <span className="text-white/90 text-xs">for score generation</span>
                </div>

                <div className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />

                <div className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">Testnet Live</span>
                  <span className="text-white/90 text-xs">• Mainnet: Jan 30th</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Right Sidebar (Bet Slip) */}
      <BetSlip />
    </div>
  );
}
