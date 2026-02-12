import { useLeaderboard } from "@/hooks/usePoints";
import { Trophy, Award, Medal, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading, isError } = useLeaderboard(100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !leaderboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">Failed to load leaderboard</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-br from-amber-500 to-amber-700 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 shadow-lg">
            <TrendingUp className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white tracking-tight">Testnet Leaderboard</h1>
            <p className="text-zinc-500 font-medium font-body uppercase tracking-[0.2em] text-[10px]">Top players competing for mainnet rewards</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 mb-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <Award className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-sm">
            <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">Earn Points During Testnet!</p>
            <p className="text-zinc-400 leading-relaxed font-medium">
              Get <span className="text-cyan-400 font-black">1 point</span> per bet placed and <span className="text-cyan-400 font-black">10 points</span> per bet won.
              Top players will receive exclusive rewards when we launch on mainnet!
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-600" />
              <div className="flex justify-center mb-3">
                <Medal className="w-12 h-12 text-gray-400" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1">2nd</div>
                <div className="text-xs text-gray-600 mb-2 truncate" title={leaderboard[1].walletAddress}>
                  {leaderboard[1].walletAddress.slice(0, 6)}...{leaderboard[1].walletAddress.slice(-4)}
                </div>
                <div className="text-3xl font-black text-white mb-1">
                  {leaderboard[1].totalPoints.toLocaleString()}
                </div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">points</div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <span>{leaderboard[1].betsPlaced} bets</span>
                  <span>{leaderboard[1].betsWon} won</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 border-2 border-yellow-500 shadow-2xl -mt-4">
              <div className="flex justify-center mb-3">
                <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
              <div className="text-center text-white">
                <div className="text-3xl font-bold mb-1">1st</div>
                <div className="text-xs text-yellow-100 mb-2 truncate" title={leaderboard[0].walletAddress}>
                  {leaderboard[0].walletAddress.slice(0, 6)}...{leaderboard[0].walletAddress.slice(-4)}
                </div>
                <div className="text-4xl font-bold mb-1">
                  {leaderboard[0].totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-100">points</div>
                <div className="mt-3 pt-3 border-t border-yellow-500 flex justify-between text-xs">
                  <span>{leaderboard[0].betsPlaced} bets</span>
                  <span>{leaderboard[0].betsWon} won</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-6 border-2 border-amber-400 shadow-lg">
              <div className="flex justify-center mb-3">
                <Medal className="w-12 h-12 text-amber-600" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 mb-1">3rd</div>
                <div className="text-xs text-amber-700 mb-2 truncate" title={leaderboard[2].walletAddress}>
                  {leaderboard[2].walletAddress.slice(0, 6)}...{leaderboard[2].walletAddress.slice(-4)}
                </div>
                <div className="text-3xl font-bold text-amber-900 mb-1">
                  {leaderboard[2].totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-amber-700">points</div>
                <div className="mt-3 pt-3 border-t border-amber-300 flex justify-between text-xs text-amber-700">
                  <span>{leaderboard[2].betsPlaced} bets</span>
                  <span>{leaderboard[2].betsWon} won</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-zinc-900 rounded-2xl shadow-xl shadow-black/20 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bets Placed
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bets Won
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                const winRate = player.betsPlaced > 0
                  ? ((player.betsWon / player.betsPlaced) * 100).toFixed(1)
                  : '0.0';

                return (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRankIcon(rank)}
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
                          ${getRankBadgeColor(rank)}
                        `}>
                          {rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {player.walletAddress.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="font-mono text-sm text-gray-900" title={player.walletAddress}>
                          {player.walletAddress.slice(0, 8)}...{player.walletAddress.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-lg text-gray-900">
                          {player.totalPoints.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {player.betsPlaced.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {player.betsWon.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${parseFloat(winRate) >= 50
                          ? 'bg-green-100 text-green-800'
                          : parseFloat(winRate) >= 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      `}>
                        {winRate}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No players yet. Be the first to earn points!</p>
          </div>
        )}
      </div>
    </div>
  );
}
