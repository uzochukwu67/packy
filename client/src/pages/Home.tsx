import { Link } from "wouter";
import {
  Trophy, Zap, Shield, Target, Users2, ArrowRight, CheckCircle2,
  TrendingUp, Globe, Activity, BarChart3, Coins, PieChart,
  ChevronRight, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useProtocolReserves, useCurrentRound as useCurrentBettingRound } from "@/hooks/contracts/useBettingCore";
import { useCurrentSeasonData, useRoundMatches } from "@/hooks/contracts/useGameCore";
import { useSeasonPool } from "@/hooks/contracts/useSeasonPredictor";
import { formatToken } from "@/contracts/types";
import { MatchCard } from "@/components/ui/MatchCard";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  // Real-time protocol data
  const { data: reserves } = useProtocolReserves();
  const { data: season } = useCurrentSeasonData();
  const { data: bettingRound } = useCurrentBettingRound();
  const { data: seasonPool } = useSeasonPool(season?.seasonId);
  const { data: matches } = useRoundMatches(season?.currentRound);

  const activeMatches = matches?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-cyan-500/30 font-sans">
      {/* Navigation - Minimalist Institutional */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span className="text-black font-black text-lg tracking-tighter">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-white text-xl leading-none">PHANTASMA</span>
              <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mt-1">Betting Protocol</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors cursor-pointer">Markets</Link>
            <Link href="/season" className="hover:text-cyan-400 transition-colors cursor-pointer">Predictions</Link>
            <Link href="/referrals" className="hover:text-cyan-400 transition-colors cursor-pointer">Referrals</Link>
            <Link href="/leaderboard" className="hover:text-cyan-400 transition-colors cursor-pointer">Leaderboard</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <button className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 bg-white text-black rounded-full hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all duration-300">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - High Impact */}
      <section className="relative pt-48 pb-32 border-b border-white/5 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full delay-700 animate-pulse" />
          <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
            <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 mb-8 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">
                  LIVE ON BNB CHAIN TESTNET
                </span>
                <span className="w-px h-3 bg-white/10 mx-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/80">
                  Season {season?.seasonId.toString() || "1"} • Round {season?.currentRound.toString() || "1"}
                </span>
              </div>

              <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.85]">
                TRUST THE <br />
                <span className="text-zinc-700">PROTOCOL.</span>
              </h1>

              <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-xl leading-snug font-medium">
                The first institutional-grade liquidity layer for on-chain sports betting.
                Provably fair, protocol-backed, and permissionless.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <button className="group px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all duration-300">
                    Enter Arena <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/season">
                  <button className="px-10 py-5 bg-zinc-900 border border-white/5 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all duration-300">
                    Free Prediction
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Visual Teaser Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-5 hidden lg:block"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition duration-1000" />
                <div className="relative bg-zinc-900/40 border border-white/10 rounded-[32px] p-8 backdrop-blur-2xl shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <Activity className="text-cyan-500 w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Live Network</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-500">BNB_TESTNET_V3</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Season Prize Pool</span>
                        <div className="text-2xl font-mono font-bold text-white tabular-nums">
                          {seasonPool ? seasonPool : "1,500"} <span className="text-sm font-sans text-zinc-500 uppercase tracking-tighter">LBT</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Growth Bonus</span>
                        <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                          +5.0% <span className="text-sm font-sans text-zinc-500 uppercase tracking-tighter">APY</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Next Settlement</span>
                        <span className="text-[10px] font-mono font-black text-cyan-400 tracking-tighter">02:44:12</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: ["20%", "85%"] }}
                          transition={{ duration: 20, repeat: Infinity }}
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">+1,240 Active Bettors</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real-time Markets Section */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-500">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Markets</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter">THE ARENA.</h2>
            </div>
            <Link href="/dashboard">
              <button className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                View All Markets <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {activeMatches.length > 0 ? (
              activeMatches.map((match, idx) => (
                <MatchCard
                  key={idx}
                  roundId={season?.currentRound || 0n}
                  matchIndex={idx}
                  match={match}
                  startTime="Live Now"
                />
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-[32px] bg-zinc-900/50 border border-white/5 animate-pulse flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800" />
                  <div className="h-4 w-32 bg-zinc-800 rounded" />
                  <div className="h-2 w-24 bg-zinc-800 rounded opacity-50" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Product Pillars - Grid Style */}
      <section className="py-24 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-20 rotate-12">
          <PieChart className="w-96 h-96 text-cyan-500/20" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                label: "Trust Engine",
                title: "Chainlink Verified",
                desc: "All match results and odds are verified on-chain via decentralized oracles and VRF, ensuring cryptographic integrity.",
                color: "cyan"
              },
              {
                icon: Coins,
                label: "Ecosystem Growth",
                title: "Referral Engine",
                desc: "Invite teammates and earn 5% of all their bets in LBT rewards. Your network grows our protocol reserves automatically.",
                color: "white"
              },
              {
                icon: Globe,
                label: "Permissionless",
                title: "Non-Custodial",
                desc: "Connect your wallet and interact directly with the smart contracts. Your assets never leave your control until a bet is placed.",
                color: "zinc"
              }
            ].map((pillar, i) => (
              <div key={i} className="group relative p-10 rounded-3xl bg-zinc-900/20 border border-white/5 hover:border-cyan-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-500">
                    <pillar.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 group-hover:text-cyan-500/80 transition-colors">
                      {pillar.label}
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tighter mt-2">{pillar.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlighting - Split layout */}
      <section className="py-32 bg-zinc-950 overflow-hidden">

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-cyan-500/5 blur-[120px] rounded-full" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-md transform -rotate-3 hover:rotate-0 transition duration-500 shadow-2xl">
                    <Trophy className="w-8 h-8 text-cyan-500 mb-6" />
                    <h4 className="font-black text-white mb-2">SEASON {season?.seasonId.toString() || "1"}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">Predict the overall champion for massive bonus pools.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-md transform rotate-2 hover:rotate-0 transition duration-500 shadow-2xl">
                    <TrendingUp className="w-8 h-8 text-cyan-500 mb-6" />
                    <h4 className="font-black text-white mb-2">BONUS POINTS</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">Accumulate activity points for exclusive community status and airdrop tiers.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-8 rounded-3xl bg-white border border-white transform rotate-3 hover:rotate-0 transition duration-500 shadow-2xl group cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative z-10">
                      <Target className="w-8 h-8 text-black group-hover:text-white mb-6" />
                      <h4 className="font-black text-black group-hover:text-white mb-2 uppercase tracking-tighter text-xl">PARLAY ENGINE</h4>
                      <p className="text-[10px] text-zinc-500 group-hover:text-white/80 leading-relaxed font-bold">Combine up to 10 events with protocol bonuses.</p>
                    </div>
                  </div>
                  <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-md transform -rotate-2 hover:rotate-0 transition duration-500 shadow-2xl">
                    <Sparkles className="w-8 h-8 text-cyan-500 mb-6" />
                    <h4 className="font-black text-white mb-2">AIRDROPS</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">Early testnet participants earn guaranteed mainnet allocations.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-4">
              {/* Environment Badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg w-fit">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">BNB Chain Testnet v3.0</span>
              </div>

              {/* Top Row: Season Status */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cyan-500">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Economics</span>
                  </div>
                  <h2 className="text-6xl font-black text-white tracking-tighter leading-none">THE NEXT <br /> GENERATION.</h2>
                </div>

                <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                  Phantasma isn't just a betting site. It's an automated market maker for sports risks.
                  Built on BNB Chain for high throughput and low fees, our protocol enables a new
                  class of permissionless prediction markets.
                </p>

                <div className="grid grid-cols-2 gap-8">
                  {[
                    { label: "Protocol Fee", value: "2.5%" },
                    { label: "Winner Bounty", value: "1.0%" },
                    { label: "Max Leverage", value: "2.05x" },
                    { label: "Settlement", value: "T+0" },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{stat.label}</div>
                      <div className="text-2xl font-black text-white tracking-tighter">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <Link href="/season">
                  <button className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-white group">
                    <span className="w-12 h-[1px] bg-zinc-700 group-hover:w-20 group-hover:bg-cyan-500 transition-all duration-500" />
                    View Governance Roadmap
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social / Trust Bar */}
      <section className="py-20 border-t border-white/5 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-12 opacity-40">
          <span className="text-xl font-black tracking-tighter text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">BINANCE</span>
          <span className="text-xl font-black tracking-tighter text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">CHAINLINK</span>
          <span className="text-xl font-black tracking-tighter text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">OPENZEPPELIN</span>
          <span className="text-xl font-black tracking-tighter text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">METAMASK</span>
          <span className="text-xl font-black tracking-tighter text-zinc-500 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">WAGMI</span>
        </div>
      </section>

      {/* Footer - Professional Institutional */}
      <footer className="py-32 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-20">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white" />
                <span className="font-black tracking-tighter text-white text-2xl uppercase">PHANTASMA</span>
              </div>
              <p className="text-zinc-500 text-sm max-w-sm leading-relaxed font-medium">
                The institutional-grade liquidity layer for on-chain sports betting.
                Permissionless, transparent, and built for the next generation of predictive finance.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Users2 className="w-5 h-5 text-zinc-500" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h5 className="text-white font-black text-xs uppercase tracking-[.3em]">Protocol</h5>
              <ul className="text-zinc-500 text-xs font-black uppercase tracking-widest space-y-4">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Security Audits</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Status Network</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Bug Bounty</li>
              </ul>
            </div>

            <div className="space-y-8">
              <h5 className="text-white font-black text-xs uppercase tracking-[.3em]">Ecosystem</h5>
              <ul className="text-zinc-500 text-xs font-black uppercase tracking-widest space-y-4">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">LBT Token</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Grant Program</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Community</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Governance</li>
              </ul>
            </div>
          </div>

          <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">© 2026 PHANTASMA PROTOCOL LABS. NO RIGHTS RESERVED.</span>
            <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}