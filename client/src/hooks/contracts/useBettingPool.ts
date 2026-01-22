/**
 * Web3 Hooks for BettingPool Contract
 * Read/Write hooks for placing bets and claiming winnings
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import BettingPoolJSON from '@/abis/bettingpool.json';
import type {
  MatchOdds,
  ParlayInfo,
  BetPayout,
  Bet,
  Prediction,
  RoundAccounting,
  MatchPool
} from '@/contracts/types';
import { useState } from 'react';

const BettingPoolABI = BettingPoolJSON.abi;

// ============ Read Hooks - Odds & Pool Data ============

/**
 * Get current market odds for a specific match outcome
 */
export function useMarketOdds(
  roundId: bigint | undefined,
  matchIndex: number,
  outcome: 1 | 2 | 3 // 1=HOME, 2=AWAY, 3=DRAW
) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getMarketOdds',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex), outcome] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      refetchInterval: 5000, // Refetch every 5s as pools change
    },
  });
}

/**
 * Preview match odds (all three outcomes at once)
 */
export function usePreviewMatchOdds(roundId: bigint | undefined, matchIndex: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'previewMatchOdds',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      refetchInterval: 5000,
    },
  });
}

/**
 * Get all match odds for entire round (10 matches)
 */
export function useAllMatchOdds(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getAllMatchOdds',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 5000,
    },
  });
}

/**
 * Get match pool data (pool sizes)
 */
export function useMatchPoolData(roundId: bigint | undefined, matchIndex: number) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getMatchPoolData',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
    },
  });
}

// ============ Read Hooks - Parlay Multipliers ============

/**
 * Get current parlay multiplier for a bet
 */
export function useCurrentParlayMultiplier(
  roundId: bigint | undefined,
  matchIndices: number[],
  numLegs: number
) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getCurrentParlayMultiplier',
    args: roundId !== undefined
      ? [roundId, matchIndices.map(i => BigInt(i)), BigInt(numLegs)]
      : undefined,
    query: {
      enabled: roundId !== undefined && matchIndices.length > 0,
      refetchInterval: 3000, // Parlay tiers change as bets are placed
    },
  });
}

// ============ Read Hooks - User Bets ============

/**
 * Get user's bet IDs
 */
export function useUserBets(address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getUserBets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get bet details by ID
 */
export function useBet(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getBet',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
    },
  });
}

/**
 * Get bet predictions by bet ID
 */
export function useBetPredictions(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getBetPredictions',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
    },
  });
}

/**
 * Preview bet payout (won/lost, amounts, multiplier)
 */
export function usePreviewBetPayout(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'previewBetPayout',
    args: betId !== undefined ? [betId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: betId !== undefined,
    },
  });
}

// ============ Read Hooks - Round Accounting ============

/**
 * Get round accounting data
 */
export function useRoundAccounting(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'getRoundAccounting',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

/**
 * Get season reward pool amount
 */
export function useSeasonRewardPool() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingPool,
    abi: BettingPoolABI,
    functionName: 'seasonRewardPool',
  });
}

// ============ Write Hooks - Place Bet ============

/**
 * Place a bet on match outcomes
 */
export function usePlaceBet() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = (
    matchIndices: number[],
    outcomes: number[], // 1=HOME, 2=AWAY, 3=DRAW
    amount: bigint
  ) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingPool,
      abi: BettingPoolABI,
      functionName: 'placeBet',
      args: [
        matchIndices.map(i => BigInt(i)),
        outcomes,
        amount,
      ],
    });
  };

  return {
    placeBet,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Write Hooks - Claim Winnings ============

/**
 * Claim winnings for a bet
 */
export function useClaimWinnings() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWinnings = (betId: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingPool,
      abi: BettingPoolABI,
      functionName: 'claimWinnings',
      args: [betId],
    });
  };

  return {
    claimWinnings,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Composite Hooks ============

/**
 * Get complete bet data (details + predictions + payout preview)
 */
export function useCompleteBetData(betId: bigint | undefined) {
  const { data: betData, ...betQuery } = useBet(betId);
  const { data: predictions, ...predictionsQuery } = useBetPredictions(betId);
  const { data: payout, ...payoutQuery } = usePreviewBetPayout(betId);

  return {
    bet: betData as [string, bigint, bigint, bigint, boolean, boolean] | undefined,
    predictions: predictions as Prediction[] | undefined,
    payout: payout as [boolean, bigint, bigint, bigint] | undefined,
    isLoading: betQuery.isLoading || predictionsQuery.isLoading || payoutQuery.isLoading,
    isError: betQuery.isError || predictionsQuery.isError || payoutQuery.isError,
  };
}

/**
 * Get all user's bets with complete data
 */
export function useUserBetsComplete(address: `0x${string}` | undefined) {
  const { data: betIds, ...betIdsQuery } = useUserBets(address);

  return {
    betIds: betIds as bigint[] | undefined,
    ...betIdsQuery,
  };
}

/**
 * Hook for managing bet placement flow with loading states
 */
export function useBetFlow() {
  const [betStep, setBetStep] = useState<'idle' | 'approving' | 'placing' | 'confirming' | 'success' | 'error'>('idle');
  const { placeBet, isConfirming, isSuccess, isError } = usePlaceBet();

  const handlePlaceBet = async (
    matchIndices: number[],
    outcomes: number[],
    amount: bigint
  ) => {
    try {
      setBetStep('placing');
      await placeBet(matchIndices, outcomes, amount);
      setBetStep('confirming');
    } catch (error) {
      setBetStep('error');
      throw error;
    }
  };

  // Update step based on transaction status
  if (isSuccess && betStep === 'confirming') {
    setBetStep('success');
  }
  if (isError && betStep !== 'error') {
    setBetStep('error');
  }

  return {
    placeBet: handlePlaceBet,
    step: betStep,
    reset: () => setBetStep('idle'),
    isLoading: betStep === 'placing' || betStep === 'confirming',
  };
}
