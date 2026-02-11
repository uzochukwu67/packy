/**
 * API Hooks for fetching round data from server
 * Uses server API for cached data and bet information
 */

import { useQuery } from '@tanstack/react-query';

export interface RoundData {
  roundId: string;
  seasonId: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  vrfFulfilled: boolean;
  vrfFulfilledAt?: Date;
  settled: boolean;
  settledAt?: Date;
}

export interface MatchData {
  id: number;
  roundId: string;
  matchIndex: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  outcome: string; // 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | 'PENDING'
  settled: boolean;
  homeOdds: string;
  awayOdds: string;
  drawOdds: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

export interface BetData {
  id: number;
  betId: string;
  bettor: string;
  roundId: string;
  seasonId: string;
  amount: string;
  matchIndices: number[];
  outcomes: number[];
  parlayMultiplier: string;
  potentialWinnings: string;
  status: 'pending' | 'won' | 'lost' | 'claimed';
  txHash: string;
  createdAt: Date;
}

export interface RoundResultsData {
  round: RoundData;
  matches: MatchData[];
  bets: BetData[];
  statistics: {
    totalBets: number;
    totalVolume: string;
    wonBets: number;
    lostBets: number;
    pendingBets: number;
  };
}

/**
 * Fetch round results with matches and all bets
 */
export function useRoundResults(roundId: string | undefined) {
  return useQuery<RoundResultsData>({
    queryKey: ['roundResults', roundId],
    queryFn: async () => {
      if (!roundId) throw new Error('Round ID required');

      const response = await fetch(`/api/game/rounds/${roundId}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch round results');
      }

      const data = await response.json();

      // Parse dates
      return {
        ...data,
        round: {
          ...data.round,
          startTime: new Date(data.round.startTime),
          endTime: new Date(data.round.endTime),
          vrfFulfilledAt: data.round.vrfFulfilledAt ? new Date(data.round.vrfFulfilledAt) : undefined,
          settledAt: data.round.settledAt ? new Date(data.round.settledAt) : undefined,
        },
        bets: data.bets.map((bet: any) => ({
          ...bet,
          createdAt: new Date(bet.createdAt),
        })),
      };
    },
    enabled: !!roundId,
  });
}

/**
 * Fetch matches for a specific round
 */
export function useRoundMatches(roundId: string | undefined) {
  return useQuery<{ round: RoundData; matches: MatchData[] }>({
    queryKey: ['roundMatches', roundId],
    queryFn: async () => {
      if (!roundId) throw new Error('Round ID required');

      const response = await fetch(`/api/game/rounds/${roundId}/matches`);
      if (!response.ok) {
        throw new Error('Failed to fetch round matches');
      }

      const data = await response.json();

      return {
        ...data,
        round: {
          ...data.round,
          startTime: new Date(data.round.startTime),
          endTime: new Date(data.round.endTime),
          vrfFulfilledAt: data.round.vrfFulfilledAt ? new Date(data.round.vrfFulfilledAt) : undefined,
          settledAt: data.round.settledAt ? new Date(data.round.settledAt) : undefined,
        },
      };
    },
    enabled: !!roundId,
  });
}

/**
 * Fetch user's bets for a specific round
 */
export function useUserRoundBets(address: string | undefined, roundId: string | undefined) {
  return useQuery<BetData[]>({
    queryKey: ['userRoundBets', address, roundId],
    queryFn: async () => {
      if (!address || !roundId) throw new Error('Address and round ID required');

      const response = await fetch(`/api/bets/${address}?roundId=${roundId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user bets');
      }

      const data = await response.json();

      return data.map((bet: any) => ({
        ...bet,
        createdAt: new Date(bet.createdAt),
      }));
    },
    enabled: !!address && !!roundId,
  });
}

/**
 * Fetch specific round details
 */
export function useRound(roundId: string | undefined) {
  return useQuery<RoundData>({
    queryKey: ['round', roundId],
    queryFn: async () => {
      if (!roundId) throw new Error('Round ID required');

      const response = await fetch(`/api/game/rounds/${roundId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch round');
      }

      const data = await response.json();

      return {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        vrfFulfilledAt: data.vrfFulfilledAt ? new Date(data.vrfFulfilledAt) : undefined,
        settledAt: data.settledAt ? new Date(data.settledAt) : undefined,
      };
    },
    enabled: !!roundId,
  });
}
