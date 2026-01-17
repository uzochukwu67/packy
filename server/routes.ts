import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  requestFaucetTokens,
  getFaucetStats,
  getUserFaucetHistory,
  canRequestTokens,
} from "./web3/faucet";
import {
  getGameState,
  startSeason,
  startRound,
  requestMatchResults,
  settleRound,
  seedRoundPools,
  finalizeRoundRevenue,
} from "./web3/game-monitor";
import { manualSyncRound } from "./web3/event-sync";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API Routes
  app.post(api.users.getOrCreate.path, async (req, res) => {
    try {
      const input = api.users.getOrCreate.input.parse(req.body);
      let user = await storage.getUserByWallet(input.walletAddress);

      if (!user) {
        user = await storage.createUser(input);
        return res.status(201).json({
          success: true,
          user,
        });
      }

      return res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // ============ Faucet Routes ============

  /**
   * Request LEAGUE tokens from faucet
   * POST /api/faucet/request
   * Body: { address: string }
   */
  app.post('/api/faucet/request', async (req, res) => {
    try {
      const { address } = req.body;

      if (!address || typeof address !== 'string' || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address'
        });
      }

      const result = await requestFaucetTokens(address as `0x${string}`);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(429).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process faucet request'
      });
    }
  });

  /**
   * Get faucet statistics (balance, config)
   * GET /api/faucet/stats
   */
  app.get('/api/faucet/stats', async (_req, res) => {
    try {
      const stats = await getFaucetStats();
      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get faucet stats'
      });
    }
  });

  /**
   * Get user's faucet request history
   * GET /api/faucet/history/:address
   */
  app.get('/api/faucet/history/:address', async (req, res) => {
    try {
      const { address } = req.params;

      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'Invalid Ethereum address' });
      }

      const history = getUserFaucetHistory(address as `0x${string}`);
      return res.json(history);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get faucet history'
      });
    }
  });

  /**
   * Check if user can request tokens
   * GET /api/faucet/can-request/:address
   */
  app.get('/api/faucet/can-request/:address', async (req, res) => {
    try {
      const { address } = req.params;

      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'Invalid Ethereum address' });
      }

      const result = canRequestTokens(address as `0x${string}`);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to check request status'
      });
    }
  });

  // ============ Admin Game Management Routes ============

  /**
   * Get current game state
   * GET /api/admin/game-state
   */
  app.get('/api/admin/game-state', async (_req, res) => {
    try {
      const state = await getGameState();

      // Convert BigInt values to strings for JSON serialization
      const serializedState = {
        currentSeasonId: state.currentSeasonId.toString(),
        currentRoundId: state.currentRoundId.toString(),
        season: state.season ? {
          seasonId: state.season.seasonId.toString(),
          startTime: state.season.startTime.toString(),
          currentRound: state.season.currentRound.toString(),
          active: state.season.active,
          completed: state.season.completed,
          winningTeamId: state.season.winningTeamId.toString(),
        } : null,
        round: state.round ? {
          roundId: state.round.roundId.toString(),
          seasonId: state.round.seasonId.toString(),
          startTime: state.round.startTime.toString(),
          vrfRequestId: state.round.vrfRequestId.toString(),
          settled: state.round.settled,
        } : null,
        roundSettled: state.roundSettled,
        timeUntilRoundEnd: state.timeUntilRoundEnd,
        shouldRequestVRF: state.shouldRequestVRF,
        shouldSettleRound: state.shouldSettleRound,
      };

      return res.json(serializedState);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get game state'
      });
    }
  });

  /**
   * Start a new season
   * POST /api/admin/start-season
   */
  app.post('/api/admin/start-season', async (_req, res) => {
    try {
      const result = await startSeason();

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to start season'
      });
    }
  });

  /**
   * Start a new round
   * POST /api/admin/start-round
   */
  app.post('/api/admin/start-round', async (_req, res) => {
    try {
      const result = await startRound();

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to start round'
      });
    }
  });

  /**
   * Request VRF for match results
   * POST /api/admin/request-vrf
   * Body: { enableNativePayment?: boolean }
   */
  app.post('/api/admin/request-vrf', async (req, res) => {
    try {
      const { enableNativePayment = false } = req.body;
      const result = await requestMatchResults(enableNativePayment);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to request VRF'
      });
    }
  });

  /**
   * Settle round after VRF fulfillment
   * POST /api/admin/settle-round
   * Body: { roundId: string }
   */
  app.post('/api/admin/settle-round', async (req, res) => {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          success: false,
          error: 'roundId is required'
        });
      }

      const result = await settleRound(BigInt(roundId));

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to settle round'
      });
    }
  });

  /**
   * Seed round pools
   * POST /api/admin/seed-pools
   * Body: { roundId: string }
   */
  app.post('/api/admin/seed-pools', async (req, res) => {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          success: false,
          error: 'roundId is required'
        });
      }

      const result = await seedRoundPools(BigInt(roundId));

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to seed pools'
      });
    }
  });

  /**
   * Manually sync round from blockchain to database
   * POST /api/admin/sync-round
   * Body: { roundId: string }
   */
  app.post('/api/admin/sync-round', async (req, res) => {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          success: false,
          error: 'roundId is required'
        });
      }

      await manualSyncRound(BigInt(roundId));

      return res.json({
        success: true,
        message: `Round ${roundId} synced successfully`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to sync round'
      });
    }
  });

  /**
   * Finalize round revenue distribution
   * POST /api/admin/finalize-revenue
   * Body: { roundId: string }
   */
  app.post('/api/admin/finalize-revenue', async (req, res) => {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          success: false,
          error: 'roundId is required'
        });
      }

      const result = await finalizeRoundRevenue(BigInt(roundId));

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to finalize revenue'
      });
    }
  });

  // ============ Bet Tracking Routes ============

  /**
   * Save a bet to database
   * POST /api/bets
   * Body: { betId, bettor, seasonId, roundId, amount, matchIndices, outcomes, parlayMultiplier, potentialWinnings, txHash }
   */
  app.post('/api/bets', async (req, res) => {
    try {
      const { betId, bettor, seasonId, roundId, amount, matchIndices, outcomes, parlayMultiplier, potentialWinnings, txHash } = req.body;

      // Validate required fields
      if (!betId || !bettor || !seasonId || !roundId || !amount || !matchIndices || !outcomes || !parlayMultiplier || !potentialWinnings || !txHash) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      // Validate bettor address
      if (!bettor.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          error: 'Invalid bettor address'
        });
      }

      const bet = await storage.saveBet({
        betId,
        bettor,
        seasonId,
        roundId,
        amount,
        matchIndices: JSON.stringify(matchIndices),
        outcomes: JSON.stringify(outcomes),
        parlayMultiplier,
        potentialWinnings,
        status: 'pending',
        txHash
      });

      return res.json(bet);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to save bet'
      });
    }
  });

  /**
   * Get user's bets
   * GET /api/bets/:address
   * Query params: ?limit=50&offset=0&roundId=1&seasonId=1
   */
  app.get('/api/bets/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const { limit = '50', offset = '0', roundId, seasonId } = req.query;

      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'Invalid Ethereum address' });
      }

      let betsData;

      if (roundId) {
        // Get bets for specific round
        betsData = await storage.getUserBetsByRound(address, roundId as string);
      } else if (seasonId) {
        // Get bets for specific season
        betsData = await storage.getUserBetsBySeason(address, seasonId as string);
      } else {
        // Get all bets with pagination
        betsData = await storage.getUserBets(address, parseInt(limit as string), parseInt(offset as string));
      }

      // Parse JSON fields
      const formattedBets = betsData.map(bet => ({
        ...bet,
        matchIndices: JSON.parse(bet.matchIndices),
        outcomes: JSON.parse(bet.outcomes)
      }));

      return res.json(formattedBets);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get bets'
      });
    }
  });

  /**
   * Update bet status
   * PATCH /api/bets/:betId/status
   * Body: { status: 'won' | 'lost' | 'claimed' }
   */
  app.patch('/api/bets/:betId/status', async (req, res) => {
    try {
      const { betId } = req.params;
      const { status } = req.body;

      if (!status || !['won', 'lost', 'claimed'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status. Must be won, lost, or claimed'
        });
      }

      const bet = await storage.updateBetStatus(betId, status);

      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      return res.json(bet);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to update bet status'
      });
    }
  });

  // ============ Game State Routes (Cached from Database) ============

  /**
   * Get current game state with time remaining
   * GET /api/game/state
   * Returns cached data from database with real-time countdown
   */
  app.get('/api/game/state', async (_req, res) => {
    try {
      const activeRound = await storage.getActiveRound();

      if (!activeRound) {
        return res.json({
          hasActiveRound: false,
          message: 'No active round',
        });
      }

      const now = Date.now();
      const endTime = activeRound.endTime?.getTime() || 0;
      const timeRemainingMs = Math.max(0, endTime - now);

      return res.json({
        hasActiveRound: true,
        round: {
          roundId: activeRound.roundId,
          seasonId: activeRound.seasonId,
          startTime: activeRound.startTime,
          endTime: activeRound.endTime,
          timeRemainingMs,
          isActive: activeRound.isActive && timeRemainingMs > 0,
          vrfFulfilled: !!activeRound.vrfFulfilledAt,
          vrfFulfilledAt: activeRound.vrfFulfilledAt,
          settled: activeRound.settled,
          settledAt: activeRound.settledAt,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get game state'
      });
    }
  });

  /**
   * Get matches for current active round
   * GET /api/game/matches
   */
  app.get('/api/game/matches', async (_req, res) => {
    try {
      const activeRound = await storage.getActiveRound();

      if (!activeRound) {
        return res.json({
          hasActiveRound: false,
          matches: [],
        });
      }

      const matches = await storage.getMatchesByRound(activeRound.roundId);

      returnres.json({
        hasActiveRound: true,
        roundId: activeRound.roundId,
        matches,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get matches'
      });
    }
  });

  /**
   * Get matches for specific round by ID
   * GET /api/game/rounds/:roundId/matches
   */
  app.get('/api/game/rounds/:roundId/matches', async (req, res) => {
    try {
      const { roundId } = req.params;

      const round = await storage.getRoundById(roundId);
      if (!round) {
        return res.status(404).json({
          error: 'Round not found'
        });
      }

      const matches = await storage.getMatchesByRound(roundId);

      return res.json({
        round: {
          roundId: round.roundId,
          seasonId: round.seasonId,
          startTime: round.startTime,
          endTime: round.endTime,
          isActive: round.isActive,
          vrfFulfilled: !!round.vrfFulfilledAt,
          settled: round.settled,
        },
        matches,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get round matches'
      });
    }
  });

  /**
   * Get all rounds (paginated)
   * GET /api/game/rounds
   * Query params: ?limit=100&offset=0&seasonId=1
   */
  app.get('/api/game/rounds', async (req, res) => {
    try {
      const { limit = '100', offset = '0', seasonId } = req.query;

      let roundsData;

      if (seasonId) {
        // Get rounds for specific season
        roundsData = await storage.getRoundsBySeason(seasonId as string);
      } else {
        // Get all rounds with pagination
        roundsData = await storage.getAllRounds(parseInt(limit as string), parseInt(offset as string));
      }

      console.log(roundsData);
      return res.json(roundsData);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get rounds'
      });
    }
  });

  /**
   * Get specific round details
   * GET /api/game/rounds/:roundId
   */
  app.get('/api/game/rounds/:roundId', async (req, res) => {
    try {
      const { roundId } = req.params;

      const round = await storage.getRoundById(roundId);
      if (!round) {
        return res.status(404).json({
          error: 'Round not found'
        });
      }

      const now = Date.now();
      const endTime = round.endTime?.getTime() || 0;
      const timeRemainingMs = Math.max(0, endTime - now);

      return res.json({
        ...round,
        timeRemainingMs,
        isActive: round.isActive && timeRemainingMs > 0,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get round'
      });
    }
  });

  /**
   * Get round results with matches and all bets
   * GET /api/game/rounds/:roundId/results
   */
  app.get('/api/game/rounds/:roundId/results', async (req, res) => {
    try {
      const { roundId } = req.params;

      // Get round details
      const round = await storage.getRoundById(roundId);
      if (!round) {
        return res.status(404).json({
          error: 'Round not found'
        });
      }

      // Get all matches for this round
      const matches = await storage.getMatchesByRound(roundId);

      // Get all bets for this round
      const allBets = await storage.getBetsByRound(roundId);

      // Format bets with parsed JSON fields
      const formattedBets = allBets.map((bet: any) => ({
        ...bet,
        matchIndices: JSON.parse(bet.matchIndices),
        outcomes: JSON.parse(bet.outcomes),
      }));

      // Calculate statistics
      const totalBets = formattedBets.length;
      const totalVolume = formattedBets.reduce((sum: bigint, bet: any) => sum + BigInt(bet.amount), BigInt(0));
      const wonBets = formattedBets.filter((b: any) => b.status === 'won' || b.status === 'claimed').length;
      const lostBets = formattedBets.filter((b: any) => b.status === 'lost').length;
      const pendingBets = formattedBets.filter((b: any) => b.status === 'pending').length;

      return res.json({
        round: {
          roundId: round.roundId,
          seasonId: round.seasonId,
          startTime: round.startTime,
          endTime: round.endTime,
          vrfFulfilled: !!round.vrfFulfilledAt,
          settled: round.settled,
        },
        matches,
        bets: formattedBets,
        statistics: {
          totalBets,
          totalVolume: totalVolume.toString(),
          wonBets,
          lostBets,
          pendingBets,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Failed to get round results'
      });
    }
  });

  return httpServer;
}
