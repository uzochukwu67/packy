/**
 * Web3 Configuration for Backend
 * Manages wallet, RPC, and contract addresses
 */

import { createWalletClient, createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
dotenv.config();

// Contract addresses on BNB Testnet (Chain ID 97)
export const CONTRACTS = {
  // Core contracts
  leagueBetToken: '0x1d08F7A669E18B3B3AEce77a8C20E1Ef7536CEE6' as const,
  gameCore: '0xEB929B5c0e71a6b785CE89f8A0fd218D92c8fB66' as const,
  bettingCore: '0xf99a4F28E9D1cDC481a4b742bc637Af9e60e3FE5' as const,
  bettingRouter: '0x02d49e1e3EE1Db09a7a8643Ae1BCc72169180861' as const,

  // Periphery
  seasonPredictor: '0x45da13240cEce4ca92BEF34B6955c7883e5Ce9E4' as const,
  swapRouter: '0xD8d4485095f3203Df449D51768a78FfD79e4Ff8E' as const,
  tokenRegistry: '0xF152CF478FA4B4220378692D2E85067269525d89' as const,

  // Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

// === DEPLOYMENT SUMMARY - BNB Testnet (Chain ID 97) ===
//   LBT Token:         0x1d08F7A669E18B3B3AEce77a8C20E1Ef7536CEE6
//   GameCore:          0xEB929B5c0e71a6b785CE89f8A0fd218D92c8fB66
//   BettingCore:       0xf99a4F28E9D1cDC481a4b742bc637Af9e60e3FE5
//   BettingRouter:     0x02d49e1e3EE1Db09a7a8643Ae1BCc72169180861
//   SeasonPredictor:   0x45da13240cEce4ca92BEF34B6955c7883e5Ce9E4
//   SwapRouter:        0xD8d4485095f3203Df449D51768a78FfD79e4Ff8E
//   TokenRegistry:     0xF152CF478FA4B4220378692D2E85067269525d89
//   Protocol Treasury: 0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D
// Get admin private key from environment
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;

if (!ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY is required in environment variables');
}

// Create admin account
export const adminAccount = privateKeyToAccount(ADMIN_PRIVATE_KEY);

// RPC endpoint - use environment or default to BSC Testnet public RPC
const RPC_URL = process.env.RPC_URL || 'https://bsc-testnet.publicnode.com';

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

// Wallet client for writing transactions (admin operations)
export const walletClient = createWalletClient({
  account: adminAccount,
  chain: bscTestnet,
  transport: http(RPC_URL),
});

// Faucet configuration (LBT tokens)
export const FAUCET_CONFIG = {
  // Amount to send per request (in ether)
  FAUCET_AMOUNT: BigInt(1000 * 10 ** 18), // 1000 LBT tokens

  // Cooldown period (1 hour)
  COOLDOWN_MS: 60 * 60 * 1000,

  // Maximum requests per address per day
  MAX_DAILY_REQUESTS: 5,
};

// Referral system configuration
export const REFERRAL_CONFIG = {
  // Referral bonus (% of bet amount in basis points)
  REFERRER_BONUS_BPS: 500, // 5% of bet amount

  // Referee bonus (first-time bettor bonus)
  REFEREE_BONUS: BigInt(100 * 10 ** 18), // 100 LBT tokens

  // Maximum referral bonus per transaction
  MAX_REFERRAL_BONUS: BigInt(50 * 10 ** 18), // 50 LBT max per bet

  // Minimum bet amount to qualify for referral
  MIN_BET_FOR_REFERRAL: BigInt(10 * 10 ** 18), // 10 LBT minimum
};

// Bounty system configuration
export const BOUNTY_CONFIG = {
  // Minimum payout for bounty claims
  MIN_BOUNTY_CLAIM: BigInt(50 * 10 ** 18), // 50 LBT

  // Bounty percentage (basis points)
  BOUNTY_PERCENTAGE_BPS: 1000, // 10%

  // Claim deadline after settlement
  CLAIM_DEADLINE_HOURS: 24,

  // Sweep grace period after claim deadline
  SWEEP_GRACE_PERIOD_HOURS: 6,

  // Late claim fee (after sweep)
  LATE_CLAIM_FEE_BPS: 1500, // 15%
};

// Game monitoring intervals
export const MONITORING_CONFIG = {
  // Check game state every 30 seconds
  POLL_INTERVAL_MS: 30 * 1000,

  // Round duration from contract (3 hours - UPDATED in V2.5)
  ROUND_DURATION_MS: 3 * 60 * 60 * 1000,

  // Auto-settle delay after VRF request (5 minutes)
  VRF_SETTLEMENT_DELAY_MS: 5 * 60 * 1000,
};

export const log = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [WEB3]`;

  switch (level) {
    case 'error':
      console.error(`${prefix} ❌`, message);
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️`, message);
      break;
    default:
      console.log(`${prefix} ℹ️`, message);
  }
};
