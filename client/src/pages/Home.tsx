import { Link } from "wouter";
import { Trophy, Zap, Shield, Coins, Target, Users2, Gift, Rocket, ArrowRight, CheckCircle2, TrendingUp, Award, Sparkles, Globe, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-cyan-500/30">
      {/* Navigation - Minimalist */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <span className="text-black font-black text-sm">P</span>
            </div>
            <span className="font-bold tracking-tighter text-white text-xl">PHANTASMA</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Protocol</Link>
            <Link href="/season" className="hover:text-white transition-colors">Governance</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Analytics</Link>
          </div>
          <Link href="/dashboard">
            <button className="text-xs font-bold uppercase tracking-widest px-5 py-2 bg-white text-black rounded-full hover:bg-cyan-400 transition-colors">
              Launch App
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 border-b border-white/5 overflow-hidden">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
          <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">v1.0 Early Access Live</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8">
              The Liquidity Layer for <br />
              <span className="text-zinc-500">On-chain Sports.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
              Decentralized betting protocol featuring automated market makers, 
              Chainlink-verified outcomes, and protocol-backed reserves.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <button className="px-8 py-4 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button className="px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
                Read Whitepaper
              </button>
            </div>
          </motion.div>

          {/* Institutional Stats bar */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-white/5">
            {[
              { label: "Protocol Reserves", value: "100K LBT" },
              { label: "Odds Range", value: "1.25x - 2.05x" },
              { label: "Round Duration", value: "3 Hours" },
              { label: "Settlement", value: "Instant" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features - Grid Style */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-500 mb-4">Protocol Infrastructure</h2>
              <h3 className="text-4xl font-bold text-white tracking-tight">Built for Resilience.</h3>
            </div>
            <p className="text-zinc-500 max-w-md">
              Our smart contracts are audited and built on the foundation of transparency, 
              ensuring every bet is settled with mathematical certainty.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {[
              { icon: Shield, title: "Provably Fair", desc: "Match outcomes verified via Chainlink VRF for cryptographic randomness." },
              { icon: Zap, title: "Protocol-Backed", desc: "Zero counterparty risk. All payouts guaranteed by protocol reserves." },
              { icon: TrendingUp, title: "Dynamic Odds", desc: "Compressed odds range [1.25x - 2.05x] with algorithmic market adjustment." },
              { icon: Target, title: "Parlay Engine", desc: "Multi-leg betting with on-chain settlement and compound payouts." },
              { icon: Activity, title: "Low Latency", desc: "Built on BNB Chain for near-instant transaction finality." },
              { icon: Globe, title: "Permissionless", desc: "Non-custodial architecture. Your wallet, your funds, always." },
            ].map((f, i) => (
              <div key={i} className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors group">
                <f.icon className="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 transition-colors mb-6" />
                <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral / Airdrop Section - High Contrast */}
      <section className="py-24 border-t border-white/5 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white tracking-tight mb-6">
                Expand the Ecosystem. <br />
                <span className="text-cyan-400">Claim Your Share.</span>
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Phantasma is community-driven. Participate in early access, refer friends, and earn
                protocol rewards. All testnet participants qualify for the mainnet token airdrop.
              </p>
              <div className="space-y-4">
                {[
                  "Earn 5% of referee bet amounts (max 50 LBT per bet)",
                  "Referees receive 100 LBT bonus on first bet",
                  "Early testnet users receive mainnet airdrop",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl rounded-full" />
              <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Referral Yield</div>
                    <div className="text-3xl font-bold text-white">5.00%</div>
                  </div>
                  <Users2 className="w-6 h-6 text-zinc-600" />
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
                  <div className="h-full w-2/3 bg-cyan-500" />
                </div>
                <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors">
                  Generate Invite Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-white" />
              <span className="font-bold tracking-tighter text-white">PHANTASMA</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
              Protocol-backed decentralized sports betting with Chainlink verification.
              Permissionless, transparent, and built for the next generation of on-chain prediction markets.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm">Protocol</h5>
            <ul className="text-zinc-500 text-sm space-y-2">
              <li className="hover:text-cyan-400 cursor-pointer">Documentation</li>
              <li className="hover:text-cyan-400 cursor-pointer">Security Audits</li>
              <li className="hover:text-cyan-400 cursor-pointer">Governance</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 text-sm">Connect</h5>
            <ul className="text-zinc-500 text-sm space-y-2">
              <li className="hover:text-cyan-400 cursor-pointer">X / Twitter</li>
              <li className="hover:text-cyan-400 cursor-pointer">Discord</li>
              <li className="hover:text-cyan-400 cursor-pointer">GitHub</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}