/**
 * gameCore Monitoring System
 * Monitors game state and provides admin controls
 */

import { publicClient, walletClient, CONTRACTS, MONITORING_CONFIG, log } from './config';
import { GameCoreABI, BettingCoreABI } from './abis/index';
import { storage } from '../storage';
import { startEventListeners, syncRoundStart } from './event-sync';

export interface GameState {
  currentSeasonId: bigint;
  currentRoundId: bigint;
  roundSettled: boolean;
  timeUntilRoundEnd?: number;
  timeUntilNextRound?: number;
  shouldRequestVRF: boolean;
  shouldSettleRound: boolean;
}

/**
 * Get current game state
 */
export async function getGameState(): Promise<GameState> {
  try {
    // Read current season and round IDs
    const [currentSeasonId, currentRoundId] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.gameCore,
        abi: GameCoreABI as any,
        functionName: 'getCurrentSeason',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: CONTRACTS.gameCore,
        abi: GameCoreABI as any,
        functionName: 'getCurrentRound',
      }) as Promise<bigint>,
    ]);

    let roundSettled = false;
    let timeUntilRoundEnd = undefined;
    let timeUntilNextRound = undefined;
    let shouldRequestVRF = false;
    let shouldSettleRound = false;

    // Check round status if round exists
    if (currentRoundId > BigInt(0)) {
      // Check if round is settled from database (more reliable than blockchain state)
      const dbRound = await storage.getRoundById(currentRoundId.toString());

      if (dbRound) {
        roundSettled = dbRound.settled;

        // Calculate time until round end
        if (!roundSettled && dbRound.startTime) {
          const roundStartTime = dbRound.startTime.getTime();
          const roundEndTime = roundStartTime + MONITORING_CONFIG.ROUND_DURATION_MS;
          timeUntilRoundEnd = Math.max(0, roundEndTime - Date.now());

          // Should request VRF if round duration has elapsed and no VRF request yet
          shouldRequestVRF = timeUntilRoundEnd === 0 && !dbRound.vrfRequestId;

          // Should settle round if VRF fulfilled but not settled yet
          if (dbRound.vrfRequestId && dbRound.vrfFulfilledAt && !roundSettled) {
            shouldSettleRound = true;
          }
        }

        // Calculate time until next round starts (if current round is settled)
        if (roundSettled && dbRound.settledAt) {
          const timeSinceSettlement = Date.now() - dbRound.settledAt.getTime();
          timeUntilNextRound = Math.max(0, NEXT_ROUND_DELAY_MS - timeSinceSettlement);
        }
      }
    }

    return {
      currentSeasonId,
      currentRoundId,
      roundSettled,
      timeUntilRoundEnd,
      timeUntilNextRound,
      shouldRequestVRF,
      shouldSettleRound,
    };
  } catch (error: any) {
    log(`Failed to get game state: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Start a new season
 */
export async function startSeason(): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    log('Starting new season...');

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'startSeason',
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Season started | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to start season: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Start a new round
 */
export async function startRound(): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    log('Starting new round...');

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'startRound',
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Round started | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to start round: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Request VRF randomness for match results
 */
export async function requestMatchResults(enableNativePayment = false): Promise<{
  success: boolean;
  txHash?: string;
  requestId?: bigint;
  error?: string;
}> {
  try {
    log('Requesting VRF for match results...');

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'requestMatchResults',
      args: [enableNativePayment], // ABI shows no parameters - needs regeneration
    });

    const txHash = await walletClient.writeContract(request);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Extract request ID from event logs
    // For now, we'll return success without request ID
    // In production, parse the VRFRequested event

    log(`✅ VRF requested | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to request VRF: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Settle round after VRF fulfillment
 */
export async function settleRound(roundId: bigint): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    log(`Settling round ${roundId}...`);

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'settleRound',
      args: [roundId],
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Round ${roundId} settled | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to settle round: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Seed round pools (must be called before betting starts)
 */
export async function seedRoundPools(roundId: bigint): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    log(`Seeding pools for round ${roundId}...`);

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'seedRoundPools',
      args: [roundId],
      gas: BigInt(500000), // Increase gas limit for seeding (seeds 10 matches)
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Round ${roundId} pools seeded | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to seed round pools: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Finalize round revenue distribution
 */
export async function finalizeRoundRevenue(roundId: bigint): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    log(`Finalizing revenue for round ${roundId}...`);

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'finalizeRoundRevenue',
      args: [roundId],
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Round ${roundId} revenue finalized | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to finalize round revenue: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Sweep round pool (after bounty claim deadline + grace period)
 * Transfers unclaimed winnings to protocol and season pool
 */
export async function sweepRoundPool(roundId: bigint): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    log(`Sweeping pool for round ${roundId}...`);

    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'sweepRoundPool',
      args: [roundId],
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    log(`✅ Round ${roundId} pool swept | TX: ${txHash}`);

    return { success: true, txHash };
  } catch (error: any) {
    log(`Failed to sweep round pool: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Automated monitoring loop (run in background)
 */
let monitoringInterval: NodeJS.Timeout | null = null;
let lastSettledRoundId: bigint | null = null;
let roundSettledAt: number | null = null;

const NEXT_ROUND_DELAY_MS = 100 * 60 * 10; // 10 minutes

export function startMonitoring() {
  if (monitoringInterval) {
    log('Monitoring already running', 'warn');
    return;
  }

  log('Starting game monitoring system...');

  // Start blockchain event listeners
  startEventListeners();

  // Initialize game on startup (check if season/round need to be started)
  initializeGame().catch((error: any) => {
    log(`Failed to initialize game: ${error.message}`, 'error');
  });

  // Check and seed current round if needed (after initialization)
  setTimeout(async () => {
    try {
      const state = await getGameState();
      if (state.currentRoundId > BigInt(0)) {
        // Check if current round is seeded by reading round metadata
        const roundMetadata = await publicClient.readContract({
          address: CONTRACTS.bettingCore,
          abi: BettingCoreABI as any,
          functionName: 'getRoundMetadata',
          args: [state.currentRoundId],
        }) as any;

        const isSeeded = roundMetadata.seeded || false;

        if (!isSeeded) {
          log(`Current round ${state.currentRoundId} is not seeded. Seeding now...`, 'warn');
          await seedRoundPools(state.currentRoundId);
          log(`✅ Round ${state.currentRoundId} seeded`);
        } else {
          log(`Round ${state.currentRoundId} is already seeded`);
        }
      }
    } catch (error: any) {
      log(`Failed to check/seed current round: ${error.message}`, 'error');
    }
  }, 8000); // Wait 8 seconds for initialization to complete

  monitoringInterval = setInterval(async () => {
    try {
      const state = await getGameState();
      const dbRound = state.currentRoundId > BigInt(0)
        ? await storage.getRoundById(state.currentRoundId.toString())
        : null;

      // Auto-start season if no season exists (fresh contract)
      if (state.currentSeasonId === BigInt(0)) {
        log('No active season found. Auto-starting season...', 'warn');
        const result = await startSeason();
        if (result.success) {
          log('✅ Season auto-started successfully');
          // Wait a bit for season to be confirmed, then start first round
          await new Promise(resolve => setTimeout(resolve, 5000));
          const roundResult = await startRound();
          if (roundResult.success) {
            log('✅ First round auto-started successfully');
            // Seed the first round
            await seedRoundPools(BigInt(1));
          }
        }
        return; // Skip rest of monitoring this cycle
      }

      // Auto-start round if season exists but no round (shouldn't happen normally)
      if (state.currentSeasonId > BigInt(0) && state.currentRoundId === BigInt(0)) {
        log('Active season found but no round. Auto-starting round...', 'warn');
        const result = await startRound();
        if (result.success) {
          log('✅ Round auto-started successfully');
          const newRoundId = BigInt(1);
          await seedRoundPools(newRoundId);
        }
        return;
      }

      // Check if round time expired and mark as inactive
      if (dbRound && state.timeUntilRoundEnd === 0 && dbRound.isActive) {
        await storage.updateRound(dbRound.roundId, {
          isActive: false,
          endTime: new Date(),
        });
        log(`⏱️  Round ${dbRound.roundId} betting period ended`);
      }

      // Auto-request VRF if round duration elapsed
      if (state.shouldRequestVRF) {
        log('Round duration elapsed. Auto-requesting VRF...', 'warn');
        await requestMatchResults();
      }

      // Auto-settle round if VRF fulfilled
      if (state.shouldSettleRound && state.currentRoundId > BigInt(0)) {
        log('VRF fulfilled. Auto-settling round...', 'warn');
        await settleRound(state.currentRoundId);

        // Record when this round was settled
        lastSettledRoundId = state.currentRoundId;
        roundSettledAt = Date.now();
      }

      // Auto-start next round 10 minutes after previous round settled
      if (
        state.roundSettled &&
        lastSettledRoundId === state.currentRoundId &&
        roundSettledAt !== null
      ) {
        const timeSinceSettlement = Date.now() - roundSettledAt;

        if (timeSinceSettlement >= NEXT_ROUND_DELAY_MS) {
          // Start next round automatically
          log(`10 minutes elapsed since round ${state.currentRoundId} settled. Starting next round...`, 'warn');

          const result = await startRound();

          if (result.success) {
            // Reset settlement tracking
            lastSettledRoundId = null;
            roundSettledAt = null;
            log('✅ Next round started automatically');

            // Seed the new round pools
            const newRoundId = state.currentRoundId + BigInt(1);
            log(`Seeding pools for round ${newRoundId}...`);
            await seedRoundPools(newRoundId);
          } else {
            log(`Failed to auto-start next round: ${result.error}`, 'error');
          }
        } else {
          const remainingTime = Math.ceil((NEXT_ROUND_DELAY_MS - timeSinceSettlement) / 1000 / 60);
          log(`⏳ Next round starts in ${remainingTime} minutes`);
        }
      }
    } catch (error: any) {
      log(`Monitoring error: ${error.message}`, 'error');
    }
  }, MONITORING_CONFIG.POLL_INTERVAL_MS);

  log('✅ Game monitoring started');
}

/**
 * Initialize game on startup - start season and round if needed
 */
async function initializeGame() {
  try {
    const state = await getGameState();
   
    // Case 1: No season exists (fresh contract) - start season and first round
    if (state.currentSeasonId === BigInt(0)) {
      log('🚀 Fresh contract detected. Starting season and first round...', 'warn');

      const seasonResult = await startSeason();
      if (!seasonResult.success) {
        log(`Failed to start season: ${seasonResult.error}`, 'error');
        return;
      }

      log('✅ Season 1 started');

      // Wait for season transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));

      const roundResult = await startRound();
      if (!roundResult.success) {
        log(`Failed to start first round: ${roundResult.error}`, 'error');
        return;
      }

      log('✅ Round 1 started');

      // Seed the first round
      
      log('✅ Round 1 pools seeded');

      return;
    }

    // Case 2: Season exists but no round - start first round of season
    if (state.currentSeasonId > BigInt(0) && state.currentRoundId === BigInt(0)) {
      log('Active season found but no round. Starting first round...', 'warn');

      const roundResult = await startRound();
      if (!roundResult.success) {
        log(`Failed to start round: ${roundResult.error}`, 'error');
        return;
      }

      log('✅ Round started');
      await seedRoundPools(BigInt(1));
      log('✅ Round pools seeded');

      return;
    }

    // Case 3: Round exists - check if synced to database
    if (state.currentRoundId > BigInt(0)) {
      const existingRound = await storage.getRoundById(state.currentRoundId.toString());

      if (!existingRound) {
        log(`Current round ${state.currentRoundId} not in database - will be synced by RoundStarted event listener`);
      } else {
        log(`✅ Round ${state.currentRoundId} already in database`);
      }
    }

    log('✅ Game initialization complete');
  } catch (error: any) {
    log(`Failed to initialize game: ${error.message}`, 'error');
  }
}

export function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    log('Game monitoring stopped');
  }
}
