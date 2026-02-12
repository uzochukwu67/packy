/**
 * Blockchain Event Synchronization
 * Listens to gameCore events and syncs data to database
 */

import { publicClient, CONTRACTS, log } from './config';
import { GameCoreABI, BettingCoreABI } from './abis/index';
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
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'getRoundMatches',
      args: [roundId],
    }) as any[];

    // Save round to database
    const roundStartDate = new Date(Number(startTime) * 1000);
    const roundEndDate = new Date(Number(startTime) * 1000 + 3 * 60 * 60 * 1000); // 3 hours later (V2.5)

    await storage.saveRound({
      roundId: roundId.toString(),
      seasonId: seasonId.toString(),
      startTime: roundStartDate,
      endTime: roundEndDate,
      settled: false,
      isActive: true,
    });

    // Save matches with their initial state
    const matchRecords = matches.map((m: any, index: number) => {
      const homeTeamId = Number(m.homeTeamId ?? m[0]);
      const awayTeamId = Number(m.awayTeamId ?? m[1]);
      const homeScore = m.homeScore ?? m[2];
      const awayScore = m.awayScore ?? m[3];
      const outcome = m.outcome ?? m[4];
      const settled = m.settled ?? m[5];

      return {
        roundId: roundId.toString(),
        matchIndex: index,
        homeTeamId,
        awayTeamId,
        homeTeamName: getTeamName(homeTeamId),
        awayTeamName: getTeamName(awayTeamId),
        homeScore: homeScore !== undefined ? Number(homeScore) : null,
        awayScore: awayScore !== undefined ? Number(awayScore) : null,
        homeOdds: m.homeOdds?.toString(),
        awayOdds: m.awayOdds?.toString(),
        drawOdds: m.drawOdds?.toString(),
        outcome: getOutcome(Number(outcome)),
        settled: !!settled,
      };
    });

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
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'getRoundMatches',
      args: [roundId],
    }) as any[];

    // Update each match with scores and outcomes
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const homeScore = Number(m.homeScore ?? m[2]);
      const awayScore = Number(m.awayScore ?? m[3]);
      const outcome = Number(m.outcome ?? m[4]);
      const settled = (m.settled ?? m[5]) as boolean;

      await storage.updateMatch(roundId.toString(), i, {
        homeScore,
        awayScore,
        outcome: getOutcome(outcome),
        settled,
        settledAt: settled ? new Date() : undefined,
      });
    }

    log(`✅ Round ${roundId} results synced after VRF fulfillment`);
  } catch (error: any) {
    log(`Failed to sync VRF results for round ${roundId}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Mark round as settled in database and update bet statuses
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

    // Update all bet statuses for this round
    await updateBetStatusesForRound(roundId);
  } catch (error: any) {
    log(`Failed to mark round ${roundId} as settled: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Update bet statuses for a settled round
 */
async function updateBetStatusesForRound(roundId: bigint) {
  try {
    log(`Updating bet statuses for round ${roundId}...`);

    // Get all bets for this round from database
    const bets = await storage.getBetsByRound(roundId.toString());

    if (bets.length === 0) {
      log(`No bets found for round ${roundId}`);
      return;
    }

    log(`Found ${bets.length} bets to check for round ${roundId}`);

    // Check each bet's outcome from blockchain
    for (const bet of bets) {
      try {
        // Skip if already claimed or lost
        if (bet.status === 'claimed' || bet.status === 'lost' || bet.status === 'won') {
          continue;
        }

        // Call previewBetPayout to check if bet won
        const payoutData = await publicClient.readContract({
          address: CONTRACTS.bettingCore,
          abi: BettingCoreABI as any,
          functionName: 'previewBetPayout',
          args: [BigInt(bet.betId)],
        }) as any;

        const isWon = payoutData[0]; // First return value is bool indicating if bet won
        const newStatus = isWon ? 'won' : 'lost';

        // Update bet status in database
        await storage.updateBetStatus(bet.betId, newStatus, new Date());

        // Award points for winning bet
        if (isWon) {
          await storage.awardBetWonPoints(bet.bettor, bet.betId);
          log(`Awarded 10 points to ${bet.bettor} for winning bet ${bet.betId}`);
        }

        log(`Updated bet ${bet.betId}: ${newStatus}`);
      } catch (betError: any) {
        log(`Failed to update bet ${bet.betId}: ${betError.message}`, 'error');
      }
    }

    log(`✅ Finished updating bet statuses for round ${roundId}`);
  } catch (error: any) {
    log(`Failed to update bet statuses for round ${roundId}: ${error.message}`, 'error');
  }
}

/**
 * Sync bet placement to database and process referral rewards
 */
async function syncBetPlaced(
  betId: bigint,
  bettor: string,
  roundId: bigint,
  amount: bigint,
  parlayMultiplier: bigint,
  legCount: number
) {
  try {
    log(`Syncing bet ${betId} to database...`);

    // Check if bet already exists to prevent duplicates
    const existingBet = await storage.getBetByBetId(betId.toString());
    if (existingBet) {
      log(`Bet ${betId} already exists in database, skipping sync`, 'warn');
      return;
    }

    // Fetch full bet details from contract to get matchIndices and outcomes
    const betDetails = await publicClient.readContract({
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'getBet',
      args: [betId],
    }) as any;

    const matchIndices = betDetails.matchIndices || [];
    const outcomes = betDetails.outcomes || [];

    // Calculate potential winnings based on locked odds
    let potentialWinnings = BigInt(0);

    try {
      // Fetch locked odds for each match in the bet
      let basePayout = BigInt(0);

      for (let i = 0; i < matchIndices.length; i++) {
        const matchIndex = matchIndices[i];
        const outcome = outcomes[i];

        // Get locked odds for this match
        const oddsData = await publicClient.readContract({
          address: CONTRACTS.bettingCore,
          abi: BettingCoreABI as any,
          functionName: 'getMatchOdds',
          args: [roundId, matchIndex],
        }) as readonly [bigint, bigint, bigint, boolean];

        // oddsData = [homeOdds, awayOdds, drawOdds, locked]
        let lockedOdds: bigint;
        if (outcome === 1) lockedOdds = oddsData[0]; // home
        else if (outcome === 2) lockedOdds = oddsData[1]; // away
        else lockedOdds = oddsData[2]; // draw

        // Calculate payout for this match: amount × odds
        const matchPayout = (amount * lockedOdds) / BigInt(1e18);
        basePayout += matchPayout;
      }

      // Apply parlay multiplier to get final payout
      potentialWinnings = (basePayout * parlayMultiplier) / BigInt(1e18);

      log(`Calculated potential winnings: ${potentialWinnings.toString()} (basePayout: ${basePayout.toString()}, multiplier: ${parlayMultiplier.toString()})`);
    } catch (error: any) {
      // Fallback: simple estimate (less accurate but better than nothing)
      log(`Could not fetch locked odds, using simple estimate: ${error.message}`, 'warn');
      potentialWinnings = (amount * parlayMultiplier) / BigInt(1e18);
    }

    await storage.saveBet({
      betId: betId.toString(),
      bettor,
      seasonId: roundId.toString(), // Will be updated with actual season ID
      roundId: roundId.toString(),
      amount: amount.toString(),
      matchIndices: JSON.stringify(matchIndices.map((n: bigint) => Number(n))),
      outcomes: JSON.stringify(outcomes.map((n: number) => Number(n))),
      parlayMultiplier: parlayMultiplier.toString(),
      potentialWinnings: potentialWinnings.toString(),
      status: 'pending',
      txHash: '0x', // Will be updated from transaction logs if needed
    });

    // Award 1 point for placing a bet
    await storage.awardBetPlacedPoints(bettor, betId.toString());

    // Process referral rewards if applicable
    const { processReferralReward } = await import('./referral-system');
    await processReferralReward(bettor, betId.toString(), amount);

    log(`✅ Bet ${betId} synced to database and 1 point awarded`);
  } catch (error: any) {
    // Ignore duplicate key errors since they're harmless
    if (error.message && error.message.includes('duplicate key')) {
      log(`Bet ${betId} already exists (duplicate event), skipping`, 'warn');
    } else {
      log(`Failed to sync bet ${betId}: ${error.message}`, 'error');
    }
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
 * Update bet status when cancelled and record refund
 */
async function syncBetCancelled(betId: bigint, bettor: string, refundAmount: bigint) {
  try {
    log(`Updating bet ${betId} as cancelled...`);

    await storage.updateBetStatus(betId.toString(), 'cancelled', new Date());

    log(`✅ Bet ${betId} marked as cancelled, refund: ${refundAmount.toString()}`);
  } catch (error: any) {
    log(`Failed to update bet ${betId} cancelled status: ${error.message}`, 'error');
  }
}

/**
 * Record bounty claim to database
 */
async function syncBountyClaim(
  betId: bigint,
  claimer: string,
  bounty: bigint,
  winner: string,
  winnerAmount: bigint,
  txHash: string
) {
  try {
    log(`Recording bounty claim for bet ${betId}...`);

    // Get bet details to record full bounty claim
    const bet = await storage.getBetByBetId(betId.toString());
    if (!bet) {
      log(`Bet ${betId} not found in database`, 'warn');
      return;
    }

    // Calculate total payout (bounty + winner amount)
    const totalPayout = bounty + winnerAmount;

    // Record bounty claim
    await storage.recordBountyClaim({
      betId: betId.toString(),
      claimerAddress: claimer,
      winnerAddress: winner,
      betAmount: bet.amount,
      payout: totalPayout.toString(),
      bountyAmount: bounty.toString(),
      winnerAmount: winnerAmount.toString(),
      txHash,
    });

    // Update bet status to claimed (winner got their payout via bounty)
    await storage.updateBetStatus(betId.toString(), 'claimed', new Date());

    log(`✅ Bounty claim recorded: claimer=${claimer}, bounty=${bounty.toString()}, winner=${winner}, amount=${winnerAmount.toString()}`);
  } catch (error: any) {
    log(`Failed to record bounty claim for bet ${betId}: ${error.message}`, 'error');
  }
}

/**
 * Record round pool sweep to database
 */
async function syncRoundPoolSwept(
  roundId: bigint,
  remaining: bigint,
  protocolShare: bigint,
  seasonShare: bigint,
  txHash: string
) {
  try {
    log(`Recording round pool sweep for round ${roundId}...`);

    await storage.recordRoundSweep({
      roundId: roundId.toString(),
      remainingAmount: remaining.toString(),
      protocolShare: protocolShare.toString(),
      seasonShare: seasonShare.toString(),
      txHash,
    });

    log(`✅ Round ${roundId} sweep recorded: remaining=${remaining.toString()}, protocol=${protocolShare.toString()}, season=${seasonShare.toString()}`);
  } catch (error: any) {
    log(`Failed to record round sweep for round ${roundId}: ${error.message}`, 'error');
  }
}

/**
 * Update round when it gets seeded
 */
async function syncRoundSeeded(roundId: bigint) {
  try {
    log(`Marking round ${roundId} as seeded...`);

    await storage.updateRound(roundId.toString(), {
      seeded: true,
      seededAt: new Date(),
    });

    log(`✅ Round ${roundId} marked as seeded`);
  } catch (error: any) {
    log(`Failed to mark round ${roundId} as seeded: ${error.message}`, 'error');
  }
}

/**
 * Update round when odds are locked
 */
async function syncOddsLocked(roundId: bigint) {
  try {
    log(`Marking round ${roundId} odds as locked...`);

    await storage.updateRound(roundId.toString(), {
      oddsLocked: true,
      oddsLockedAt: new Date(),
    });

    log(`✅ Round ${roundId} odds locked`);
  } catch (error: any) {
    log(`Failed to mark round ${roundId} odds as locked: ${error.message}`, 'error');
  }
}

/**
 * Manually sync a specific round's state from blockchain to database
 * Useful for fixing desync issues or initial sync
 */
export async function manualSyncRound(roundId: bigint) {
  try {
    log(`Manual sync for round ${roundId}...`);

    // Get round data from blockchain
    const roundData = await publicClient.readContract({
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'getRound',
      args: [roundId],
    }) as any;

    const isSettled = await publicClient.readContract({
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'isRoundSettled',
      args: [roundId],
    }) as boolean;

    // Get match data
    const matches = await publicClient.readContract({
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'getRoundMatches',
      args: [roundId],
    }) as any[];

    // Update round in database
    await storage.updateRound(roundId.toString(), {
      settled: isSettled,
      isActive: !isSettled,
      settledAt: isSettled ? new Date() : undefined,
      vrfRequestId: roundData.vrfRequestId?.toString(),
      vrfFulfilledAt: roundData.settled ? new Date() : undefined,
    });

    // Update all matches
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const homeScore = Number(m.homeScore ?? m[2]);
      const awayScore = Number(m.awayScore ?? m[3]);
      const outcome = Number(m.outcome ?? m[4]);
      const settled = (m.settled ?? m[5]) as boolean;

      await storage.updateMatch(roundId.toString(), i, {
        homeScore,
        awayScore,
        outcome: getOutcome(outcome),
        settled,
        settledAt: settled ? new Date() : undefined,
      });
    }

    log(`✅ Round ${roundId} manually synced (settled: ${isSettled})`);
  } catch (error: any) {
    log(`Failed to manually sync round ${roundId}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Start listening to blockchain events using a consolidated polling loop
 */
export async function startEventListeners() {
  log('Starting blockchain event listeners (manual polling mode)...');

  let lastProcessedBlock: bigint;

  try {
    lastProcessedBlock = await publicClient.getBlockNumber();
    log(`Starting event sync from block ${lastProcessedBlock}`);
  } catch (error: any) {
    log(`Failed to get initial block number: ${error.message}`, 'error');
    lastProcessedBlock = BigInt(0); // Fallback
  }

  const pollInterval = 10000; // 10 seconds

  const poll = async () => {
    try {
      const currentBlock = await publicClient.getBlockNumber();

      if (currentBlock <= lastProcessedBlock) {
        return;
      }

      // Limit block range to avoid RPC limits (e.g., max 2000 blocks)
      const fromBlock = lastProcessedBlock + BigInt(1);
      const toBlock = currentBlock - fromBlock > BigInt(2000)
        ? fromBlock + BigInt(2000)
        : currentBlock;

      // log(`Polling events from block ${fromBlock} to ${toBlock}...`, 'debug' as any);

      // Fetch logs for gameCore
      const gameCoreLogs = await publicClient.getLogs({
        address: CONTRACTS.gameCore,
        fromBlock,
        toBlock,
      });

      // Fetch logs for bettingCore
      const bettingCoreLogs = await publicClient.getLogs({
        address: CONTRACTS.bettingCore,
        fromBlock,
        toBlock,
      });

      const allLogs = [...gameCoreLogs, ...bettingCoreLogs];

      if (allLogs.length > 0) {
        log(`Found ${allLogs.length} events in range ${fromBlock}-${toBlock}`);
      }

      // Process logs
      for (const eventLog of allLogs) {
        try {
          // Identify contract and event
          const isGameCore = eventLog.address.toLowerCase() === CONTRACTS.gameCore.toLowerCase();
          const abi = isGameCore ? GameCoreABI : BettingCoreABI;

          // Decode log
          const decodedLog = require('viem').decodeEventLog({
            abi,
            data: eventLog.data,
            topics: eventLog.topics,
          });

          const eventName = decodedLog.eventName;
          const args = decodedLog.args as any;

          // Dispatch to handlers
          if (isGameCore) {
            switch (eventName) {
              case 'RoundStarted':
                await syncRoundStart(args.roundId, args.seasonId, args.startTime);
                break;
              case 'VRFFulfilled':
                await syncVRFFulfilled(args.requestId, args.roundId);
                break;
              case 'RoundSettled':
                await syncRoundSettled(args.roundId);
                break;
            }
          } else {
            switch (eventName) {
              case 'BetPlaced':
                await syncBetPlaced(
                  args.betId,
                  args.bettor,
                  args.roundId,
                  args.amount,
                  args.parlayMultiplier,
                  args.legCount
                );
                break;
              case 'WinningsClaimed':
                await syncWinningsClaimed(args.betId, args.bettor);
                break;
              case 'BetLost':
                await syncBetLost(args.betId, args.bettor);
                break;
              case 'BetCancelled':
                await syncBetCancelled(args.betId, args.bettor, args.refundAmount);
                break;
              case 'BountyClaim':
                await syncBountyClaim(
                  args.betId,
                  args.claimer,
                  args.bounty,
                  args.winner,
                  args.winnerAmount,
                  eventLog.transactionHash!
                );
                break;
              case 'RoundPoolSwept':
                await syncRoundPoolSwept(
                  args.roundId,
                  args.remaining,
                  args.protocolShare,
                  args.seasonShare,
                  eventLog.transactionHash!
                );
                break;
              case 'RoundSettled':
                await syncRoundSettled(args.roundId);
                break;
              case 'RoundSeeded':
                await syncRoundSeeded(args.roundId);
                break;
              case 'OddsLocked':
                await syncOddsLocked(args.roundId);
                break;
            }
          }
        } catch (decodeError: any) {
          // Ignore logs that don't match our ABI/Events
          // log(`Skipping unknown event: ${decodeError.message}`, 'debug' as any);
        }
      }

      lastProcessedBlock = toBlock;

    } catch (error: any) {
      if (error.message && (error.message.includes('ECONNRESET') || error.message.includes('timeout'))) {
        log(`Polling transient error: ${error.message}`, 'warn');
      } else {
        log(`Polling error: ${error.message}`, 'error');
      }
    } finally {
      // Schedule next poll
      setTimeout(poll, pollInterval);
    }
  };

  // Start the loop
  poll();

  log('✅ Blockchain event synchronization initialized (Consolidated Polling)');
}
