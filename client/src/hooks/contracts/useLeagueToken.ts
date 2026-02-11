/**
 * Web3 Hooks for LeagueToken (ERC20)
 * Read balance and interact with token
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { DEPLOYED_ADDRESSES } from '@/contracts/addresses';
import { formatUnits } from 'viem';
import LeagueTokenABI from '@/abis/LeagueBetToken.json';

/**
 * Get LEAGUE token balance for an address
 */
export function useLeagueBalance(address: `0x${string}` | undefined) {
  const { data, ...rest } = useReadContract({
    address: DEPLOYED_ADDRESSES.leagueBetToken,
    abi: LeagueTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Format balance from wei to ether (18 decimals)
  const formattedBalance = data ? formatUnits(data as bigint, 18) : '0';
  const balanceFloat = parseFloat(formattedBalance);

  return {
    balance: data as bigint | undefined,
    formattedBalance,
    balanceFloat,
    ...rest,
  };
}

/**
 * Get allowance for BettingPool contract
 */
export function useLeagueAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: DEPLOYED_ADDRESSES.leagueBetToken,
    abi: LeagueTokenABI,
    functionName: 'allowance',
    args: owner ? [owner, DEPLOYED_ADDRESSES.bettingCore] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!owner,
    },
  });
}


/**
 * Approve LEAGUE tokens for BettingPool contract
 */
export function useApproveLeague() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isPending } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: bigint) => {
    writeContract({
      address: DEPLOYED_ADDRESSES.leagueBetToken,
      abi: LeagueTokenABI,
      functionName: 'approve',
      args: [DEPLOYED_ADDRESSES.bettingCore, amount],
    });
  };

  return {
    approve,
    hash,
    isConfirming,

    ...rest,
  };
}
