/**
 * Web3 Hooks for GameCore Contract (V3.0 Protocol)
 * Read-only hooks for fetching match, season, and round data
 */

import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import GameCoreABI from '@/abis/GameCore.json';
import type { Match, Team, Season, Round } from '@/contracts/types';

// ============ Season & Round Info ============

/**
 * Get current season ID
 */
export function useCurrentSeason() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
    functionName: 'getCurrentSeason',
    chainId: sepolia.id,
    query: {
      refetchInterval: 30000, // Refetch every 30s
    },
  });
}

/**
 * Get current round ID from GameCore
 * GameCore tracks all rounds (even if not yet seeded in BettingCore)
 */
export function useCurrentRound() {
  const result = useReadContract({
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
    functionName: 'getCurrentRound',
    chainId: sepolia.id,
    query: {
      refetchInterval: 30000, // Refetch every 30s
    },
  });

  // Debug logging
  console.log('useCurrentRound (from GameCore) Debug:', {
    contractAddress: DEPLOYED_ADDRESSES.gameCore,
    data: result.data?.toString(),
    error: result.error,
    isLoading: result.isLoading,
  });

  return result;
}

/**
 * Get season details by ID
 */
export function useSeason(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
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
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
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
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
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
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
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
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
    functionName: 'getRoundMatches',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

// ============ Team Data ============

/**
 * Get team details by ID
 */
export function useTeam(teamId: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
    functionName: 'getTeam',
    args: [BigInt(teamId)],
    query: {
      enabled: teamId >= 0,
    },
  });
}

/**
 * Get all teams
 */
export function useAllTeams() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.gameCore,
    abi: GameCoreABI,
    functionName: 'getAllTeams',
  });
}

// ============ Composite Hooks ============

/**
 * Get complete dashboard data (current season, round, and matches)
 */
export function useDashboardData() {
  const { data: seasonId, refetch: refetchSeason, ...seasonQuery } = useCurrentSeason();
  const { data: roundId, refetch: refetchRound, ...roundQuery } = useCurrentRound();
  const { data: season, ...seasonDataQuery } = useSeason(seasonId as bigint);
  const { data: round, ...roundDataQuery } = useRound(roundId as bigint);
  const { data: matches, refetch: refetchMatches, ...matchesQuery } = useRoundMatches(roundId as bigint);
  const { data: isSettled, ...settledQuery } = useIsRoundSettled(roundId as bigint);

  const refetch = () => {
    console.log('refetching dashboard data');
    console.log('seasonId', seasonId);
    console.log('roundId', roundId);
    console.log('matches', matches);
    console.log('isSettled', isSettled);
    console.log('season', season);
    console.log('round', round);
    console.log('matches', matches);
    console.log('isSettled', isSettled);
    refetchSeason();
    refetchRound();
    refetchMatches();
  };

  return {
    seasonId,
    roundId,
    season,
    round,
    matches,
    isSettled,
    isLoading: seasonQuery.isLoading || roundQuery.isLoading || seasonDataQuery.isLoading || roundDataQuery.isLoading || matchesQuery.isLoading,
    isError: seasonQuery.isError || roundQuery.isError || seasonDataQuery.isError || roundDataQuery.isError || matchesQuery.isError,
    refetch,
  };
}
