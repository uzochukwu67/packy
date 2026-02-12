import { useBetSlip } from "@/context/BetSlipContext";
import { cn } from "@/lib/utils";
import { Users, Loader2, Trophy } from "lucide-react";
import { useLockedOdds } from "@/hooks/contracts/useBettingCore";
import { useMatchWithTeams } from "@/hooks/contracts/useGameCore";
import { formatOdds as formatOddsNum } from "@/contracts/types";
import type { Match } from "@/hooks/contracts/useGameCore";
import { motion } from "framer-motion";

interface MatchCardProps {
  roundId: bigint;
  matchIndex: number;
  match: Match;
  startTime: string;
  bettingDisabled?: boolean;
}

export function MatchCard({ roundId, matchIndex, match, startTime, bettingDisabled = false }: MatchCardProps) {
  const { addBet, bets } = useBetSlip();

  // Fetch match, teams, and status from GameCore
  const { match: matchData, homeTeam, awayTeam, isLoading: matchLoading } = useMatchWithTeams(roundId, matchIndex);

  // Fetch locked odds from BettingCore
  const { data: oddsData, isLoading: oddsLoading } = useLockedOdds(roundId, matchIndex);

  const isLoading = matchLoading || oddsLoading;

  // Parse odds from contract
  const homeOdds = formatOddsNum(oddsData?.homeOdds || BigInt(0));
  const awayOdds = formatOddsNum(oddsData?.awayOdds || BigInt(0));
  const drawOdds = formatOddsNum(oddsData?.drawOdds || BigInt(0));

  const matchId = `${roundId}-${matchIndex}`;
  const teamA = homeTeam?.name || `Team ${match.homeTeamId}`;
  const teamB = awayTeam?.name || `Team ${match.awayTeamId}`;

  const isSelected = (selection: string) => {
    return bets.some(b => b.matchId === matchId && b.selection === selection);
  };

  const handleSelect = (selection: string, odds: number, outcome: 1 | 2 | 3) => {
    if (bettingDisabled || isSettled) return;
    addBet({
      id: `${matchId}-${selection}`,
      matchId,
      matchIndex,
      matchTitle: `${teamA} vs ${teamB}`,
      selection,
      outcome,
      odds,
    });
  };

  const currentMatch = matchData || match;
  const isSettled = currentMatch?.settled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group mb-6"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-zinc-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {/* Header Ribbon */}
        <div className="flex justify-between items-center px-5 py-2.5 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]",
              isSettled ? "bg-zinc-600" : "bg-cyan-500 animate-pulse"
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              {isSettled ? "Recorded" : "Match Live"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-cyan-500/50" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Premier League
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/5" />
            <span className="text-[10px] font-mono font-black text-cyan-500 tabular-nums">
              {startTime}
            </span>
          </div>
        </div>

        <div className="p-8 pb-6">
          {/* Teams Horizontal Layout */}
          <div className="flex items-center justify-between mb-10 relative">
            {/* Team A - Left side */}
            <div className="flex-1 flex flex-col items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-white/5 flex items-center justify-center text-zinc-600 group-hover:border-cyan-500/20 transition-all duration-500 overflow-hidden shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-display font-black text-white tracking-tighter leading-tight max-w-[150px]">{teamA}</span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Home Team</span>
              </div>
            </div>

            {/* Center VS / Score */}
            <div className="px-6 flex flex-col items-center justify-center min-w-[120px]">
              {isSettled ? (
                <div className="flex items-center gap-6">
                  <span className="text-5xl font-mono font-black text-cyan-400 tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">{currentMatch.homeScore}</span>
                  <div className="w-[2px] h-10 bg-white/10 rounded-full" />
                  <span className="text-5xl font-mono font-black text-cyan-400 tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">{currentMatch.awayScore}</span>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-full scale-150" />
                  <div className="relative border border-white/5 bg-zinc-800/80 px-6 py-2 rounded-full backdrop-blur-lg shadow-2xl">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.4em]">VS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Team B - Right side */}
            <div className="flex-1 flex flex-col items-end gap-4 text-right">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-white/5 flex items-center justify-center text-zinc-600 group-hover:border-cyan-500/20 transition-all duration-500 shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl md:text-2xl font-display font-black text-white tracking-tighter leading-tight max-w-[150px]">{teamB}</span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Away Team</span>
              </div>
            </div>
          </div>

          {/* Betting Section */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Home", sub: "1", selection: "Home", odds: homeOdds, outcome: 1 },
              { label: "Draw", sub: "X", selection: "Draw", odds: drawOdds, outcome: 3 },
              { label: "Away", sub: "2", selection: "Away", odds: awayOdds, outcome: 2 }
            ].map((option) => {
              const active = isSelected(option.selection);
              return (
                <button
                  key={option.selection}
                  onClick={() => handleSelect(option.selection, option.odds, option.outcome as any)}
                  disabled={isLoading || isSettled || bettingDisabled}
                  className={cn(
                    "group/btn relative flex flex-col items-center justify-center py-5 px-4 rounded-2xl border transition-all duration-300 overflow-hidden",
                    active
                      ? "bg-white border-white scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                      : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:border-cyan-500/40 hover:bg-zinc-800/80",
                    (isLoading || isSettled || bettingDisabled) && "opacity-40 cursor-not-allowed grayscale pointer-events-none"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                      active ? "text-zinc-500" : "text-zinc-600"
                    )}>
                      {option.label}
                    </span>
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      active ? "bg-cyan-500" : "bg-zinc-700"
                    )} />
                  </div>

                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                  ) : (
                    <span className={cn(
                      "text-2xl font-mono font-black tracking-tighter tabular-nums",
                      active ? "text-black" : "text-white group-hover/btn:text-cyan-400 transition-colors"
                    )}>
                      {option.odds.toFixed(2)}
                    </span>
                  )}

                  {active && (
                    <motion.div
                      layoutId={`active-indicator-${matchId}`}
                      className="absolute inset-x-0 bottom-0 h-1.5 bg-cyan-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Animation */}
        {!isSettled && (
          <div className="h-[2px] w-full bg-white/5 overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="h-full w-24 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
