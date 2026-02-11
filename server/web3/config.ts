/**
 * Web3 Configuration for Backend
 * Manages wallet, RPC, and contract addresses
 */

import { createWalletClient, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
dotenv.config();

// Contract addresses on Sepolia (NEW PROTOCOL - February 10, 2026)
// Protocol-backed model with bounty system and referrals
export const CONTRACTS = {
  // Core contracts
  leagueBetToken: '0x57741E13478e85AB34f5070566DFEEC4CA9211f5' as const,
  gameCore: '0x540443FC01F9a0d84E99059336569F34c7d7Cb38' as const,
  bettingCore: '0x0Ac3c48aBF0d1651655cD3E3E2ca8b11c32dAc5d' as const,
  bettingRouter: '0xAbc65bFd172F08e4613Bc87325f176AaEFA57EEE' as const,

  // Periphery
  seasonPredictor: '0x84E5Ac019Ca31f940A46fB65A82cad02eC1B91bc' as const,
  swapRouter: '0x81a465b85F197598aaA5F134256DD1BA5D3178f2' as const,
  tokenRegistry: '0x11795E0Ba315D8B05bD74035C2a3b9fD15d6857E' as const,

  // Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

// === DEPLOYMENT SUMMARY ===
//   LeagueBetToken: 0x57741E13478e85AB34f5070566DFEEC4CA9211f5
//   GameCore: 0x540443FC01F9a0d84E99059336569F34c7d7Cb38
//   BettingCore: 0x0Ac3c48aBF0d1651655cD3E3E2ca8b11c32dAc5d
//   BettingRouter: 0xAbc65bFd172F08e4613Bc87325f176AaEFA57EEE
//   SeasonPredictor: 0x84E5Ac019Ca31f940A46fB65A82cad02eC1B91bc
//   SwapRouter: 0x81a465b85F197598aaA5F134256DD1BA5D3178f2
//   TokenRegistry: 0x11795E0Ba315D8B05bD74035C2a3b9fD15d6857E
//   Treasury: 0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D
// Get admin private key from environment
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;

if (!ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY is required in environment variables');
}

// Create admin account
export const adminAccount = privateKeyToAccount(ADMIN_PRIVATE_KEY);

// RPC endpoint - use environment or default to Sepolia public RPC
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

// Wallet client for writing transactions (admin operations)
export const walletClient = createWalletClient({
  account: adminAccount,
  chain: sepolia,
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
