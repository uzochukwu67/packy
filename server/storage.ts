import { db } from "./db";
import {
  users,
  bets,
  rounds,
  matches,
  type User,
  type InsertUser,
  type Bet,
  type InsertBet,
  type Round,
  type InsertRound,
  type Match,
  type InsertMatch
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
