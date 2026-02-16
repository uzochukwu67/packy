/**
 * Smart Contract Addresses
 * Deployed on BNB Testnet (Chain ID 97) - V3.0 (February 12, 2026)
 *
 * KEY UPDATES in V3.0 (Protocol-Backed Model):
 * - Removed liquidity pool system completely
 * - Protocol-backed reserves for all payouts
 * - Virtual seeding (no LP funds required)
 * - Bounty system for claiming others' winnings (10% bounty)
 * - Referral system (5% referrer bonus + 100 LBT referee bonus)
 * - Odds compression [1.25x - 2.05x] for better UX
 * - Round duration: 3 hours
 */
// # Deployed Contract Addresses (Updated: 2026-02-13 - VRF Config Update)
// LBT_TOKEN="0x3007063d51518e66C9e4Ff2Dc9cBcd4d8117E66c"
// GAME_CORE="0xa5bE0faf9f7C59f60e40f9192E721DA6cB716F5f"
// BETTING_CORE="0xc6C9f26b9FEF101A182B83458A7C87b689bE7d07"
// SEASON_PREDICTOR="0x100ffE2c1c17A8DbA94452Dd9e92256eb8A5c45F"
// BETTING_ROUTER="0x4a3842c82BcA361f4C6c69aa922407024253336d"
// SWAP_ROUTER="0x11237D3668c80a9AaC3392d6a0269004968393A1"
// TOKEN_REGISTRY="0x958a4d5a424104cC7d384d84bF71F46C6fAA6a27"

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

export type ContractAddresses = typeof DEPLOYED_ADDRESSES;

