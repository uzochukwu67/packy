/**
 * LEAGUE Token Faucet
 * Distributes test tokens to users for betting
 */

import { publicClient, walletClient, CONTRACTS, FAUCET_CONFIG, log } from './config';
import { LeagueBetTokenABI } from './abis/index';

// In-memory rate limiting (use Redis in production)
interface FaucetRequest {
  timestamp: number;
  amount: bigint;
}

const requestHistory = new Map<string, FaucetRequest[]>();

/**
 * Clean up old requests (older than 24 hours)
 */
function cleanupOldRequests(address: string) {
  const history = requestHistory.get(address) || [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const recentRequests = history.filter(req => req.timestamp > oneDayAgo);
  requestHistory.set(address, recentRequests);

  return recentRequests;
}

/**
 * Check if address can request tokens from faucet
 */
export function canRequestTokens(address: string): {
  canRequest: boolean;
  reason?: string;
  nextRequestTime?: number;
} {
  const history = cleanupOldRequests(address);

  // Check daily limit
  if (history.length >= FAUCET_CONFIG.MAX_DAILY_REQUESTS) {
    return {
      canRequest: false,
      reason: `Daily limit reached (${FAUCET_CONFIG.MAX_DAILY_REQUESTS} requests per day)`,
    };
  }

  // Check cooldown period
  if (history.length > 0) {
    const lastRequest = history[history.length - 1];
    const timeSinceLastRequest = Date.now() - lastRequest.timestamp;

    if (timeSinceLastRequest < FAUCET_CONFIG.COOLDOWN_MS) {
      return {
        canRequest: false,
        reason: 'Cooldown period active',
        nextRequestTime: lastRequest.timestamp + FAUCET_CONFIG.COOLDOWN_MS,
      };
    }
  }

  return { canRequest: true };
}

/**
 * Request LEAGUE tokens from faucet
 */
export async function requestFaucetTokens(address: `0x${string}`): Promise<{
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
  nextRequestTime?: number;
}> {
  try {
    // Validate address
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        success: false,
        error: 'Invalid Ethereum address',
      };
    }

    // Check rate limits
    const rateCheck = canRequestTokens(address);
    if (!rateCheck.canRequest) {
      return {
        success: false,
        error: rateCheck.reason,
        nextRequestTime: rateCheck.nextRequestTime,
      };
    }

    log(`Faucet request from ${address}`);

    // Check faucet balance
    const faucetBalance = await publicClient.readContract({
      address: CONTRACTS.leagueBetToken,
      abi: LeagueBetTokenABI as any,
      functionName: 'balanceOf',
      args: [walletClient.account.address],
    }) as bigint;

    if (faucetBalance < FAUCET_CONFIG.FAUCET_AMOUNT) {
      log(`Faucet balance low: ${faucetBalance}`, 'warn');
      return {
        success: false,
        error: 'Faucet balance insufficient. Please contact admin.',
      };
    }

    // Transfer LBT tokens
    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.leagueBetToken,
      abi: LeagueBetTokenABI as any,
      functionName: 'transfer',
      args: [address, FAUCET_CONFIG.FAUCET_AMOUNT],
    });

    const txHash = await walletClient.writeContract(request);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status === 'success') {
      // Record request
      const history = requestHistory.get(address) || [];
      history.push({
        timestamp: Date.now(),
        amount: FAUCET_CONFIG.FAUCET_AMOUNT,
      });
      requestHistory.set(address, history);

      const amountInEther = Number(FAUCET_CONFIG.FAUCET_AMOUNT) / 10 ** 18;

      log(`✅ Sent ${amountInEther} LBT to ${address} | TX: ${txHash}`);

      return {
        success: true,
        txHash,
        amount: amountInEther.toString(),
      };
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error: any) {
    log(`Faucet error for ${address}: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message || 'Failed to send tokens',
    };
  }
}

/**
 * Get faucet stats
 */
export async function getFaucetStats() {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.leagueBetToken,
      abi: LeagueBetTokenABI as any,
      functionName: 'balanceOf',
      args: [walletClient.account.address],
    }) as bigint;

    const balanceInEther = Number(balance) / 10 ** 18;
    const requestsRemaining = Math.floor(Number(balance) / Number(FAUCET_CONFIG.FAUCET_AMOUNT));

    return {
      balance: balanceInEther,
      faucetAmount: Number(FAUCET_CONFIG.FAUCET_AMOUNT) / 10 ** 18,
      requestsRemaining,
      totalAddresses: requestHistory.size,
      cooldownMinutes: FAUCET_CONFIG.COOLDOWN_MS / 60000,
      maxDailyRequests: FAUCET_CONFIG.MAX_DAILY_REQUESTS,
    };
  } catch (error: any) {
    log(`Failed to get faucet stats: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Get user's faucet history
 */
export function getUserFaucetHistory(address: string) {
  const history = cleanupOldRequests(address);
  const rateCheck = canRequestTokens(address);

  return {
    requests: history.map(req => ({
      timestamp: req.timestamp,
      amount: Number(req.amount) / 10 ** 18,
    })),
    remainingRequests: FAUCET_CONFIG.MAX_DAILY_REQUESTS - history.length,
    canRequest: rateCheck.canRequest,
    nextRequestTime: rateCheck.nextRequestTime,
  };
}
