import { Link } from "wouter";
import { Trophy, Zap, Shield, Coins, Target, Clock, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                <span className="font-display font-bold text-3xl text-white">P</span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-6xl text-gray-900">
                Phantasma
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Decentralized Virtual Football Betting Platform
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Powered by <span className="font-semibold text-primary">BNB Chain</span> and{" "}
              <span className="font-semibold text-primary">Chainlink VRF</span> for provably fair match results
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/dashboard">
                <button className="group px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2">
                  Start Betting
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <a href="#how-to-play" className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-xl font-bold text-lg hover:bg-primary/5 transition-all">
                Learn How to Play
              </a>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Live on Testnet • Mainnet Launch: January 30th
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Why Choose Phantasma?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of sports betting with blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Provably Fair",
                description: "Chainlink VRF ensures truly random and verifiable match outcomes. Every result is transparent and on-chain.",
                color: "bg-blue-500",
              },
              {
                icon: Zap,
                title: "Fast & Efficient",
                description: "Built on BNB Chain for lightning-fast transactions with minimal fees. Bet and claim winnings instantly.",
                color: "bg-yellow-500",
              },
              {
                icon: Coins,
                title: "Decentralized Pools",
                description: "Community-driven liquidity pools ensure you always get paid. No central authority holds your funds.",
                color: "bg-green-500",
              },
              {
                icon: Trophy,
                title: "Season-Long Competition",
                description: "Compete across 36 rounds in a full virtual football season. Track your performance on the leaderboard.",
                color: "bg-purple-500",
              },
              {
                icon: Target,
                title: "Parlay Betting",
                description: "Combine multiple match predictions for exponentially higher payouts. Risk more, win more.",
                color: "bg-red-500",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Odds",
                description: "Dynamic odds based on team performance and betting patterns. Get the best value for your predictions.",
                color: "bg-indigo-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="py-20 bg-gradient-to-br from-primary/5 to-orange-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              How to Play
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just 4 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                description: "Connect your Web3 wallet (MetaMask, WalletConnect) to get started. Get free testnet tokens from the faucet.",
                icon: Shield,
              },
              {
                step: "2",
                title: "Choose Matches",
                description: "Browse 10 matches per round. View real-time odds for Home Win, Away Win, or Draw for each match.",
                icon: Target,
              },
              {
                step: "3",
                title: "Place Your Bet",
                description: "Select outcomes and add to your bet slip. Combine multiple matches for parlay bets with higher multipliers.",
                icon: Coins,
              },
              {
                step: "4",
                title: "Claim Winnings",
                description: "Wait 15 minutes for results. If you win, claim your payout instantly from the My Bets page.",
                icon: Trophy,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="mt-4">
                    <step.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Mechanics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Game Mechanics
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Understanding how Phantasma works
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Round System</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Each round lasts <strong>15 minutes</strong> for betting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>10 matches per round across 20 virtual teams</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Results generated using Chainlink VRF after betting closes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>New round starts <strong>10 minutes</strong> after previous round settles</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Betting Options</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Single Bet:</strong> Predict outcome of one match</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Parlay Bet:</strong> Combine 2+ matches for higher payouts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Each match has 3 outcomes: Home Win, Away Win, Draw</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>All predictions must be correct to win a parlay</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Odds & Payouts</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Odds calculated based on team strength and form</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Parlay multiplier increases with each added match</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Winnings = Stake × Odds × Parlay Multiplier</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Claim winnings anytime after round settles</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Season Play</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Full season consists of <strong>36 rounds</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Teams accumulate points like real football leagues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>View live standings and team statistics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>Predict season winner for bonus rewards</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-orange-500 to-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Start Winning?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join the decentralized sports betting revolution. Fair, transparent, and rewarding.
            </p>
            <Link href="/dashboard">
              <button className="group px-10 py-5 bg-white text-primary rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 flex items-center gap-3 mx-auto">
                Launch App
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="font-display font-bold text-xl text-white">P</span>
                </div>
                <span className="font-display font-bold text-xl">Phantasma</span>
              </div>
              <p className="text-gray-400">
                Decentralized virtual football betting powered by blockchain technology.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>BNB Chain</li>
                <li>Chainlink VRF</li>
                <li>Solidity Smart Contracts</li>
                <li>React & TypeScript</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/my-bets" className="hover:text-white transition-colors">My Bets</Link></li>
                <li><Link href="/season" className="hover:text-white transition-colors">Season</Link></li>
                <li><Link href="/liquidity" className="hover:text-white transition-colors">Liquidity</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 Phantasma. Built on BNB Chain with Chainlink VRF. All rights reserved.</p>
            <p className="mt-2">Testnet Version • Mainnet Launch: January 30th, 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
