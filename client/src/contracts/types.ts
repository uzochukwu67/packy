/**
 * TypeScript types matching Solidity contract structs
 */

// ============ GameEngine Types ============

export enum MatchOutcome {
  PENDING = 0,
  HOME_WIN = 1,
  AWAY_WIN = 2,
  DRAW = 3,
}

export type Match = {
  homeTeamId: bigint;
  awayTeamId: bigint;
  homeScore: number;
  awayScore: number;
  outcome: MatchOutcome;
  settled: boolean;
  homeOdds: bigint;
  awayOdds: bigint;
  drawOdds: bigint;
};

export type Team = {
  name: string;
  wins: bigint;
  draws: bigint;
  losses: bigint;
  points: bigint;
  goalsFor: bigint;
  goalsAgainst: bigint;
};

export type Season = {
  seasonId: bigint;
  startTime: bigint;
  currentRound: bigint;
  active: boolean;
  completed: boolean;
  winningTeamId: bigint;
};

export type Round = {
  roundId: bigint;
  seasonId: bigint;
  startTime: bigint;
  vrfRequestId: bigint;
  settled: boolean;
  matches: readonly [
    Match, Match, Match, Match, Match,
    Match, Match, Match, Match, Match
  ];
};

// ============ BettingPool Types ============

export type MatchPool = {
  homeWinPool: bigint;
  awayWinPool: bigint;
  drawPool: bigint;
  totalPool: bigint;
};

export type Prediction = {
  matchIndex: bigint;
  predictedOutcome: number; // 1=HOME_WIN, 2=AWAY_WIN, 3=DRAW
  amountInPool: bigint;
};

export type Bet = {
  bettor: `0x${string}`;
  roundId: bigint;
  amount: bigint;
  bonus: bigint;
  predictions: Prediction[];
  settled: boolean;
  claimed: boolean;
};

export type RoundAccounting = {
  totalBetVolume: bigint;
  totalReservedForWinners: bigint;
  protocolRevenueShare: bigint;
  seasonRevenueShare: bigint;
  parlayCount: bigint;
};

// ============ Frontend Helper Types ============

export type MatchOdds = {
  homeOdds: bigint;
  awayOdds: bigint;
  drawOdds: bigint;
};

export type ParlayInfo = {
  currentMultiplier: bigint;
  currentTier: bigint;
  parlaysLeftInTier: bigint;
  nextTierMultiplier: bigint;
};

export type BetPayout = {
  won: boolean;
  basePayout: bigint;
  finalPayout: bigint;
  parlayMultiplier: bigint;
};

// ============ Helper Functions ============

/**
 * Convert bigint odds to decimal (e.g., 1.5e18 => 1.5)
 */
export function formatOdds(odds: bigint): number {
  return Number(odds) / 1e18;
}

/**
 * Convert decimal odds to bigint (e.g., 1.5 => 1.5e18)
 */
export function parseOdds(odds: number): bigint {
  return BigInt(Math.floor(odds * 1e18));
}

/**
 * Format token amount from wei to ether
 */
export function formatToken(amount: bigint, decimals = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.replace(/0+$/, '');

  return `${Number(whole).toFixed(3)}`;
}

/**
 * Parse token amount from ether to wei
 */
export function parseToken(amount: string, decimals = 18): bigint {
  const parts = amount.split('.');
  const whole = BigInt(parts[0] || '0');
  const fraction = parts[1] || '';

  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const fractionBigInt = BigInt(paddedFraction);

  return whole * BigInt(10 ** decimals) + fractionBigInt;
}

/**
 * Get outcome label from enum value
 */
export function getOutcomeLabel(outcome: MatchOutcome): string {
  switch (outcome) {
    case MatchOutcome.HOME_WIN: return 'Home Win';
    case MatchOutcome.AWAY_WIN: return 'Away Win';
    case MatchOutcome.DRAW: return 'Draw';
    default: return 'Pending';
  }
}

/**
 * Calculate potential payout
 */
export function calculatePayout(stake: bigint, odds: bigint): bigint {
  return (stake * odds) / BigInt(1e18);
}
