CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"bet_id" varchar(100) NOT NULL,
	"bettor" varchar(42) NOT NULL,
	"season_id" varchar(100) NOT NULL,
	"round_id" varchar(100) NOT NULL,
	"amount" varchar(100) NOT NULL,
	"match_indices" text NOT NULL,
	"outcomes" text NOT NULL,
	"parlay_multiplier" varchar(100) NOT NULL,
	"potential_winnings" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"placed_at" timestamp DEFAULT now(),
	"settled_at" timestamp,
	CONSTRAINT "bets_bet_id_unique" UNIQUE("bet_id")
);
--> statement-breakpoint
CREATE TABLE "bounty_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"bet_id" varchar(100) NOT NULL,
	"claimer_address" varchar(42) NOT NULL,
	"winner_address" varchar(42) NOT NULL,
	"bet_amount" varchar(100) NOT NULL,
	"payout" varchar(100) NOT NULL,
	"bounty_amount" varchar(100) NOT NULL,
	"winner_amount" varchar(100) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"claimed_at" timestamp DEFAULT now(),
	CONSTRAINT "bounty_claims_bet_id_unique" UNIQUE("bet_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" varchar(100) NOT NULL,
	"match_index" integer NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_team_name" varchar(100) NOT NULL,
	"away_team_name" varchar(100) NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"outcome" varchar(20) DEFAULT 'pending' NOT NULL,
	"home_odds" varchar(100),
	"away_odds" varchar(100),
	"draw_odds" varchar(100),
	"settled" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"bet_id" varchar(100),
	"points" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_address" varchar(42) NOT NULL,
	"referee_address" varchar(42) NOT NULL,
	"bet_id" varchar(100) NOT NULL,
	"bet_amount" varchar(100) NOT NULL,
	"reward_amount" varchar(100) NOT NULL,
	"tx_hash" varchar(66),
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_address" varchar(42) NOT NULL,
	"referee_address" varchar(42) NOT NULL,
	"referral_code" varchar(20) NOT NULL,
	"total_referral_earnings" varchar(100) DEFAULT '0' NOT NULL,
	"referee_first_bet_id" varchar(100),
	"referee_first_bet_at" timestamp,
	"referee_bonus" varchar(100) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "referrals_referee_address_unique" UNIQUE("referee_address")
);
--> statement-breakpoint
CREATE TABLE "round_sweeps" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" varchar(100) NOT NULL,
	"remaining_amount" varchar(100) NOT NULL,
	"protocol_share" varchar(100) NOT NULL,
	"season_share" varchar(100) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"swept_at" timestamp DEFAULT now(),
	CONSTRAINT "round_sweeps_round_id_unique" UNIQUE("round_id")
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" varchar(100) NOT NULL,
	"season_id" varchar(100) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"vrf_request_id" varchar(100),
	"vrf_fulfilled_at" timestamp,
	"settled" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp,
	"seeded" boolean DEFAULT false NOT NULL,
	"seeded_at" timestamp,
	"odds_locked" boolean DEFAULT false NOT NULL,
	"odds_locked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rounds_round_id_unique" UNIQUE("round_id")
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"bets_placed" integer DEFAULT 0 NOT NULL,
	"bets_won" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_points_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
