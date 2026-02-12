/**
 * GameCore Hooks - Season & Round Management
 * Handles league matches, scores, and standings
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import GameCoreABI from '@/abis/GameCore.json';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';

// ============ Configuration ============

const GAME_CORE_ADDRESS = DEPLOYED_ADDRESSES.gameCore; // Sepolia

// ============ Types ============

export type MatchOutcome = 0 | 1 | 2 | 3; // 0=PENDING, 1=HOME_WIN, 2=AWAY_WIN, 3=DRAW

export interface Season {
  seasonId: bigint;
  startTime: bigint;
  currentRound: bigint;
  totalRounds: bigint;
  active: boolean;
  completed: boolean;
  winningTeamId: bigint;
}

export interface Match {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  outcome: MatchOutcome;
  settled: boolean;
}

export interface Team {
  name: string;
  wins: bigint;
  draws: bigint;
  losses: bigint;
  points: bigint;
  goalsFor: bigint;
  goalsAgainst: bigint;
}

// ============ Read Hooks - Season & Round ============

/**
 * Get current season ID
 */
export function useCurrentSeason() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getCurrentSeason',
    chainId: bscTestnet.id,
    query: {
      refetchInterval: 30000, // Refetch every 30s
    },
  });
}

/**
 * Get current round ID
 */
export function useCurrentRound() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getCurrentRound',
    chainId: bscTestnet.id,
    query: {
      refetchInterval: 15000, // Refetch every 15s
    },
  });
}

/**
 * Get full current season data
 * Returns: { seasonId, startTime, currentRound, totalRounds, active, completed, winningTeamId }
 */
export function useCurrentSeasonData() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'currentSeason',
    query: {
      refetchInterval: 30000,
      select: (data): Season | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          seasonId: (d.seasonId ?? d[0]) as bigint,
          startTime: (d.startTime ?? d[1]) as bigint,
          currentRound: (d.currentRound ?? d[2]) as bigint,
          totalRounds: (d.totalRounds ?? d[3]) as bigint,
          active: (d.active ?? d[4]) as boolean,
          completed: (d.completed ?? d[5]) as boolean,
          winningTeamId: (d.winningTeamId ?? d[6]) as bigint,
        };
      },
    },
  });
}

// ============ Read Hooks - Matches ============

/**
 * Get a specific match by round and match index
 */
export function useMatch(roundId: bigint | undefined, matchIndex: number) {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getMatch',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      refetchInterval: 10000,
      select: (data): Match | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          homeTeamId: Number(d.homeTeamId ?? d[0]),
          awayTeamId: Number(d.awayTeamId ?? d[1]),
          homeScore: Number(d.homeScore ?? d[2]),
          awayScore: Number(d.awayScore ?? d[3]),
          outcome: (d.outcome ?? d[4]) as MatchOutcome,
          settled: (d.settled ?? d[5]) as boolean,
        };
      },
    },
  });
}

/**
 * Get all matches for a round (10 matches)
 */
export function useRoundMatches(roundId: bigint | undefined) {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getRoundMatches',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 10000,
      select: (data): Match[] | undefined => {
        if (!data || !Array.isArray(data)) return undefined;
        return data.map((m: any) => ({
          homeTeamId: Number(m.homeTeamId ?? m[0]),
          awayTeamId: Number(m.awayTeamId ?? m[1]),
          homeScore: Number(m.homeScore ?? m[2]),
          awayScore: Number(m.awayScore ?? m[3]),
          outcome: (m.outcome ?? m[4]) as MatchOutcome,
          settled: (m.settled ?? m[5]) as boolean,
        }));
      },
    },
  });
}

/**
 * Get match results for a round (array of 10 outcomes)
 * Returns: [1, 2, 3, 1, ...] where 1=HOME, 2=AWAY, 3=DRAW
 */
export function useRoundResults(roundId: bigint | undefined) {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getResults',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 10000,
    },
  });
}

// ============ Read Hooks - Teams & Standings ============

/**
 * Get team information by team ID
 */
export function useTeam(teamId: number) {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getTeam',
    args: [teamId],
    query: {
      enabled: teamId >= 0 && teamId < 20, // Assuming 20 teams
      refetchInterval: 60000, // Team names don't change often
      select: (data): Team | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          name: (d.name ?? d[0]) as string,
          wins: (d.wins ?? d[1]) as bigint,
          draws: (d.draws ?? d[2]) as bigint,
          losses: (d.losses ?? d[3]) as bigint,
          points: (d.points ?? d[4]) as bigint,
          goalsFor: (d.goalsFor ?? d[5]) as bigint,
          goalsAgainst: (d.goalsAgainst ?? d[6]) as bigint,
        };
      },
    },
  });
}

/**
 * Get season standings (league table)
 */
export function useSeasonStandings(seasonId: bigint | undefined) {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'getSeasonStandings',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
      refetchInterval: 30000,
      select: (data): Team[] | undefined => {
        if (!data || !Array.isArray(data)) return undefined;
        return data.map((team: any) => ({
          name: (team.name ?? team[0]) as string,
          wins: (team.wins ?? team[1]) as bigint,
          draws: (team.draws ?? team[2]) as bigint,
          losses: (team.losses ?? team[3]) as bigint,
          points: (team.points ?? team[4]) as bigint,
          goalsFor: (team.goalsFor ?? team[5]) as bigint,
          goalsAgainst: (team.goalsAgainst ?? team[6]) as bigint,
        }));
      },
    },
  });
}

/**
 * Get current season standings (shorthand)
 */
export function useCurrentSeasonStandings() {
  const { data: seasonId } = useCurrentSeason();
  return useSeasonStandings(seasonId);
}

// ============ Read Hooks - Constants ============

/**
 * Get number of matches per round (should be 10)
 */
export function useMatchesPerRound() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'MATCHES_PER_ROUND',
  });
}

/**
 * Get number of rounds per season (should be 38)
 */
export function useRoundsPerSeason() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'ROUNDS_PER_SEASON',
  });
}

/**
 * Get round duration in seconds
 */
export function useRoundDuration() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'ROUND_DURATION',
  });
}

/**
 * Get total number of teams
 */
export function useTeamsCount() {
  return useReadContract({
    address: GAME_CORE_ADDRESS,
    abi: GameCoreABI,
    functionName: 'TEAMS_COUNT',
  });
}

// ============ Write Hooks - Admin Only ============

/**
 * Start a new season (admin only)
 */
export function useStartSeason() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const startSeason = () => {
    writeContract({
      address: GAME_CORE_ADDRESS,
      abi: GameCoreABI,
      functionName: 'startSeason',
    });
  };

  return {
    startSeason,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Start a new round (admin only)
 * Triggers VRF for match generation
 */
export function useStartRound() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const startRound = () => {
    writeContract({
      address: GAME_CORE_ADDRESS,
      abi: GameCoreABI,
      functionName: 'startRound',
    });
  };

  return {
    startRound,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Complete current season (admin only)
 */
export function useCompleteSeason() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const completeSeason = () => {
    writeContract({
      address: GAME_CORE_ADDRESS,
      abi: GameCoreABI,
      functionName: 'completeSeason',
    });
  };

  return {
    completeSeason,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Emergency settle round (admin only, for VRF timeout)
 */
export function useEmergencySettleRound() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const emergencySettle = (roundId: bigint, seed: bigint) => {
    writeContract({
      address: GAME_CORE_ADDRESS,
      abi: GameCoreABI,
      functionName: 'emergencySettleRound',
      args: [roundId, seed],
    });
  };

  return {
    emergencySettle,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Composite Hooks ============

/**
 * Get complete round information (matches + results)
 */
export function useRoundInfo(roundId: bigint | undefined) {
  const { data: matches, isLoading: matchesLoading } = useRoundMatches(roundId);
  const { data: results, isLoading: resultsLoading } = useRoundResults(roundId);

  return {
    matches,
    results,
    isLoading: matchesLoading || resultsLoading,
  };
}

/**
 * Get match with team information
 */
export function useMatchWithTeams(roundId: bigint | undefined, matchIndex: number) {
  const { data: match, isLoading: matchLoading } = useMatch(roundId, matchIndex);
  const { data: homeTeam, isLoading: homeLoading } = useTeam(match?.homeTeamId || 0);
  const { data: awayTeam, isLoading: awayLoading } = useTeam(match?.awayTeamId || 0);

  return {
    match,
    homeTeam,
    awayTeam,
    isLoading: matchLoading || homeLoading || awayLoading,
  };
}

/**
 * Get all matches with team information for a round
 */
export function useRoundMatchesWithTeams(roundId: bigint | undefined) {
  const { data: matches, isLoading } = useRoundMatches(roundId);

  // Fetch team data for all matches
  const teamIds = matches?.flatMap((m) => [m.homeTeamId, m.awayTeamId]) || [];
  const uniqueTeamIds = [...new Set(teamIds)];

  const teamQueries = uniqueTeamIds.map((teamId) => useTeam(teamId));

  const teamsMap = new Map<number, Team | undefined>();
  uniqueTeamIds.forEach((teamId, i) => {
    teamsMap.set(teamId, teamQueries[i].data);
  });

  const matchesWithTeams = matches?.map((match) => ({
    ...match,
    homeTeam: teamsMap.get(match.homeTeamId),
    awayTeam: teamsMap.get(match.awayTeamId),
  }));

  return {
    data: matchesWithTeams,
    isLoading: isLoading || teamQueries.some((q) => q.isLoading),
  };
}

/**
 * Get complete current game state
 */
export function useCurrentGameState() {
  const { data: seasonData, isLoading: seasonLoading } = useCurrentSeasonData();
  const { data: standings, isLoading: standingsLoading } = useCurrentSeasonStandings();
  const { data: matches, isLoading: matchesLoading } = useRoundMatches(seasonData?.currentRound);

  return {
    season: seasonData,
    standings,
    currentMatches: matches,
    isLoading: seasonLoading || standingsLoading || matchesLoading,
  };
}

// ============ Utility Functions ============

/**
 * Format match outcome as string
 */
export function formatMatchOutcome(outcome: MatchOutcome): string {
  switch (outcome) {
    case 0:
      return 'Pending';
    case 1:
      return 'Home Win';
    case 2:
      return 'Away Win';
    case 3:
      return 'Draw';
    default:
      return 'Unknown';
  }
}

/**
 * Get match result display (e.g., "2-1", "vs" for pending)
 */
export function getMatchScore(match: Match | undefined): string {
  if (!match || !match.settled) return 'vs';
  return `${match.homeScore}-${match.awayScore}`;
}

/**
 * Calculate goal difference
 */
export function getGoalDifference(team: Team | undefined): number {
  if (!team) return 0;
  return Number(team.goalsFor) - Number(team.goalsAgainst);
}

/**
 * Format team record (e.g., "10W-5D-3L")
 */
export function formatTeamRecord(team: Team | undefined): string {
  if (!team) return '-';
  return `${team.wins}W-${team.draws}D-${team.losses}L`;
}
