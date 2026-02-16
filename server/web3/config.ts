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
  // Core Protocol Contracts
  leagueBetToken: '0x3007063d51518e66C9e4Ff2Dc9cBcd4d8117E66c' as const,
  gameCore: '0xa5bE0faf9f7C59f60e40f9192E721DA6cB716F5f' as const,
  bettingCore: '0xc6C9f26b9FEF101A182B83458A7C87b689bE7d07' as const,

  // Periphery Contracts
  bettingRouter: '0x4a3842c82BcA361f4C6c69aa922407024253336d' as const,
  seasonPredictor: '0x100ffE2c1c17A8DbA94452Dd9e92256eb8A5c45F' as const,
  swapRouter: '0x11237D3668c80a9AaC3392d6a0269004968393A1' as const,
  tokenRegistry: '0x958a4d5a424104cC7d384d84bF71F46C6fAA6a27' as const,

  // Protocol Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;


export const DEPLOYED_ADDRESSES = {
  // Core Protocol Contracts
  leagueBetToken: '0x3007063d51518e66C9e4Ff2Dc9cBcd4d8117E66c' as const,
  gameCore: '0xa5bE0faf9f7C59f60e40f9192E721DA6cB716F5f' as const,
  bettingCore: '0xc6C9f26b9FEF101A182B83458A7C87b689bE7d07' as const,

  // Periphery Contracts
  bettingRouter: '0x4a3842c82BcA361f4C6c69aa922407024253336d' as const,
  seasonPredictor: '0x100ffE2c1c17A8DbA94452Dd9e92256eb8A5c45F' as const,
  swapRouter: '0x11237D3668c80a9AaC3392d6a0269004968393A1' as const,
  tokenRegistry: '0x958a4d5a424104cC7d384d84bF71F46C6fAA6a27' as const,

  // Protocol Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

// === DEPLOYMENT SUMMARY - BNB Testnet (Chain ID 97) ===
//   LBT Token:         0xdf388312ac12e0d4dbB25d24fD3B2806e14423e2
//   GameCore:          0x02fD62cCBb2DF02583db6cAddF00c0bAEa8C7204
//   BettingCore:       0x86A391449E0259Cd5DbFcEbbbac839573Ced5Cfd
//   BettingRouter:     0xa0B5CCed676202888192345E38b8CeE5B219B1e9
//   SeasonPredictor:   0xda8cF81bEe9D65Dc17661421605b16a1De65671C
//   SwapRouter:        0xE4c3C52eA813158E01318961230f1a37F130f862
//   TokenRegistry:     0x5f2c8a6a7D30def120Fe7802a7d816750EB99429
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
