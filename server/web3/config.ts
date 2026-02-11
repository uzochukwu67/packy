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
  leagueBetToken: '0x31A88b2D9e74975C2cf588838d321f6beE1EaD38' as const,
  gameCore: '0x00cCb4D8b93A6d71728fF252B601E442D2734445' as const,
  bettingCore: '0xf0939C708EaB36A20d84C073a799a86cbc5D1F96' as const,
  bettingRouter: '0x9E612B5E6808961BF284Caa95c593627187F92Ab' as const,

  // Periphery
  seasonPredictor: '0xa80E492B3edB7e53eebA4b9d6DE1Aa938d03910B' as const,
  swapRouter: '0x0E79e6A32E5B5535a3d75932a57aa55Aa4173ca0' as const,
  tokenRegistry: '0xd133779BAfA817C770FdE6b421e2D1618183929A' as const,

  // Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

// === DEPLOYMENT SUMMARY ===
//   LeagueBetToken: 0x31A88b2D9e74975C2cf588838d321f6beE1EaD38
//   GameCore: 0x00cCb4D8b93A6d71728fF252B601E442D2734445
//   BettingCore: 0xf0939C708EaB36A20d84C073a799a86cbc5D1F96
//   BettingRouter: 0x9E612B5E6808961BF284Caa95c593627187F92Ab
//   SeasonPredictor: 0xa80E492B3edB7e53eebA4b9d6DE1Aa938d03910B
//   SwapRouter: 0x0E79e6A32E5B5535a3d75932a57aa55Aa4173ca0
//   TokenRegistry: 0xd133779BAfA817C770FdE6b421e2D1618183929A
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
