/**
 * Web3 Hooks for GameEngine Contract
 * Read-only hooks for fetching match and season data
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import GameEngineABI from '@/abis/Gameengine.json';
import type { Match, Team, Season, Round } from '@/contracts/types';

// ============ Season & Round Info ============

/**
 * Get current season ID
 */
export function useCurrentSeason() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getCurrentSeason',
    chainId: sepolia.id,
  });
}

/**
 * Get current round ID
 */
export function useCurrentRound() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getCurrentRound',
    chainId: sepolia.id,
  });
}

/**
 * Get season details by ID
 */
export function useSeason(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getSeason',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
    },
  });
}

/**
 * Get round details by ID
 */
export function useRound(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getRound',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

/**
 * Check if round is settled
 */
export function useIsRoundSettled(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'isRoundSettled',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

// ============ Match Data ============

/**
 * Get single match by round ID and match index
 */
export function useMatch(roundId: bigint | undefined, matchIndex: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getMatch',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
    },
  });
}

/**
 * Get all 10 matches for a round
 */
export function useRoundMatches(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getRoundMatches',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

// ============ Team Data ============

/**
 * Get team base info by ID
 */
export function useTeam(teamId: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getTeam',
    args: [BigInt(teamId)],
    query: {
      enabled: teamId >= 0 && teamId < 20,
    },
  });
}

/**
 * Get team standing for specific season
 */
export function useTeamStanding(seasonId: bigint | undefined, teamId: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getTeamStanding',
    args: seasonId !== undefined ? [seasonId, BigInt(teamId)] : undefined,
    query: {
      enabled: seasonId !== undefined && teamId >= 0 && teamId < 20,
    },
  });
}

/**
 * Get all season standings (20 teams)
 */
export function useSeasonStandings(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameEngine,
    abi: GameEngineABI,
    functionName: 'getSeasonStandings',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
    },
  });
}

// ============ Composite Hooks (Multiple Reads) ============

/**
 * Get current season and round data together
 */
export function useCurrentSeasonAndRound() {
  const { data: seasonId, ...seasonQuery } = useCurrentSeason();
  const { data: roundId, ...roundQuery } = useCurrentRound();

  return {
    seasonId,
    roundId,
    isLoading: seasonQuery.isLoading || roundQuery.isLoading,
    isError: seasonQuery.isError || roundQuery.isError,
    error: seasonQuery.error || roundQuery.error,
  };
}

/**
 * Get all data needed for dashboard: season, round, and matches
 */
export function useDashboardData() {
  const { data: seasonId } = useCurrentSeason();
  const { data: roundId } = useCurrentRound();
  const { data: matches, ...matchesQuery } = useRoundMatches(roundId);
  const { data: season, ...seasonQuery } = useSeason(seasonId);
  const { data: round, ...roundQuery } = useRound(roundId);
  const { data: isSettled } = useIsRoundSettled(roundId);

  console.log({
    seasonId,
    roundId,
    season: season as Season | undefined,
    round: round as Round | undefined,
    matches: matches as readonly Match[] | undefined,
    isSettled,
    isLoading: matchesQuery.isLoading || seasonQuery.isLoading || roundQuery.isLoading,
    isError: matchesQuery.isError || seasonQuery.isError || roundQuery.isError,
  });

  return {
    seasonId,
    roundId,
    season: season as Season | undefined,
    round: round as Round | undefined,
    matches: matches as readonly Match[] | undefined,
    isSettled,
    isLoading: matchesQuery.isLoading || seasonQuery.isLoading || roundQuery.isLoading,
    isError: matchesQuery.isError || seasonQuery.isError || roundQuery.isError,
    refetch: () => {
      matchesQuery.refetch();
      seasonQuery.refetch();
      roundQuery.refetch();
    },
  };
}
