import { useBetSlip } from "@/context/BetSlipContext";
import { cn } from "@/lib/utils";
import { Users, Loader2 } from "lucide-react";
import { useLockedOdds, formatOdds as formatOddsStr } from "@/hooks/contracts/useBettingCore";
import { useMatchWithTeams } from "@/hooks/contracts/useGameCore";
import { formatOdds as formatOddsNum } from "@/contracts/types";
import type { Match } from "@/hooks/contracts/useGameCore";

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
  const { data: oddsData, isLoading: oddsLoading, error: oddsError } = useLockedOdds(roundId, matchIndex);

  const isLoading = matchLoading || oddsLoading;


  // Parse odds from contract (returns LockedOdds object)
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

  // Use matchData if available, otherwise fallback to props
  const currentMatch = matchData || match;
  const isSettled = currentMatch?.settled;

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Premier League
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{startTime}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Teams */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-lg">{teamA}</span>
            </div>
            {isSettled && (
              <span className="text-2xl font-bold text-primary">{currentMatch.homeScore}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-lg">{teamB}</span>
            </div>
            {isSettled && (
              <span className="text-2xl font-bold text-primary">{currentMatch.awayScore}</span>
            )}
          </div>
        </div>

        {/* Odds Buttons */}
        <div className="md:col-span-7 grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSelect("Home", homeOdds, 1)}
            disabled={oddsLoading || match.settled || bettingDisabled}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
              isSelected("Home")
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-white",
              (oddsLoading || match.settled || bettingDisabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("text-xs mb-1", isSelected("Home") ? "text-white/80" : "text-gray-400")}>1</span>
            {oddsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-bold font-mono text-lg">{homeOdds.toFixed(2)}</span>
            )}
          </button>

          <button
            onClick={() => handleSelect("Draw", drawOdds, 3)}
            disabled={oddsLoading || match.settled || bettingDisabled}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
              isSelected("Draw")
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-white",
              (oddsLoading || match.settled || bettingDisabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("text-xs mb-1", isSelected("Draw") ? "text-white/80" : "text-gray-400")}>X</span>
            {oddsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-bold font-mono text-lg">{drawOdds.toFixed(2)}</span>
            )}
          </button>

          <button
            onClick={() => handleSelect("Away", awayOdds, 2)}
            disabled={isLoading || isSettled || bettingDisabled}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
              isSelected("Away")
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-white",
              (isLoading || isSettled || bettingDisabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("text-xs mb-1", isSelected("Away") ? "text-white/80" : "text-gray-400")}>2</span>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-bold font-mono text-lg">{awayOdds.toFixed(2)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
