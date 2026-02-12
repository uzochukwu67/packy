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

export const DEPLOYED_ADDRESSES = {
  // Core Protocol Contracts
  leagueBetToken: '0xdf388312ac12e0d4dbB25d24fD3B2806e14423e2' as const,
  gameCore: '0x02fD62cCBb2DF02583db6cAddF00c0bAEa8C7204' as const,
  bettingCore: '0x86A391449E0259Cd5DbFcEbbbac839573Ced5Cfd' as const,

  // Periphery Contracts
  bettingRouter: '0xa0B5CCed676202888192345E38b8CeE5B219B1e9' as const,
  seasonPredictor: '0xda8cF81bEe9D65Dc17661421605b16a1De65671C' as const,
  swapRouter: '0xE4c3C52eA813158E01318961230f1a37F130f862' as const,
  tokenRegistry: '0x5f2c8a6a7D30def120Fe7802a7d816750EB99429' as const,

  // Protocol Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

export type ContractAddresses = typeof DEPLOYED_ADDRESSES;

// === DEPLOYMENT SUMMARY (V3.0 - PROTOCOL-BACKED MODEL) ===
//   LBT Token:         0xdf388312ac12e0d4dbB25d24fD3B2806e14423e2
//   GameCore:          0x02fD62cCBb2DF02583db6cAddF00c0bAEa8C7204
//   BettingCore:       0x86A391449E0259Cd5DbFcEbbbac839573Ced5Cfd
//   BettingRouter:     0xa0B5CCed676202888192345E38b8CeE5B219B1e9
//   SeasonPredictor:   0xda8cF81bEe9D65Dc17661421605b16a1De65671C
//   SwapRouter:        0xE4c3C52eA813158E01318961230f1a37F130f862
//   TokenRegistry:     0x5f2c8a6a7D30def120Fe7802a7d816750EB99429
//   Protocol Treasury: 0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D