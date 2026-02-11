/**
 * Web3 Hooks for BettingCore Contract (V3.0 Protocol)
 * Direct BettingCore usage (no BettingRouter)
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import BettingCoreABI from '@/abis/BettingCore.json';
import { useState } from 'react';

// ============ Read Hooks - Odds & Match Data ============

/**
 * Get locked odds for a specific match
 * Returns tuple: [homeOdds, awayOdds, drawOdds, isLocked]
 * Odds are locked at round start and NEVER change
 */
export function useLockedOdds(roundId: bigint | undefined, matchIndex: number) {
  const result = useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getLockedOdds',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      refetchInterval: 10000,
    },
  });

  // Debug logging for match 0
  if (matchIndex === 0) {
    console.log('useLockedOdds Debug:', {
      roundId: roundId?.toString(),
      matchIndex,
      contractAddress: DEPLOYED_ADDRESSES.bettingCore,
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      data: result.data,
      dataArray: result.data ? (Array.isArray(result.data) ? result.data.map(d => d?.toString()) : 'not array') : null,
      error: result.error,
      isLoading: result.isLoading,
    });
  }

  return result;
}

/**
 * Get round metadata
 * Returns: RoundMetadata struct (startTime, endTime, seeded, settled)
 */
export function useRoundMetadata(roundId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getRoundMetadata',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 10000,
    },
  });
}

// ============ Read Hooks - User Bets ============

/**
 * Get user's bet IDs
 */
export function useUserBets(address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getUserBets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get bet details by ID
 * Returns: Bet struct
 */
export function useBet(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getBet',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
    },
  });
}

/**
 * Get bet claim status (for bounty system)
 * Returns: tuple [won, payout, claimed, claimedAt, claimDeadline]
 */
export function useBetClaimStatus(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getBetClaimStatus',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 10000,
    },
  });
}

/**
 * Check if a bet can be claimed with bounty
 * Returns: tuple [eligible, timeUntilBounty, bountyAmount, winnerAmount]
 */
export function useCanClaimWithBounty(betId: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'canClaimWithBounty',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 30000,
    },
  });
}

/**
 * Get current round ID from BettingCore
 */
export function useCurrentRoundId() {
  const result = useReadContract({
    address: DEPLOYED_ADDRESSES.bettingCore,
    abi: BettingCoreABI,
    functionName: 'getCurrentRound',
    query: {
      refetchInterval: 15000,
    },
  });

  console.log('useCurrentRoundId (BettingCore) Debug:', {
    contractAddress: DEPLOYED_ADDRESSES.bettingCore,
    data: result.data?.toString(),
    error: result.error,
    isLoading: result.isLoading,
  });

  return result;
}

// ============ Write Hooks - BettingCore (Place Bets) ============

/**
 * Place a bet directly on BettingCore
 * Signature: placeBet(uint256 amount, uint256[] matchIndices, uint8[] predictions)
 */
export function usePlaceBet() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = (
    amount: bigint,           // Amount FIRST (as per BettingCore signature)
    matchIndices: number[],   // Then match indices
    predictions: number[]     // Then predictions (1=HOME, 2=AWAY, 3=DRAW)
  ) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingCore,
      abi: BettingCoreABI,
      functionName: 'placeBet',
      args: [
        amount,
        matchIndices.map(i => BigInt(i)),
        predictions,
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

// ============ Write Hooks - BettingCore (Claim Winnings) ============

/**
 * Claim winnings for a bet
 * Can be called by anyone after 24h deadline (automatic bounty)
 */
export function useClaimWinnings() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWinnings = (betId: bigint, minPayout: bigint = 0n) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingCore,
      abi: BettingCoreABI,
      functionName: 'claimWinnings',
      args: [betId, minPayout],
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

/**
 * Batch claim multiple winning bets
 */
export function useBatchClaimWinnings() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchClaim = (betIds: bigint[]) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingCore,
      abi: BettingCoreABI,
      functionName: 'batchClaim',
      args: [betIds],
    });
  };

  return {
    batchClaim,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Claim bet with bounty (for others' unclaimed bets after 24h)
 * Uses claimWinnings - bounty is automatic within the function
 */
export function useClaimWithBounty() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWithBounty = (betId: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingCore,
      abi: BettingCoreABI,
      functionName: 'claimWinnings',  // Use claimWinnings (handles bounty automatically)
      args: [betId, 0n],               // (betId, minPayout)
    });
  };

  return {
    claimWithBounty,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Cancel an active bet (before round settlement)
 */
export function useCancelBet() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelBet = (betId: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.bettingCore,
      abi: BettingCoreABI,
      functionName: 'cancelBet',
      args: [betId],
    });
  };

  return {
    cancelBet,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Composite Hooks ============

/**
 * Hook for managing bet placement flow with loading states
 */
export function useBetFlow() {
  const [betStep, setBetStep] = useState<'idle' | 'approving' | 'placing' | 'confirming' | 'success' | 'error'>('idle');
  const { placeBet, isConfirming, isSuccess, isError } = usePlaceBet();

  const handlePlaceBet = async (
    amount: bigint,
    matchIndices: number[],
    predictions: number[]
  ) => {
    try {
      setBetStep('placing');
      await placeBet(amount, matchIndices, predictions);
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

/**
 * Get complete bet data with claim status
 */
export function useCompleteBetData(betId: bigint | undefined) {
  const { data: betData, ...betQuery } = useBet(betId);
  const { data: claimStatus, ...claimQuery } = useBetClaimStatus(betId);
  const { data: bountyInfo, ...bountyQuery } = useCanClaimWithBounty(betId);

  return {
    bet: betData,
    claimStatus,
    bountyInfo,
    isLoading: betQuery.isLoading || claimQuery.isLoading || bountyQuery.isLoading,
    isError: betQuery.isError || claimQuery.isError || bountyQuery.isError,
  };
}
