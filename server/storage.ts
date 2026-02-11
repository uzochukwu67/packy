import { db } from "./db";
import {
  users,
  bets,
  rounds,
  matches,
  userPoints,
  pointsHistory,
  referrals,
  referralEarnings,
  bountyClaims,
  roundSweeps,
  type User,
  type InsertUser,
  type Bet,
  type InsertBet,
  type Round,
  type InsertRound,
  type Match,
  type InsertMatch,
  type UserPoints,
  type InsertUserPoints,
  type PointsHistory,
  type InsertPointsHistory,
  type Referral,
  type InsertReferral,
  type ReferralEarning,
  type InsertReferralEarning,
  type BountyClaim,
  type InsertBountyClaim,
  type RoundSweep,
  type InsertRoundSweep
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bet operations
  saveBet(bet: InsertBet): Promise<Bet>;
  getBetByBetId(betId: string): Promise<Bet | undefined>;
  getUserBets(walletAddress: string, limit?: number, offset?: number): Promise<Bet[]>;
  getUserBetsByRound(walletAddress: string, roundId: string): Promise<Bet[]>;
  getUserBetsBySeason(walletAddress: string, seasonId: string): Promise<Bet[]>;
  getBetsByRound(roundId: string): Promise<Bet[]>;
  updateBetStatus(betId: string, status: string, settledAt?: Date): Promise<Bet | undefined>;

  // Round operations
  saveRound(round: InsertRound): Promise<Round>;
  getRoundById(roundId: string): Promise<Round | undefined>;
  updateRound(roundId: string, updates: Partial<InsertRound>): Promise<Round | undefined>;
  getActiveRound(): Promise<Round | undefined>;
  getAllRounds(limit?: number, offset?: number): Promise<Round[]>;
  getRoundsBySeason(seasonId: string): Promise<Round[]>;

  // Match operations
  saveMatch(match: InsertMatch): Promise<Match>;
  saveMatches(matches: InsertMatch[]): Promise<Match[]>;
  getMatchesByRound(roundId: string): Promise<Match[]>;
  updateMatch(roundId: string, matchIndex: number, updates: Partial<InsertMatch>): Promise<Match | undefined>;

  // Points operations
  getUserPoints(walletAddress: string): Promise<UserPoints | undefined>;
  initializeUserPoints(walletAddress: string): Promise<UserPoints>;
  awardBetPlacedPoints(walletAddress: string, betId: string): Promise<void>;
  awardBetWonPoints(walletAddress: string, betId: string): Promise<void>;
  getPointsHistory(walletAddress: string, limit?: number): Promise<PointsHistory[]>;
  getLeaderboard(limit?: number): Promise<UserPoints[]>;

  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByReferee(refereeAddress: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerAddress: string): Promise<Referral[]>;
  updateReferralEarnings(referrerAddress: string, refereeAddress: string, amount: string): Promise<void>;
  recordReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning>;
  getReferralEarnings(referrerAddress: string, limit?: number): Promise<ReferralEarning[]>;
  getTotalReferralEarnings(referrerAddress: string): Promise<string>;

  // Bounty operations
  recordBountyClaim(claim: InsertBountyClaim): Promise<BountyClaim>;
  getBountyClaimByBetId(betId: string): Promise<BountyClaim | undefined>;
  getBountyClaimsByAddress(claimerAddress: string, limit?: number): Promise<BountyClaim[]>;

  // Round sweep operations
  recordRoundSweep(sweep: InsertRoundSweep): Promise<RoundSweep>;
  getRoundSweep(roundId: string): Promise<RoundSweep | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ============ Bet Operations ============

  async saveBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db.insert(bets).values(insertBet).returning();
    return bet;
  }

  async getBetByBetId(betId: string): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.betId, betId));
    return bet;
  }

  async getUserBets(walletAddress: string, limit: number = 50, offset: number = 0): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(eq(bets.bettor, walletAddress))
      .orderBy(desc(bets.placedAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserBetsByRound(walletAddress: string, roundId: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(and(eq(bets.bettor, walletAddress), eq(bets.roundId, roundId)))
      .orderBy(desc(bets.placedAt));
  }

  async getUserBetsBySeason(walletAddress: string, seasonId: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(and(eq(bets.bettor, walletAddress), eq(bets.seasonId, seasonId)))
      .orderBy(desc(bets.placedAt));
  }

  async getBetsByRound(roundId: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId))
      .orderBy(desc(bets.placedAt));
  }

  async updateBetStatus(betId: string, status: string, settledAt?: Date): Promise<Bet | undefined> {
    const [bet] = await db
      .update(bets)
      .set({
        status,
        settledAt: settledAt || new Date()
      })
      .where(eq(bets.betId, betId))
      .returning();
    return bet;
  }

  // ============ Round Operations ============

  async saveRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async getRoundById(roundId: string): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.roundId, roundId));
    return round;
  }

  async updateRound(roundId: string, updates: Partial<InsertRound>): Promise<Round | undefined> {
    const [round] = await db
      .update(rounds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rounds.roundId, roundId))
      .returning();
    return round;
  }

  async getActiveRound(): Promise<Round | undefined> {
    const [round] = await db
      .select()
      .from(rounds)
      .where(eq(rounds.isActive, true))
      .orderBy(desc(rounds.startTime))
      .limit(1);
    return round;
  }

  async getAllRounds(limit: number = 100, offset: number = 0): Promise<Round[]> {
    return db
      .select()
      .from(rounds)
      .orderBy(desc(rounds.startTime))
      .limit(limit)
      .offset(offset);
  }

  async getRoundsBySeason(seasonId: string): Promise<Round[]> {
    return db
      .select()
      .from(rounds)
      .where(eq(rounds.seasonId, seasonId))
      .orderBy(desc(rounds.roundId));
  }

  // ============ Match Operations ============

  async saveMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async saveMatches(insertMatches: InsertMatch[]): Promise<Match[]> {
    if (insertMatches.length === 0) return [];
    return db.insert(matches).values(insertMatches).returning();
  }

  async getMatchesByRound(roundId: string): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(eq(matches.roundId, roundId))
      .orderBy(matches.matchIndex);
  }

  async updateMatch(roundId: string, matchIndex: number, updates: Partial<InsertMatch>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(matches.roundId, roundId), eq(matches.matchIndex, matchIndex)))
      .returning();
    return match;
  }

  // ============ Points Operations ============

  async getUserPoints(walletAddress: string): Promise<UserPoints | undefined> {
    const [points] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.walletAddress, walletAddress));
    return points;
  }

  async initializeUserPoints(walletAddress: string): Promise<UserPoints> {
    try {
      const [points] = await db
        .insert(userPoints)
        .values({
          walletAddress,
          totalPoints: 0,
          betsPlaced: 0,
          betsWon: 0,
        })
        .returning();
      return points;
    } catch (error: any) {
      // If user already exists (unique constraint violation), fetch and return
      if (error.code === '23505') {
        const existing = await this.getUserPoints(walletAddress);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async awardBetPlacedPoints(walletAddress: string, betId: string): Promise<void> {
    // Ensure user has a points record
    let userPointsRecord = await this.getUserPoints(walletAddress);
    if (!userPointsRecord) {
      userPointsRecord = await this.initializeUserPoints(walletAddress);
    }

    // Award 1 point for placing a bet
    await db
      .update(userPoints)
      .set({
        totalPoints: sql`${userPoints.totalPoints} + 1`,
        betsPlaced: sql`${userPoints.betsPlaced} + 1`,
        lastUpdated: new Date(),
      })
      .where(eq(userPoints.walletAddress, walletAddress));

    // Record in history
    await db.insert(pointsHistory).values({
      walletAddress,
      betId,
      points: 1,
      reason: 'bet_placed',
    });
  }

  async awardBetWonPoints(walletAddress: string, betId: string): Promise<void> {
    // Ensure user has a points record
    let userPointsRecord = await this.getUserPoints(walletAddress);
    if (!userPointsRecord) {
      userPointsRecord = await this.initializeUserPoints(walletAddress);
    }

    // Award 10 points for winning a bet
    await db
      .update(userPoints)
      .set({
        totalPoints: sql`${userPoints.totalPoints} + 10`,
        betsWon: sql`${userPoints.betsWon} + 1`,
        lastUpdated: new Date(),
      })
      .where(eq(userPoints.walletAddress, walletAddress));

    // Record in history
    await db.insert(pointsHistory).values({
      walletAddress,
      betId,
      points: 10,
      reason: 'bet_won',
    });
  }

  async getPointsHistory(walletAddress: string, limit: number = 50): Promise<PointsHistory[]> {
    return db
      .select()
      .from(pointsHistory)
      .where(eq(pointsHistory.walletAddress, walletAddress))
      .orderBy(desc(pointsHistory.createdAt))
      .limit(limit);
  }

  async getLeaderboard(limit: number = 100): Promise<UserPoints[]> {
    return db
      .select()
      .from(userPoints)
      .orderBy(desc(userPoints.totalPoints))
      .limit(limit);
  }

  // ============ Referral Operations ============

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  async getReferralByReferee(refereeAddress: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeAddress, refereeAddress));
    return referral;
  }

  async getReferralsByReferrer(referrerAddress: string): Promise<Referral[]> {
    return db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerAddress, referrerAddress))
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferralEarnings(referrerAddress: string, refereeAddress: string, amount: string): Promise<void> {
    await db
      .update(referrals)
      .set({
        totalReferralEarnings: sql`CAST(${referrals.totalReferralEarnings} AS NUMERIC) + CAST(${amount} AS NUMERIC)`,
      })
      .where(
        and(
          eq(referrals.referrerAddress, referrerAddress),
          eq(referrals.refereeAddress, refereeAddress)
        )
      );
  }

  async recordReferralEarning(insertEarning: InsertReferralEarning): Promise<ReferralEarning> {
    const [earning] = await db.insert(referralEarnings).values(insertEarning).returning();
    return earning;
  }

  async getReferralEarnings(referrerAddress: string, limit: number = 50): Promise<ReferralEarning[]> {
    return db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerAddress, referrerAddress))
      .orderBy(desc(referralEarnings.createdAt))
      .limit(limit);
  }

  async getTotalReferralEarnings(referrerAddress: string): Promise<string> {
    const result = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${referralEarnings.rewardAmount} AS NUMERIC)), 0)::TEXT`,
      })
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerAddress, referrerAddress));

    return result[0]?.total || '0';
  }

  // ============ Bounty Operations ============

  async recordBountyClaim(insertClaim: InsertBountyClaim): Promise<BountyClaim> {
    const [claim] = await db.insert(bountyClaims).values(insertClaim).returning();
    return claim;
  }

  async getBountyClaimByBetId(betId: string): Promise<BountyClaim | undefined> {
    const [claim] = await db
      .select()
      .from(bountyClaims)
      .where(eq(bountyClaims.betId, betId));
    return claim;
  }

  async getBountyClaimsByAddress(claimerAddress: string, limit: number = 50): Promise<BountyClaim[]> {
    return db
      .select()
      .from(bountyClaims)
      .where(eq(bountyClaims.claimerAddress, claimerAddress))
      .orderBy(desc(bountyClaims.claimedAt))
      .limit(limit);
  }

  // ============ Round Sweep Operations ============

  async recordRoundSweep(insertSweep: InsertRoundSweep): Promise<RoundSweep> {
    const [sweep] = await db.insert(roundSweeps).values(insertSweep).returning();
    return sweep;
  }

  async getRoundSweep(roundId: string): Promise<RoundSweep | undefined> {
    const [sweep] = await db
      .select()
      .from(roundSweeps)
      .where(eq(roundSweeps.roundId, roundId));
    return sweep;
  }
}

export const storage = new DatabaseStorage();
