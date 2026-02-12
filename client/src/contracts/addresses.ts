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
  leagueBetToken: '0x1d08F7A669E18B3B3AEce77a8C20E1Ef7536CEE6' as const,
  gameCore: '0xEB929B5c0e71a6b785CE89f8A0fd218D92c8fB66' as const,
  bettingCore: '0xf99a4F28E9D1cDC481a4b742bc637Af9e60e3FE5' as const,

  // Periphery Contracts
  bettingRouter: '0x02d49e1e3EE1Db09a7a8643Ae1BCc72169180861' as const,
  seasonPredictor: '0x45da13240cEce4ca92BEF34B6955c7883e5Ce9E4' as const,
  swapRouter: '0xD8d4485095f3203Df449D51768a78FfD79e4Ff8E' as const,
  tokenRegistry: '0xF152CF478FA4B4220378692D2E85067269525d89' as const,

  // Protocol Treasury
  treasury: '0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D' as const,
} as const;

export type ContractAddresses = typeof DEPLOYED_ADDRESSES;

// === DEPLOYMENT SUMMARY (V3.0 - PROTOCOL-BACKED MODEL) ===
//   LBT Token:         0x57741E13478e85AB34f5070566DFEEC4CA9211f5
//   GameCore:          0x540443FC01F9a0d84E99059336569F34c7d7Cb38
//   BettingCore:       0x0Ac3c48aBF0d1651655cD3E3E2ca8b11c32dAc5d
//   BettingRouter:     0xAbc65bFd172F08e4613Bc87325f176AaEFA57EEE
//   SeasonPredictor:   0x84E5Ac019Ca31f940A46fB65A82cad02eC1B91bc
//   SwapRouter:        0x81a465b85F197598aaA5F134256DD1BA5D3178f2
//   TokenRegistry:     0x11795E0Ba315D8B05bD74035C2a3b9fD15d6857E
//   Protocol Treasury: 0x05f463129c9ce4Efb331c45b2F1A6a8E095c790D