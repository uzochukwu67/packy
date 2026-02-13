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
      // Fetch round info from blockchain for more accurate timing
      const blockchainRound = await publicClient.readContract({
        address: CONTRACTS.gameCore,
        abi: GameCoreABI as any,
        functionName: 'rounds',
        args: [currentRoundId],
      }) as any;

      // Robust parsing for blockchainRound (array or object)
      const blockchainEndTime = Number(blockchainRound.endTime ?? blockchainRound[3] ?? 0);
      const blockchainVrfRequestId = BigInt(blockchainRound.vrfRequestId ?? blockchainRound[4] ?? 0);
      const blockchainResultsRequested = (blockchainRound.resultsRequested ?? blockchainRound[5] ?? false) as boolean;
      const blockchainSettled = (blockchainRound.settled ?? blockchainRound[6] ?? false) as boolean;

      // Debug log to identify desyncs
      log(`[DEBUG] Round ${currentRoundId} blockchain state: endTime=${blockchainEndTime}, vrfId=${blockchainVrfRequestId}, requested=${blockchainResultsRequested}, settled=${blockchainSettled}`);

      // Check if round is settled from database (fallback)
      const dbRound = await storage.getRoundById(currentRoundId.toString());
      roundSettled = blockchainSettled || (dbRound?.settled ?? false);

      if (!roundSettled) {
        // Calculate time until round end using blockchain endTime
        const now = Math.floor(Date.now() / 1000);
        timeUntilRoundEnd = Math.max(0, (blockchainEndTime - now) * 1000);

        // Should request VRF if round duration has elapsed and no VRF request yet
        // A round is considered "requested" if resultsRequested is true OR vrfRequestId is set
        const hasVrfRequest = (blockchainVrfRequestId > BigInt(0)) || blockchainResultsRequested || !!dbRound?.vrfRequestId;

        // Critical: Only request VRF if endTime is in the past and not zero
        shouldRequestVRF = blockchainEndTime > 0 && now >= blockchainEndTime && !hasVrfRequest;

        if (shouldRequestVRF) {
          log(`[DEBUG] triggering shouldRequestVRF: now=${now}, endTime=${blockchainEndTime}, hasVrfRequest=${hasVrfRequest}`);
        }

        // Should settle round if VRF fulfilled but not settled yet
        if (hasVrfRequest && !roundSettled) {
          // Check fulfillment on blockchain if needed, or rely on dbRound if sync is fast
          if (dbRound?.vrfFulfilledAt || blockchainSettled) {
            shouldSettleRound = true;
          }
        }
      }

      // Calculate time until next round starts (if current round is settled)
      if (roundSettled) {
        const settledAt = dbRound?.settledAt?.getTime() || (blockchainEndTime * 1000);
        const timeSinceSettlement = Date.now() - settledAt;
        timeUntilNextRound = Math.max(0, NEXT_ROUND_DELAY_MS - timeSinceSettlement);
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

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000
    });

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

    // Step 1: Get results from GameCore
    const results = await publicClient.readContract({
      address: CONTRACTS.gameCore,
      abi: GameCoreABI as any,
      functionName: 'getResults',
      args: [roundId],
    }) as any;

    if (!results || results.length === 0) {
      throw new Error(`No results found for round ${roundId} on GameCore`);
    }

    log(`Retrieved ${results.length} match results for settlement`);

    // Step 2: Settle on BettingCore with results
    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: CONTRACTS.bettingCore,
      abi: BettingCoreABI as any,
      functionName: 'settleRound',
      args: [roundId, results],
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000
    });

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
      functionName: 'seedRound',
      args: [roundId],
      gas: BigInt(2000000), // Increase gas limit further for seeding (seeds 10 matches)
    });

    const txHash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000
    });

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

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000
    });

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

// Game monitoring intervals
let monitoringInterval: NodeJS.Timeout | null = null;
let isInitializing = false; // Flag to prevent monitoring loop from running during setup
let lastSettledRoundId: bigint | null = null;
let roundSettledAt: number | null = null;
let wasRoundSettled = false; // Track previous settlement state to detect transitions

const NEXT_ROUND_DELAY_MS = 20 * 60 * 1000; // 20 minutes (1,200,000 ms)

export function startMonitoring() {
  if (monitoringInterval) {
    log('Monitoring already running', 'warn');
    return;
  }

  log('Starting game monitoring system...');

  // Start blockchain event listeners
  startEventListeners();

  // Initialize game on startup (check if season/round need to be started)
  isInitializing = true;
  initializeGame().catch((error: any) => {
    log(`Failed to initialize game: ${error.message}`, 'error');
  }).finally(() => {
    isInitializing = false;
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
        log(`[DEBUG] Round ${state.currentRoundId} metadata: ${JSON.stringify(roundMetadata, (key, value) => typeof value === 'bigint' ? value.toString() : value)}`);
        const isSeeded = (roundMetadata.seeded ?? roundMetadata[2]) || false;

        if (!isSeeded) {
          log(`Current round ${state.currentRoundId} is not seeded. Seeding now...`, 'warn');
          const result = await seedRoundPools(state.currentRoundId);
          if (result.success) {
            log(`✅ Round ${state.currentRoundId} seeded successfully`);
          } else {
            log(`❌ Round ${state.currentRoundId} seeding failed: ${result.error}`, 'error');
          }
        }
        else {
          log(`Round ${state.currentRoundId} is already seeded`);
        }
      }
    } catch (error: any) {
      log(`Failed to check/seed current round: ${error.message}`, 'error');
    }
  }, 8000); // Wait 8 seconds for initialization to complete

  monitoringInterval = setInterval(async () => {
    try {
      if (isInitializing) {
        log('Skipping monitoring cycle - initialization in progress', 'debug' as any);
        return;
      }

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
            // Check if already seeded before seeding (prevent race)
            const roundMetadata = await publicClient.readContract({
              address: CONTRACTS.bettingCore,
              abi: BettingCoreABI as any,
              functionName: 'getRoundMetadata',
              args: [BigInt(1)],
            }) as any;
            const isSeeded = (roundMetadata.seeded ?? roundMetadata[2]) || false;
            if (!isSeeded) {
              await seedRoundPools(BigInt(1));
            }
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
          // Check if already seeded before seeding (prevent race)
          const roundMetadata = await publicClient.readContract({
            address: CONTRACTS.bettingCore,
            abi: BettingCoreABI as any,
            functionName: 'getRoundMetadata',
            args: [newRoundId],
          }) as any;
          const isSeeded = (roundMetadata.seeded ?? roundMetadata[2]) || false;
          if (!isSeeded) {
            await seedRoundPools(newRoundId);
          }
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
        wasRoundSettled = true;
      }

      // Detect round settlement (even if settled automatically by smart contract)
      if (state.roundSettled && !wasRoundSettled && state.currentRoundId > BigInt(0)) {
        // Round just became settled (state transition detected)
        log(`Round ${state.currentRoundId} detected as settled (auto-settled by smart contract)`, 'warn');
        lastSettledRoundId = state.currentRoundId;
        roundSettledAt = Date.now();
        wasRoundSettled = true;
      }

      // Auto-start next round 20 minutes after previous round settled
      if (
        state.roundSettled &&
        lastSettledRoundId === state.currentRoundId &&
        roundSettledAt !== null
      ) {
        const timeSinceSettlement = Date.now() - roundSettledAt;

        if (timeSinceSettlement >= NEXT_ROUND_DELAY_MS) {
          // Start next round automatically
          log(`20 minutes elapsed since round ${state.currentRoundId} settled. Starting next round...`, 'warn');

          const result = await startRound();

          if (result.success) {
            // Reset settlement tracking
            lastSettledRoundId = null;
            roundSettledAt = null;
            wasRoundSettled = false; // Reset for next round
            log('✅ Next round started automatically');

            // Seed the new round pools
            const newRoundId = state.currentRoundId + BigInt(1);

            // Check if already seeded before seeding (prevent race)
            const roundMetadata = await publicClient.readContract({
              address: CONTRACTS.bettingCore,
              abi: BettingCoreABI as any,
              functionName: 'getRoundMetadata',
              args: [newRoundId],
            }) as any;
            const isSeeded = (roundMetadata.seeded ?? roundMetadata[2]) || false;

            if (!isSeeded) {
              log(`Seeding pools for round ${newRoundId}...`);
              await seedRoundPools(newRoundId);
            }
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
      const seedResult = await seedRoundPools(BigInt(1));
      if (seedResult.success) {
        log('✅ Round 1 pools seeded');
      } else {
        log(`⚠️ Round 1 pools seeding failed: ${seedResult.error}`, 'warn');
      }

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
