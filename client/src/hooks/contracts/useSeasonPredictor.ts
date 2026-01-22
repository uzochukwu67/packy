/**
 * Web3 Hooks for SeasonPredictor Contract
 * Hooks for making predictions and claiming prizes
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import SeasonPredictorJSON from '@/abis/SeasonPredictor.json';

const SeasonPredictorABI = SeasonPredictorJSON.abi;

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
export function useTeamPredictorCount(seasonId: bigint | undefined, teamId: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getTeamPredictorCount',
    args: seasonId !== undefined ? [seasonId, BigInt(teamId)] : undefined,
    query: {
      enabled: seasonId !== undefined && teamId >= 0 && teamId < 20,
    },
  });
}

/**
 * Get season prize pool
 */
export function useSeasonPrizePool(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getSeasonPrizePool',
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
    functionName: 'getWinningTeam',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
    },
  });
}

/**
 * Check if user can claim prize and amount
 */
export function useCanClaimPrize(seasonId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'canClaimPrize',
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
    functionName: 'getSeasonStats',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
      refetchInterval: 10000,
    },
  });
}

/**
 * Get prediction distribution (all teams)
 */
export function usePredictionDistribution(seasonId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.seasonPredictor,
    abi: SeasonPredictorABI,
    functionName: 'getPredictionDistribution',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: {
      enabled: seasonId !== undefined,
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
    functionName: 'hasClaimed',
    args: seasonId !== undefined && address ? [seasonId, address] : undefined,
    query: {
      enabled: seasonId !== undefined && !!address,
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

  const makePrediction = (teamId: number) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.seasonPredictor,
      abi: SeasonPredictorABI,
      functionName: 'makePrediction',
      args: [BigInt(teamId)],
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
 * Claim prize for correct prediction
 */
export function useClaimPrize() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimPrize = (seasonId: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.seasonPredictor,
      abi: SeasonPredictorABI,
      functionName: 'claimPrize',
      args: [seasonId],
    });
  };

  return {
    claimPrize,
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
  const { data: prediction, isLoading: l1 } = useUserPrediction(seasonId, address);
  const { data: canClaim, isLoading: l2 } = useCanClaimPrize(seasonId, address);
  const { data: hasClaimed, isLoading: l3 } = useHasClaimed(seasonId, address);
  const { data: stats, isLoading: l4 } = useSeasonStats(seasonId);

  return {
    prediction: prediction as bigint | undefined,
    canClaim: canClaim ? (canClaim as [boolean, bigint])[0] : false,
    prizeAmount: canClaim ? (canClaim as [boolean, bigint])[1] : 0n,
    hasClaimed: hasClaimed as boolean | undefined,
    stats: stats as [bigint, bigint, boolean, bigint, bigint] | undefined,
    isLoading: l1 || l2 || l3 || l4,
  };
}
