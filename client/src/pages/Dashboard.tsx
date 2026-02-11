import { MatchCard } from "@/components/ui/MatchCard";
import { Loader2, AlertCircle, RefreshCw, Trophy, Target, Clock } from "lucide-react";
import { useCurrentSeason, useCurrentRound, useCurrentSeasonData, useRoundMatches } from "@/hooks/contracts/useGameCore";
import { useGameState } from "@/hooks/useGameState";
import type { Match } from "@/hooks/contracts/useGameCore";
import { useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { useCurrentRound as useBettingRound, useRoundInfo, formatLBT } from "@/hooks/contracts/useBettingCore";

export default function Dashboard() {
  // Fetch real-time blockchain data
  const chainId = useChainId();

  // GameCore hooks
  const { data: seasonId, refetch: refetchSeason } = useCurrentSeason();
  const { data: gameRoundId, refetch: refetchRoundId } = useCurrentRound();
  const { data: season, isLoading: seasonLoading } = useCurrentSeasonData();

  // BettingCore hooks (pool stats & metadata for countdown)
  const { data: bettingRoundId, refetch: refetchBettingRound } = useBettingRound();

  // Use BettingCore's round ID as primary, fallback to GameCore
  const roundId = bettingRoundId !== undefined ? bettingRoundId : gameRoundId;

  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches } = useRoundMatches(roundId as bigint | undefined);
  const { pool, metadata, isLoading: bettingLoading } = useRoundInfo(roundId as bigint | undefined);

  const { data: gameState } = useGameState();

  const isLoading = seasonLoading || matchesLoading || bettingLoading;
  const isError = roundId === undefined; // Basic error state if no roundId is found at all
  const isSettled = metadata?.settled; // Using BettingCore settlement status


  const refetchGame = () => {
    refetchSeason();
    refetchRoundId();
    refetchBettingRound();
    refetchMatches();
  };

  // Local state for countdown timers
  const [nextRoundCountdown, setNextRoundCountdown] = useState<string>('');
  const [bettingCountdown, setBettingCountdown] = useState<string>('');
  const [isBettingActive, setIsBettingActive] = useState<boolean>(true);


  // Calculate betting period status based on round start time
  useEffect(() => {

    if (!metadata?.roundStartTime) {
      setBettingCountdown('');
      setIsBettingActive(true);
      return;
    }

    const roundStartTimeStr = metadata.roundStartTime.toString();
    const roundEndTimeStr = metadata.roundEndTime.toString();

    const roundStartTime = Number(roundStartTimeStr) * 1000;
    const roundEndTime = Number(roundEndTimeStr) * 1000;

    const updateBettingStatus = () => {
      const now = Date.now();
      const timeRemaining = roundEndTime - now;

      if (timeRemaining > 0) {
        setIsBettingActive(true);
        const totalSeconds = Math.floor(timeRemaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setBettingCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setIsBettingActive(false);
        setBettingCountdown('Betting Closed');
      }
    };

    updateBettingStatus();
    const interval = setInterval(updateBettingStatus, 1000);
    return () => clearInterval(interval);
  }, [metadata?.roundStartTime, metadata?.roundEndTime]);

  // Update next round countdown
  useEffect(() => {
    console.log(gameState);
    if (!gameState?.timeUntilNextRound) {
      setNextRoundCountdown('');
      return;
    }

    const updateCountdown = () => {
      const ms = gameState.timeUntilNextRound || 0;
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (totalSeconds > 0) {
        setNextRoundCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setNextRoundCountdown('Starting soon...');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [gameState?.timeUntilNextRound]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading matches from blockchain...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || roundId === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Matches</h3>
          <p className="text-gray-600 mb-4">
            {roundId === undefined
              ? "No active round found. Please wait for the admin to start a new round."
              : "There was an error connecting to the blockchain. Please check your wallet connection."
            }
          </p>
          <button
            onClick={() => refetchGame()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {chainId}
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Season & Round Info Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
        <div className="flex flex-col gap-4">
          {/* Top Row: Season Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">
                {season?.completed
                  ? `Season ${seasonId?.toString()} - Completed`
                  : season?.active
                    ? `Season ${seasonId?.toString()} - Active`
                    : 'No Active Season on '}
              </h2>
            </div>
            {season?.active && (
              <span className="text-xs font-medium text-gray-500">
                Round {season.currentRound?.toString()} of 36
              </span>
            )}
          </div>

          {/* Bottom Row: Stats Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-primary/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Season</p>
                <p className="text-2xl font-bold text-primary">{seasonId?.toString() || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-primary/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Round</p>
                <p className="text-2xl font-bold text-primary">{roundId?.toString() || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-primary/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</p>
                <p className="text-2xl font-bold text-gray-900">{matches?.length || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-primary/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pool</p>
                <p className="text-2xl font-bold text-green-600">{formatLBT(pool?.totalLocked)} <span className="text-xs font-normal text-gray-400">LBT</span></p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-primary/10">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{formatLBT(pool?.remaining)} <span className="text-xs font-normal text-gray-400">LBT</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isSettled as boolean) ? (
                <span className="bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full border border-green-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  SETTLED
                </span>
              ) : isBettingActive ? (
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-sm font-bold px-4 py-2 rounded-full border border-blue-200 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                  {bettingCountdown && (
                    <span className="bg-orange-100 text-orange-700 text-sm font-bold px-4 py-2 rounded-full border border-orange-200 flex items-center gap-1.5 font-mono">
                      <Clock className="w-4 h-4" />
                      {bettingCountdown}
                    </span>
                  )}
                </div>
              ) : (
                <span className="bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  BETTING CLOSED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-gray-900">Match Predictions</h1>
          </div>
          <p className="text-muted-foreground">
            Place your bets and win big with accurate predictions
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex gap-3">
          <button
            onClick={() => refetchGame()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >

            <RefreshCw className="w-4 h-4" />
            Refresh Odds & Pool
          </button>
        </div>
      </div>

      {/* Round Status Banners */}
      {isSettled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Round Settled:</strong> This round has been settled. Winning bets can be claimed in the "My Bets" section.
          </p>
        </div>
      )}

      {/* Betting Closed Banner (when time elapsed but not yet settled) */}
      {!isSettled && !isBettingActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">
            <strong>Betting Period Ended:</strong> The 3-hour betting window has closed. Waiting for match results to be generated...
          </p>
        </div>
      )}

      {/* Next Round Countdown Banner */}
      {isSettled && nextRoundCountdown && gameState?.timeUntilNextRound !== undefined && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 rounded-full p-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Next Round Starting In</h3>
                <p className="text-sm text-gray-600">The next round will begin automatically</p>
              </div>
            </div>
            <div className="bg-white rounded-xl px-6 py-3 border border-blue-300 shadow-sm">
              <div className="text-4xl font-bold font-mono text-blue-600">
                {nextRoundCountdown}
              </div>
              <div className="text-xs text-gray-500 text-center mt-1">minutes remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Matches Grid */}
      <div className="space-y-4">
        {matches && matches.length > 0 ? (
          matches.map((match: Match, index: number) => (
            <MatchCard
              key={`${roundId.toString()}-${index}`}
              roundId={roundId as bigint}

              matchIndex={index}
              match={match}
              startTime={bettingCountdown || "Live"}
              bettingDisabled={!isBettingActive || (isSettled as boolean)}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-border">
            <p className="text-gray-500">No matches available in this round.</p>
          </div>
        )}
      </div>
    </div>
  );
}
