/**
 * Web3 Hooks for LiquidityPool Contract
 * Hooks for adding/removing liquidity and viewing LP stats
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import LiquidityPoolABI from '@/abis/LiquidityPool.json';

// ============ Read Hooks ============

/**
 * Get total liquidity in pool
 */
export function useTotalLiquidity() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'totalLiquidity',
    query: {
      refetchInterval: 10000, // Refetch every 10s
    },
  });
}

/**
 * Get total LP shares issued
 */
export function useTotalShares() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'totalShares',
  });
}

/**
 * Get locked liquidity (reserved for payouts)
 */
export function useLockedLiquidity() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'lockedLiquidity',
    query: {
      refetchInterval: 10000,
    },
  });
}

/**
 * Get user's LP shares
 */
export function useUserLPShares(address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'lpShares',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get LP value for a user (amount + percentage)
 */
export function useLPValue(address: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'getLPValue',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get available (unlocked) liquidity
 */
export function useAvailableLiquidity() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'getAvailableLiquidity',
    query: {
      refetchInterval: 10000,
    },
  });
}

/**
 * Preview deposit - calculate shares that would be minted
 */
export function usePreviewDeposit(amount: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'previewDeposit',
    args: amount !== undefined ? [amount] : undefined,
    query: {
      enabled: amount !== undefined && amount > 0n,
    },
  });
}

/**
 * Preview withdrawal - calculate amount that would be received
 */
export function usePreviewWithdrawal(shares: bigint | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'previewWithdrawal',
    args: shares !== undefined ? [shares] : undefined,
    query: {
      enabled: shares !== undefined && shares > 0n,
    },
  });
}

/**
 * Get pool utilization rate (% of liquidity locked)
 */
export function useUtilizationRate() {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'getUtilizationRate',
    query: {
      refetchInterval: 10000,
    },
  });
}

// ============ Write Hooks ============

/**
 * Add liquidity to pool
 */
export function useAddLiquidity() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addLiquidity = (amount: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.liquidityPool,
      abi: LiquidityPoolABI,
      functionName: 'addLiquidity',
      args: [amount],
    });
  };

  return {
    addLiquidity,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

/**
 * Remove liquidity from pool
 */
export function useRemoveLiquidity() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const removeLiquidity = (shares: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.liquidityPool,
      abi: LiquidityPoolABI,
      functionName: 'removeLiquidity',
      args: [shares],
    });
  };

  return {
    removeLiquidity,
    hash,
    isConfirming,
    isSuccess,
    ...rest,
  };
}

// ============ Composite Hooks ============

/**
 * Get complete liquidity pool stats
 */
export function useLiquidityPoolStats() {
  const { data: totalLiquidity, isLoading: l1 } = useTotalLiquidity();
  const { data: totalShares, isLoading: l2 } = useTotalShares();
  const { data: lockedLiquidity, isLoading: l3 } = useLockedLiquidity();
  const { data: availableLiquidity, isLoading: l4 } = useAvailableLiquidity();
  const { data: utilizationRate, isLoading: l5 } = useUtilizationRate();

  return {
    totalLiquidity: totalLiquidity as bigint | undefined,
    totalShares: totalShares as bigint | undefined,
    lockedLiquidity: lockedLiquidity as bigint | undefined,
    availableLiquidity: availableLiquidity as bigint | undefined,
    utilizationRate: utilizationRate as bigint | undefined,
    isLoading: l1 || l2 || l3 || l4 || l5,
  };
}

/**
 * Get user's complete LP position
 */
export function useUserLPPosition(address: `0x${string}` | undefined) {
  const { data: shares, isLoading: l1 } = useUserLPShares(address);
  const { data: lpValue, isLoading: l2 } = useLPValue(address);

  return {
    shares: shares as bigint | undefined,
    amount: lpValue ? (lpValue as [bigint, bigint])[0] : undefined,
    percentage: lpValue ? (lpValue as [bigint, bigint])[1] : undefined,
    isLoading: l1 || l2,
  };
}
