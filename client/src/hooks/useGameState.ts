import { useQuery } from '@tanstack/react-query';

export interface GameState {
  currentSeasonId: string;
  currentRoundId: string;
  season: {
    seasonId: string;
    startTime: string;
    currentRound: string;
    active: boolean;
    completed: boolean;
    winningTeamId: string;
  } | null;
  round: {
    roundId: string;
    seasonId: string;
    startTime: string;
    vrfRequestId: string;
    settled: boolean;
  } | null;
  roundSettled: boolean;
  timeUntilRoundEnd?: number;
  timeUntilNextRound?: number;
  shouldRequestVRF: boolean;
  shouldSettleRound: boolean;
}

/**
 * Fetch current game state from server
 */
export function useGameState() {
  return useQuery<GameState>({
    queryKey: ['gameState'],
    queryFn: async () => {
      const response = await fetch('/api/admin/game-state');
      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
