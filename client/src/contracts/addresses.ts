/**
 * Smart Contract Addresses
 * Deployed on Sepolia Testnet - V3.0 (February 11, 2026)
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

export const DEPLOYED_ADDRESSES = {
  // Core Protocol Contracts
  leagueBetToken: '0x31A88b2D9e74975C2cf588838d321f6beE1EaD38' as const,
  gameCore: '0x00cCb4D8b93A6d71728fF252B601E442D2734445' as const,
  bettingCore: '0xf0939C708EaB36A20d84C073a799a86cbc5D1F96' as const,

  // Periphery Contracts
  bettingRouter: '0x9E612B5E6808961BF284Caa95c593627187F92Ab' as const,
  seasonPredictor: '0xa80E492B3edB7e53eebA4b9d6DE1Aa938d03910B' as const,
  swapRouter: '0x0E79e6A32E5B5535a3d75932a57aa55Aa4173ca0' as const,
  tokenRegistry: '0xd133779BAfA817C770FdE6b421e2D1618183929A' as const,

  // Protocol Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

export type ContractAddresses = typeof DEPLOYED_ADDRESSES;

// === DEPLOYMENT SUMMARY (V3.0 - PROTOCOL-BACKED MODEL) ===
//   LBT Token:         0x31A88b2D9e74975C2cf588838d321f6beE1EaD38
//   GameCore:          0x00cCb4D8b93A6d71728fF252B601E442D2734445
//   BettingCore:       0xf0939C708EaB36A20d84C073a799a86cbc5D1F96
//   BettingRouter:     0x9E612B5E6808961BF284Caa95c593627187F92Ab
//   SeasonPredictor:   0xa80E492B3edB7e53eebA4b9d6DE1Aa938d03910B
//   SwapRouter:        0x0E79e6A32E5B5535a3d75932a57aa55Aa4173ca0
//   TokenRegistry:     0xd133779BAfA817C770FdE6b421e2D1618183929A
//   Protocol Treasury: 0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D