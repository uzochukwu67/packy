import { pgTable, serial, varchar, timestamp, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  betId: varchar("bet_id", { length: 100 }).notNull().unique(), // Blockchain bet ID
  bettor: varchar("bettor", { length: 42 }).notNull(), // User wallet address
  seasonId: varchar("season_id", { length: 100 }).notNull(),
  roundId: varchar("round_id", { length: 100 }).notNull(),
  amount: varchar("amount", { length: 100 }).notNull(), // Bet amount in wei (as string)
  matchIndices: text("match_indices").notNull(), // JSON array of match indices
  outcomes: text("outcomes").notNull(), // JSON array of outcomes (1=HOME, 2=AWAY, 3=DRAW)
  parlayMultiplier: varchar("parlay_multiplier", { length: 100 }).notNull(), // Multiplier as string
  potentialWinnings: varchar("potential_winnings", { length: 100 }).notNull(), // Potential return
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, won, lost, claimed, cancelled
  txHash: varchar("tx_hash", { length: 66 }).notNull(), // Transaction hash
  placedAt: timestamp("placed_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  placedAt: true,
  settledAt: true
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;

// Rounds table - stores round information synced from blockchain
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  roundId: varchar("round_id", { length: 100 }).notNull().unique(), // Blockchain round ID
  seasonId: varchar("season_id", { length: 100 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // When round ended (15 mins after start)
  vrfRequestId: varchar("vrf_request_id", { length: 100 }),
  vrfFulfilledAt: timestamp("vrf_fulfilled_at"),
  settled: boolean("settled").notNull().default(false),
  settledAt: timestamp("settled_at"),
  seeded: boolean("seeded").notNull().default(false), // Whether round has been seeded with virtual liquidity
  seededAt: timestamp("seeded_at"),
  oddsLocked: boolean("odds_locked").notNull().default(false), // Whether odds are locked for betting
  oddsLockedAt: timestamp("odds_locked_at"),
  isActive: boolean("is_active").notNull().default(true), // Whether betting is still allowed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;

// Matches table - stores match results from blockchain
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: varchar("round_id", { length: 100 }).notNull(),
  matchIndex: integer("match_index").notNull(), // 0-9 for each round
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  homeTeamName: varchar("home_team_name", { length: 100 }).notNull(),
  awayTeamName: varchar("away_team_name", { length: 100 }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  outcome: varchar("outcome", { length: 20 }).notNull().default("pending"), // pending, home_win, away_win, draw
  homeOdds: varchar("home_odds", { length: 100 }), // Initial odds
  awayOdds: varchar("away_odds", { length: 100 }),
  drawOdds: varchar("draw_odds", { length: 100 }),
  settled: boolean("settled").notNull().default(false),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Points table - tracks testnet user rewards
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  betsPlaced: integer("bets_placed").notNull().default(0), // Total bets placed
  betsWon: integer("bets_won").notNull().default(0), // Total bets won
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
  createdAt: true,
  lastUpdated: true
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;

// Points history table - tracks individual point transactions
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  betId: varchar("bet_id", { length: 100 }), // Optional - related bet if applicable
  points: integer("points").notNull(), // Points awarded (1 for bet placed, 10 for win)
  reason: varchar("reason", { length: 50 }).notNull(), // 'bet_placed' or 'bet_won'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPointsHistorySchema = createInsertSchema(pointsHistory).omit({
  id: true,
  createdAt: true
});

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = z.infer<typeof insertPointsHistorySchema>;

// Referrals table - tracks referral relationships and rewards
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerAddress: varchar("referrer_address", { length: 42 }).notNull(), // User who referred
  refereeAddress: varchar("referee_address", { length: 42 }).notNull().unique(), // User who was referred
  referralCode: varchar("referral_code", { length: 20 }).notNull(), // Optional custom code
  totalReferralEarnings: varchar("total_referral_earnings", { length: 100 }).notNull().default("0"), // Total LBT earned from this referral
  refereeFirstBetId: varchar("referee_first_bet_id", { length: 100 }), // First bet placed by referee
  refereeFirstBetAt: timestamp("referee_first_bet_at"), // When referee placed first bet
  refereeBonus: varchar("referee_bonus", { length: 100 }).notNull().default("0"), // Bonus given to referee
  isActive: boolean("is_active").notNull().default(true), // Whether referral is still active
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Referral earnings table - tracks individual referral rewards
export const referralEarnings = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  referrerAddress: varchar("referrer_address", { length: 42 }).notNull(),
  refereeAddress: varchar("referee_address", { length: 42 }).notNull(),
  betId: varchar("bet_id", { length: 100 }).notNull(), // Bet that triggered the reward
  betAmount: varchar("bet_amount", { length: 100 }).notNull(), // Amount of the bet
  rewardAmount: varchar("reward_amount", { length: 100 }).notNull(), // Reward earned (5% of bet)
  txHash: varchar("tx_hash", { length: 66 }), // Transaction hash if paid on-chain
  paid: boolean("paid").notNull().default(false), // Whether reward has been paid
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralEarningSchema = createInsertSchema(referralEarnings).omit({
  id: true,
  createdAt: true
});

export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type InsertReferralEarning = z.infer<typeof insertReferralEarningSchema>;

// Bounty claims table - tracks bounty claims for settling bets
export const bountyClaims = pgTable("bounty_claims", {
  id: serial("id").primaryKey(),
  betId: varchar("bet_id", { length: 100 }).notNull().unique(), // Bet that was claimed
  claimerAddress: varchar("claimer_address", { length: 42 }).notNull(), // User who claimed the bounty
  winnerAddress: varchar("winner_address", { length: 42 }).notNull(), // Original bet winner
  betAmount: varchar("bet_amount", { length: 100 }).notNull(), // Original bet amount
  payout: varchar("payout", { length: 100 }).notNull(), // Total payout amount
  bountyAmount: varchar("bounty_amount", { length: 100 }).notNull(), // Bounty earned (10% of payout)
  winnerAmount: varchar("winner_amount", { length: 100 }).notNull(), // Amount sent to winner (90% of payout)
  txHash: varchar("tx_hash", { length: 66 }).notNull(), // Transaction hash
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const insertBountyClaimSchema = createInsertSchema(bountyClaims).omit({
  id: true,
  claimedAt: true
});

export type BountyClaim = typeof bountyClaims.$inferSelect;
export type InsertBountyClaim = z.infer<typeof insertBountyClaimSchema>;

// Round sweeps table - tracks pool sweeps after grace period
export const roundSweeps = pgTable("round_sweeps", {
  id: serial("id").primaryKey(),
  roundId: varchar("round_id", { length: 100 }).notNull().unique(),
  remainingAmount: varchar("remaining_amount", { length: 100 }).notNull(), // Unclaimed amount
  protocolShare: varchar("protocol_share", { length: 100 }).notNull(), // Amount to protocol (98%)
  seasonShare: varchar("season_share", { length: 100 }).notNull(), // Amount to season pool (2%)
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  sweptAt: timestamp("swept_at").defaultNow(),
});

export const insertRoundSweepSchema = createInsertSchema(roundSweeps).omit({
  id: true,
  sweptAt: true
});

export type RoundSweep = typeof roundSweeps.$inferSelect;
export type InsertRoundSweep = z.infer<typeof insertRoundSweepSchema>;
