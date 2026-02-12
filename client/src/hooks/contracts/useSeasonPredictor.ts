/**
 * Web3 Hooks for SeasonPredictor Contract
 * Hooks for making predictions and claiming prizes
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import SeasonPredictorABI from '@/abis/SeasonPredictor.json';

// ============ Read Hooks ============

/**
 * Get user's prediction for a season
 */
export function useUserPrediction(seasonId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getUserPrediction',
    args: seasonId !== undefined && address ? [seasonId, address] : undefined,
    query: {
      enabled: seasonId !== undefined && !!address,
    },
  });
}

/**
 * Get predictor count for a team
 */
export function useTeamPredictionCount(seasonId: bigint | undefined, teamId: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getTeamPredictionCount',
    args: seasonId !== undefined ? [seasonId, BigInt(teamId)] : undefined,
    query: {
      enabled: seasonId !== undefined && teamId >= 0 && teamId < 20,
    },
  });
}

/**
 * Get season pool data
 */
export function useSeasonPool(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getSeasonPool',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
      refetchInterval: 10000,
    },
  });
}

/**
 * Get winning team for a season
 */
export function useWinningTeam(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getSeasonPool',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
      select: (data) => data ? (data as any)[1] : undefined,
    },
  });
}

/**
 * Check if user is a winner and their reward
 */
export function useCheckWinner(seasonId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'checkWinner',
    args: seasonId !== undefined && address ? [seasonId, address] : undefined,
    query: {
      enabled: seasonId !== undefined && !!address,
    },
  });
}

/**
 * Get season statistics
 */
export function useSeasonStats(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getSeasonPool',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
      refetchInterval: 10000,
    },
  });
}

/**
 * Check if user has already claimed
 */
export function useHasClaimed(seasonId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getUserPrediction',
    args: seasonId !== undefined && address ? [seasonId, address] : undefined,
    query: {
      enabled: seasonId !== undefined && !!address,
      select: (data) => data ? (data as any).claimed : false,
    },
  });
}

// ============ Write Hooks ============

/**
 * Make a prediction for season winner
 */
export function useMakePrediction() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const makePrediction = (seasonId: bigint, teamId: number) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.seasonPredictor,
      abi: SeasonPredictorABI,
      functionName: 'makePrediction',
      args: [seasonId, BigInt(teamId)],
    });
  };

  return {
    makePrediction,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Claim reward for correct prediction
 */
export function useClaimReward() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimReward = (seasonId: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.seasonPredictor,
      abi: SeasonPredictorABI,
      functionName: 'claimReward',
      args: [seasonId],
    });
  };

  return {
    claimReward,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Composite Hooks ============

/**
 * Get complete season prediction data for user
 */
export function useUserSeasonData(seasonId: bigint | undefined, address: `0x${string}` | undefined) {
  const { data: predictionData, isLoading: l1 } = useUserPrediction(seasonId, address);
  const { data: winData, isLoading: l2 } = useCheckWinner(seasonId, address);
  const { data: poolData, isLoading: l3 } = useSeasonPool(seasonId);

  return {
    prediction: predictionData ? (predictionData as any).teamId : undefined,
    timestamp: predictionData ? (predictionData as any).timestamp : undefined,
    hasClaimed: predictionData ? (predictionData as any).claimed : false,
    isWinner: winData ? (winData as [boolean, bigint])[0] : false,
    rewardAmount: winData ? (winData as [boolean, bigint])[1] : 0n,
    poolStats: poolData as [bigint, bigint, bigint, bigint, boolean] | undefined,
    isLoading: l1 || l2 || l3,
  };
}
