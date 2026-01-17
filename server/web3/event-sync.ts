/**
 * Blockchain Event Synchronization
 * Listens to GameEngine events and syncs data to database
 */

import { publicClient, CONTRACTS, log } from './config';
import { GameEngineABI, BettingPoolABI } from './abis/index';
import { storage } from '../storage';

// Team names (matching contract initialization)
const TEAM_NAMES = [
  "Manchester Virtual",
  "Liverpool Digital",
  "Chelsea Crypto",
  "Arsenal Web3",
  "Tottenham Chain",
  "Manchester Block",
  "Newcastle Node",
  "Brighton Token",
  "Aston Meta",
  "West Ham Hash",
  "Everton Ether",
  "Leicester Link",
  "Wolves Wallet",
  "Crystal Palace Protocol",
  "Fulham Fork",
  "Brentford Bridge",
  "Bournemouth Bytes",
  "Nottingham NFT",
  "Southampton Smart",
  "Leeds Ledger",
];

/**
 * Get team name by ID
 */
function getTeamName(teamId: number): string {
  return TEAM_NAMES[teamId] || `Team ${teamId}`;
}

/**
 * Convert contract outcome enum to string
 * 0 = PENDING, 1 = HOME_WIN, 2 = AWAY_WIN, 3 = DRAW
 */
function getOutcome(outcomeValue: number): string {
  switch (outcomeValue) {
    case 0: return 'pending';
    case 1: return 'home_win';
    case 2: return 'away_win';
    case 3: return 'draw';
    default: return 'pending';
  }
}

/**
 * Sync round data from blockchain when RoundStarted event fires
 */
export async function syncRoundStart(roundId: bigint, seasonId: bigint, startTime: bigint) {
  try {
    log(`Syncing round ${roundId} start to database...`);

    // Check if round already exists
    const existing = await storage.getRoundById(roundId.toString());
    if (existing) {
      log(`Round ${roundId} already exists in database`, 'warn');
      return;
    }

    // Fetch match data from blockchain
    const matches = await publicClient.readContract({
      address: CONTRACTS.gameEngine,
      abi: GameEngineABI as any,
      functionName: 'getRoundMatches',
      args: [roundId],
    }) as any[];

    // Save round to database
    const roundStartDate = new Date(Number(startTime) * 1000);
    const roundEndDate = new Date(Number(startTime) * 1000 + 15 * 60 * 1000); // 15 minutes later

    await storage.saveRound({
      roundId: roundId.toString(),
      seasonId: seasonId.toString(),
      startTime: roundStartDate,
      endTime: roundEndDate,
      settled: false,
      isActive: true,
    });

    // Save matches with their initial state
    const matchRecords = matches.map((match: any, index: number) => ({
      roundId: roundId.toString(),
      matchIndex: index,
      homeTeamId: Number(match.homeTeamId),
      awayTeamId: Number(match.awayTeamId),
      homeTeamName: getTeamName(Number(match.homeTeamId)),
      awayTeamName: getTeamName(Number(match.awayTeamId)),
      homeScore: match.homeScore ? Number(match.homeScore) : null,
      awayScore: match.awayScore ? Number(match.awayScore) : null,
      homeOdds: match.homeOdds?.toString(),
      awayOdds: match.awayOdds?.toString(),
      drawOdds: match.drawOdds?.toString(),
      outcome: getOutcome(Number(match.outcome)),
      settled: false,
    }));

    await storage.saveMatches(matchRecords);

    log(`✅ Round ${roundId} and ${matchRecords.length} matches synced to database`);
  } catch (error: any) {
    log(`Failed to sync round ${roundId}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Sync match results when VRF is fulfilled
 */
export async function syncVRFFulfilled(requestId: bigint, roundId: bigint) {
  try {
    log(`Syncing VRF fulfillment for round ${roundId}...`);

    // Update round VRF status
    await storage.updateRound(roundId.toString(), {
      vrfRequestId: requestId.toString(),
      vrfFulfilledAt: new Date(),
    });

    // Fetch updated matches with results from blockchain
    const matches = await publicClient.readContract({
      address: CONTRACTS.gameEngine,
      abi: GameEngineABI as any,
      functionName: 'getRoundMatches',
      args: [roundId],
    }) as any[];

    // Update each match with scores and outcomes
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      await storage.updateMatch(roundId.toString(), i, {
        homeScore: Number(match.homeScore),
        awayScore: Number(match.awayScore),
        outcome: getOutcome(Number(match.outcome)),
        settled: match.settled,
        settledAt: match.settled ? new Date() : undefined,
      });
    }

    log(`✅ Round ${roundId} results synced after VRF fulfillment`);
  } catch (error: any) {
    log(`Failed to sync VRF results for round ${roundId}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Mark round as settled in database
 */
export async function syncRoundSettled(roundId: bigint) {
  try {
    log(`Marking round ${roundId} as settled...`);

    await storage.updateRound(roundId.toString(), {
      settled: true,
      settledAt: new Date(),
      isActive: false,
    });

    log(`✅ Round ${roundId} marked as settled in database`);
  } catch (error: any) {
    log(`Failed to mark round ${roundId} as settled: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Sync bet placement to database
 */
async function syncBetPlaced(
  betId: bigint,
  bettor: string,
  roundId: bigint,
  amount: bigint,
  bonus: bigint,
  parlayMultiplier: bigint,
  matchIndices: readonly bigint[],
  outcomes: readonly number[]
) {
  try {
    log(`Syncing bet ${betId} to database...`);

    // Calculate potential winnings
    const totalStake = amount + bonus;
    const potentialWinnings = (totalStake * parlayMultiplier) / BigInt(1e18);

    await storage.saveBet({
      betId: betId.toString(),
      bettor,
      seasonId: roundId.toString(), // Will be updated with actual season ID
      roundId: roundId.toString(),
      amount: amount.toString(),
      matchIndices: JSON.stringify(matchIndices.map(n => Number(n))),
      outcomes: JSON.stringify(outcomes.map(n => Number(n))),
      parlayMultiplier: parlayMultiplier.toString(),
      potentialWinnings: potentialWinnings.toString(),
      status: 'pending',
      txHash: '0x', // Will be updated from transaction logs if needed
    });

    log(`✅ Bet ${betId} synced to database`);
  } catch (error: any) {
    log(`Failed to sync bet ${betId}: ${error.message}`, 'error');
  }
}

/**
 * Update bet status when winnings are claimed
 */
async function syncWinningsClaimed(betId: bigint, bettor: string) {
  try {
    log(`Updating bet ${betId} as claimed...`);

    await storage.updateBetStatus(betId.toString(), 'claimed', new Date());

    log(`✅ Bet ${betId} marked as claimed`);
  } catch (error: any) {
    log(`Failed to update bet ${betId} claim status: ${error.message}`, 'error');
  }
}

/**
 * Update bet status when it's marked as lost
 */
async function syncBetLost(betId: bigint, bettor: string) {
  try {
    log(`Updating bet ${betId} as lost...`);

    await storage.updateBetStatus(betId.toString(), 'lost', new Date());

    log(`✅ Bet ${betId} marked as lost`);
  } catch (error: any) {
    log(`Failed to update bet ${betId} lost status: ${error.message}`, 'error');
  }
}

/**
 * Start listening to blockchain events
 */
export function startEventListeners() {
  log('Starting blockchain event listeners...');

  // ============ GameEngine Events ============

  // Listen for RoundStarted event
  publicClient.watchContractEvent({
    address: CONTRACTS.gameEngine,
    abi: GameEngineABI as any,
    eventName: 'RoundStarted',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const { roundId, seasonId, startTime } = eventLog.args as any;
        await syncRoundStart(roundId, seasonId, startTime);
      }
    },
    onError: (error: any) => {
      log(`RoundStarted event error: ${error.message}`, 'error');
    },
  });

  // Listen for VRFFulfilled event
  publicClient.watchContractEvent({
    address: CONTRACTS.gameEngine,
    abi: GameEngineABI as any,
    eventName: 'VRFFulfilled',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const { requestId, roundId } = eventLog.args as any;
        await syncVRFFulfilled(requestId, roundId);
      }
    },
    onError: (error: any) => {
      log(`VRFFulfilled event error: ${error.message}`, 'error');
    },
  });

  // Listen for RoundSettled event (from GameEngine)
  publicClient.watchContractEvent({
    address: CONTRACTS.gameEngine,
    abi: GameEngineABI as any,
    eventName: 'RoundSettled',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const { roundId } = eventLog.args as any;
        await syncRoundSettled(roundId);
      }
    },
    onError: (error: any) => {
      log(`RoundSettled event error: ${error.message}`, 'error');
    },
  });

  // ============ BettingPool Events ============

  // Listen for BetPlaced event
  publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BettingPoolABI as any,
    eventName: 'BetPlaced',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const {
          betId,
          bettor,
          roundId,
          amount,
          bonus,
          parlayMultiplier,
          matchIndices,
          outcomes
        } = eventLog.args as any;

        await syncBetPlaced(
          betId,
          bettor,
          roundId,
          amount,
          bonus,
          parlayMultiplier,
          matchIndices,
          outcomes
        );
      }
    },
    onError: (error: any) => {
      log(`BetPlaced event error: ${error.message}`, 'error');
    },
  });

  // Listen for WinningsClaimed event
  publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BettingPoolABI as any,
    eventName: 'WinningsClaimed',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const { betId, bettor } = eventLog.args as any;
        await syncWinningsClaimed(betId, bettor);
      }
    },
    onError: (error: any) => {
      log(`WinningsClaimed event error: ${error.message}`, 'error');
    },
  });

  // Listen for BetLost event
  publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BettingPoolABI as any,
    eventName: 'BetLost',
    onLogs: async (logs: any[]) => {
      for (const eventLog of logs) {
        const { betId, bettor } = eventLog.args as any;
        await syncBetLost(betId, bettor);
      }
    },
    onError: (error: any) => {
      log(`BetLost event error: ${error.message}`, 'error');
    },
  });

  log('✅ Blockchain event listeners started (GameEngine + BettingPool)');
}
