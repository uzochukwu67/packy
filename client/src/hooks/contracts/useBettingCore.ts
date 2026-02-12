/**
 * Web3 Hooks for BettingCore Contract (V3.0 Protocol)
 * Direct BettingCore usage (no BettingRouter)
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import BettingCoreABI from '@/abis/BettingCore.json';
import { useState } from 'react';

// ============ Configuration ============

const BETTING_CORE_ADDRESS = DEPLOYED_ADDRESSES.bettingCore; // Sepolia

// ============ Types ============

export type Prediction = 1 | 2 | 3; // 1=HOME, 2=AWAY, 3=DRAW
export type BetStatus = 0 | 1 | 2 | 3; // 0=Active, 1=Claimed, 2=Lost, 3=Cancelled

export interface LockedOdds {
  homeOdds: bigint;
  awayOdds: bigint;
  drawOdds: bigint;
  locked: boolean;
}

export interface RoundMetadata {
  roundStartTime: bigint;
  roundEndTime: bigint;
  seeded: boolean;
  settled: boolean;
}

export interface RoundPool {
  totalLocked: bigint;
  totalClaimed: bigint;
  remaining: bigint;
  sweepDeadline: bigint;
  swept: boolean;
}

export interface Bet {
  bettor: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  potentialPayout: bigint;
  lockedMultiplier: bigint;
  roundId: bigint;
  timestamp: number;
  legCount: number;
  status: BetStatus;
}

export interface BetPrediction {
  matchIndex: number;
  predictedOutcome: Prediction;
}

export interface ClaimStatus {
  isWon: boolean;
  isClaimed: boolean;
  totalPayout: bigint;
  claimDeadline: bigint;
  canBountyClaim: boolean;
}

export interface BountyInfo {
  eligible: boolean;
  timeUntilBounty: bigint;
  bountyAmount: bigint;
  winnerAmount: bigint;
}

// ============ Read Hooks - Round & Odds ============

/**
 * Get current round ID
 */
export function useCurrentRound() {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getCurrentRound',
    query: {
      refetchInterval: 15000, // Refetch every 15s
    },
  });
}

/**
 * Get locked odds for a specific match
 * Returns: { homeOdds, awayOdds, drawOdds, locked }
 */
export function useLockedOdds(roundId: bigint | undefined, matchIndex: number) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getLockedOdds',
    args: roundId !== undefined ? [roundId, BigInt(matchIndex)] : undefined,
    query: {
      enabled: roundId !== undefined && matchIndex >= 0 && matchIndex < 10,
      refetchInterval: 30000, // Locked odds don't change
      select: (data): LockedOdds | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          homeOdds: (d.homeOdds ?? d[0]) as bigint,
          awayOdds: (d.awayOdds ?? d[1]) as bigint,
          drawOdds: (d.drawOdds ?? d[2]) as bigint,
          locked: (d.locked ?? d[3]) as boolean,
        };
      },
    },
  });
}

/**
 * Get all locked odds for a round (all 10 matches)
 * Helper hook that fetches odds for all matches at once
 */
export function useAllLockedOdds(roundId: bigint | undefined) {
  const matches = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const oddsQueries = matches.map((matchIndex) =>
    useLockedOdds(roundId, matchIndex)
  );

  return {
    data: oddsQueries.map((q) => q.data),
    isLoading: oddsQueries.some((q) => q.isLoading),
    isError: oddsQueries.some((q) => q.isError),
  };
}

/**
 * Get round metadata
 */
export function useRoundMetadata(roundId: bigint | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getRoundMetadata',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 10000,
      select: (data): RoundMetadata | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          roundStartTime: (d.roundStartTime ?? d[0]) as bigint,
          roundEndTime: (d.roundEndTime ?? d[1]) as bigint,
          seeded: (d.seeded ?? d[2]) as boolean,
          settled: (d.settled ?? d[3]) as boolean,
        };
      },
    },
  });
}

/**
 * Get round pool information
 */
export function useRoundPool(roundId: bigint | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getRoundPool',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
      refetchInterval: 10000,
      select: (data): RoundPool | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          totalLocked: (d.totalLocked ?? d[0]) as bigint,
          totalClaimed: (d.totalClaimed ?? d[1]) as bigint,
          remaining: (d.remaining ?? d[2]) as bigint,
          sweepDeadline: (d.sweepDeadline ?? d[3]) as bigint,
          swept: (d.swept ?? d[4]) as boolean,
        };
      },
    },
  });
}

/**
 * Get protocol reserves
 */
export function useProtocolReserves() {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getProtocolReserves',
    query: {
      refetchInterval: 15000,
    },
  });
}

// ============ Read Hooks - User Bets ============

/**
 * Get user's bet IDs
 */
export function useUserBets(address: `0x${string}` | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getUserBets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });
}

/**
 * Get bet details by ID
 * Returns: { bet, predictions }
 */
export function useBet(betId: bigint | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getBet',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 5000,
      select: (data) => {
        if (!data || !Array.isArray(data)) return undefined;
        const [b, p] = data;
        const bet = b as any;

        return {
          bet: {
            bettor: (bet.bettor ?? bet[0]) as `0x${string}`,
            token: (bet.token ?? bet[1]) as `0x${string}`,
            amount: (bet.amount ?? bet[2]) as bigint,
            potentialPayout: (bet.potentialPayout ?? bet[3]) as bigint,
            lockedMultiplier: (bet.lockedMultiplier ?? bet[4]) as bigint,
            roundId: (bet.roundId ?? bet[5]) as bigint,
            timestamp: Number(bet.timestamp ?? bet[6]),
            legCount: Number(bet.legCount ?? bet[7]),
            status: (bet.status ?? bet[8]) as BetStatus,
          },
          predictions: (p as any)?.predictions as BetPrediction[] | undefined,
        };
      },
    },
  });
}

/**
 * Get bet claim status
 */
export function useBetClaimStatus(betId: bigint | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'getBetClaimStatus',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 10000,
      select: (data): ClaimStatus | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          isWon: (d.isWon ?? d[0]) as boolean,
          isClaimed: (d.isClaimed ?? d[1]) as boolean,
          totalPayout: (d.totalPayout ?? d[2]) as bigint,
          claimDeadline: (d.claimDeadline ?? d[3]) as bigint,
          canBountyClaim: (d.canBountyClaim ?? d[4]) as boolean,
        };
      },
    },
  });
}

/**
 * Check if bet is eligible for bounty claiming
 */
export function useCanClaimWithBounty(betId: bigint | undefined) {
  return useReadContract({
    address: BETTING_CORE_ADDRESS,
    abi: BettingCoreABI,
    functionName: 'canClaimWithBounty',
    args: betId !== undefined ? [betId] : undefined,
    query: {
      enabled: betId !== undefined,
      refetchInterval: 30000,
      select: (data): BountyInfo | undefined => {
        if (!data) return undefined;
        const d = data as any;
        return {
          eligible: (d.eligible ?? d[0]) as boolean,
          timeUntilBounty: (d.timeUntilBounty ?? d[1]) as bigint,
          bountyAmount: (d.bountyAmount ?? d[2]) as bigint,
          winnerAmount: (d.winnerAmount ?? d[3]) as bigint,
        };
      },
    },
  });
}

// ============ Write Hooks - Place Bets ============

/**
 * Place a bet on BettingCore
 * Signature: placeBet(uint256 amount, uint256[] matchIndices, uint8[] predictions)
 */
export function usePlaceBet() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = (
    amount: bigint,
    matchIndices: number[],
    predictions: Prediction[]
  ) => {
    writeContract({
      address: BETTING_CORE_ADDRESS,
      abi: BettingCoreABI,
      functionName: 'placeBet',
      args: [
        amount,
        matchIndices.map((i) => BigInt(i)),
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

// ============ Write Hooks - Claim & Cancel ============

/**
 * Claim winnings for a bet
 * Also handles bounty claims automatically (if caller != bettor)
 */
export function useClaimWinnings() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWinnings = (betId: bigint, minPayout: bigint = 0n) => {
    writeContract({
      address: BETTING_CORE_ADDRESS,
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
 * Batch claim multiple bets at once
 */
export function useBatchClaim() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchClaim = (betIds: bigint[]) => {
    writeContract({
      address: BETTING_CORE_ADDRESS,
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
 * Cancel an active bet (before settlement)
 */
export function useCancelBet() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelBet = (betId: bigint) => {
    writeContract({
      address: BETTING_CORE_ADDRESS,
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
 * Get complete round information (metadata + pool + odds)
 */
export function useRoundInfo(roundId: bigint | undefined) {
  const { data: metadata, isLoading: metadataLoading } = useRoundMetadata(roundId);
  const { data: pool, isLoading: poolLoading } = useRoundPool(roundId);
  const { data: allOdds, isLoading: oddsLoading } = useAllLockedOdds(roundId);

  return {
    metadata,
    pool,
    allOdds,
    isLoading: metadataLoading || poolLoading || oddsLoading,
  };
}

/**
 * Get complete bet information (bet + claim status + bounty info)
 */
export function useCompleteBetInfo(betId: bigint | undefined) {
  const { data: betData, isLoading: betLoading } = useBet(betId);
  const { data: claimStatus, isLoading: claimLoading } = useBetClaimStatus(betId);
  const { data: bountyInfo, isLoading: bountyLoading } = useCanClaimWithBounty(betId);

  return {
    bet: betData?.bet,
    predictions: betData?.predictions,
    claimStatus,
    bountyInfo,
    isLoading: betLoading || claimLoading || bountyLoading,
  };
}

/**
 * Get all user bets with full details
 */
export function useUserBetsWithDetails(address: `0x${string}` | undefined) {
  const { data: betIds, isLoading: idsLoading } = useUserBets(address);

  // Fetch details for each bet
  const betQueries = (betIds as bigint[] || []).map((betId) => useBet(betId));

  return {
    betIds,
    bets: betQueries.map((q) => q.data),
    isLoading: idsLoading || betQueries.some((q) => q.isLoading),
  };
}

// ============ Utility Hooks ============

/**
 * Calculate expected payout for a bet (client-side)
 * Multiplies odds together for parlay
 */
export function useCalculateExpectedPayout(
  roundId: bigint | undefined,
  matchIndices: number[],
  predictions: Prediction[],
  amount: bigint
) {
  const oddsQueries = matchIndices.map((matchIndex, i) =>
    useLockedOdds(roundId, matchIndex)
  );

  const isLoading = oddsQueries.some((q) => q.isLoading);
  const hasData = oddsQueries.every((q) => q.data);

  if (!hasData || isLoading) {
    return { expectedPayout: 0n, multiplier: 0n, isLoading };
  }

  // Calculate combined multiplier
  let multiplier = BigInt(1e18); // Start at 1.0x (18 decimals)

  matchIndices.forEach((matchIndex, i) => {
    const odds = oddsQueries[i].data;
    if (!odds) return;

    const prediction = predictions[i];
    let matchOdds: bigint;

    if (prediction === 1) matchOdds = odds.homeOdds;
    else if (prediction === 2) matchOdds = odds.awayOdds;
    else matchOdds = odds.drawOdds;

    // Multiply odds: multiplier = multiplier * matchOdds / 1e18
    multiplier = (multiplier * matchOdds) / BigInt(1e18);
  });

  // Apply parlay bonus based on leg count
  const parlayBonus = getParlayMultiplier(matchIndices.length);
  const finalMultiplier = (multiplier * parlayBonus) / BigInt(1e18);

  // Calculate payout
  const expectedPayout = (amount * finalMultiplier) / BigInt(1e18);

  return { expectedPayout, multiplier: finalMultiplier, isLoading: false };
}

/**
 * Get parlay multiplier based on number of legs
 */
function getParlayMultiplier(legCount: number): bigint {
  if (legCount === 1) return BigInt(1e18); // 1.0x
  if (legCount === 2) return BigInt(1.05e18); // 1.05x
  if (legCount === 3) return BigInt(1.10e18); // 1.10x
  if (legCount === 4) return BigInt(1.15e18); // 1.15x
  if (legCount === 5) return BigInt(1.20e18); // 1.20x
  return BigInt(1.25e18); // 1.25x for 6+ legs
}

/**
 * Format odds for display (convert from 18 decimals to 2 decimals)
 */
export function formatOdds(odds: bigint | undefined): string {
  if (!odds) return '0.00';
  return (Number(odds) / 1e18).toFixed(2);
}

/**
 * Format LBT amount for display
 */
export function formatLBT(amount: bigint | undefined): string {
  if (!amount) return '0.00';
  return (Number(amount) / 1e18).toFixed(2);
}
