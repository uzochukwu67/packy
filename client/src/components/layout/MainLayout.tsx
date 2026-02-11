import { Sidebar } from "./Sidebar";
import { BetSlip } from "./BetSlip";
import { Menu, Zap, Shield, Calendar, Info, Award } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Coins, History, Trophy } from "lucide-react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { label: "Betting Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Liquidity Pool", icon: Coins, href: "/liquidity" },
    { label: "My Bets", icon: History, href: "/my-bets" },
    { label: "Season Predictor", icon: Trophy, href: "/season" },
    { label: "Leaderboard", icon: Award, href: "/leaderboard" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-lg">P</div>
          <span className="font-display font-bold text-xl text-gray-900">Phantasma</span>
        </div>
        
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger>
            <Menu className="w-6 h-6 text-gray-600" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] p-0">
             <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-xl">P</div>
                  <span className="font-display font-bold text-2xl text-gray-900">Phantasma</span>
                </div>
                <nav className="space-y-1">
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
