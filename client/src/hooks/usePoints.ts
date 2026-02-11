import { useQuery } from "@tanstack/react-query";

export interface UserPoints {
  id: number;
  walletAddress: string;
  totalPoints: number;
  betsPlaced: number;
  betsWon: number;
  lastUpdated: string;
  createdAt: string;
}

export interface PointsHistoryItem {
  id: number;
  walletAddress: string;
  betId: string | null;
  points: number;
  reason: 'bet_placed' | 'bet_won';
  createdAt: string;
}

/**
 * Hook to fetch user's points and stats
 */
export function useUserPoints(address: string | undefined) {
  return useQuery<UserPoints>({
    queryKey: ['userPoints', address],
    queryFn: async () => {
      if (!address) throw new Error('No address provided');
      const response = await fetch(`/api/points/${address}`);
      if (!response.ok) throw new Error('Failed to fetch points');
      return response.json();
    },
    enabled: !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch user's points history
 */
export function usePointsHistory(address: string | undefined, limit: number = 50) {
  return useQuery<PointsHistoryItem[]>({
    queryKey: ['pointsHistory', address, limit],
    queryFn: async () => {
      if (!address) throw new Error('No address provided');
      const response = await fetch(`/api/points/${address}/history?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch points history');
      return response.json();
    },
    enabled: !!address,
  });
}

/**
 * Hook to fetch leaderboard
 */
export function useLeaderboard(limit: number = 100) {
  return useQuery<UserPoints[]>({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const response = await fetch(`/api/points/leaderboard?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}
