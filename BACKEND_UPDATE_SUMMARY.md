# Backend Update Summary - New Protocol Migration

## ✅ Completed Tasks

### 1. **ABIs Updated**
- ✅ Copied all new ABIs from `client/public/abis/` to `server/web3/abis/`
- ✅ Files copied:
  - `BettingCore.json`
  - `BettingRouter.json`
  - `GameCore.json`
  - `LeagueBetToken.json` (LBT token)
  - `SeasonPredictor.json`
  - `SwapRouter.json`
  - `TokenRegistry.json`

### 2. **Server Configuration Updated**
- ✅ Updated `server/web3/config.ts`:
  - New contract address structure (placeholders - awaiting real addresses)
  - Referral system config (5% referrer bonus, 100 LBT referee bonus)
  - Bounty system config (10% bounty, 24h claim deadline, 6h sweep grace period)
  - Faucet config updated for LBT tokens

### 3. **Database Schema Extended**
- ✅ Added 4 new tables to `shared/schema.ts`:
  - **`referrals`** - Tracks referral relationships
  - **`referral_earnings`** - Individual referral rewards
  - **`bounty_claims`** - Bounty claims for settling bets
  - **`round_sweeps`** - Pool sweeps after grace period

### 4. **Storage Module Enhanced**
- ✅ Updated `server/storage.ts` with new methods:
  - Referral operations (create, get, track earnings)
  - Bounty claim tracking
  - Round sweep tracking
  - All methods properly typed and implemented

### 5. **Referral System Module Created**
- ✅ New file: `server/web3/referral-system.ts`
  - Generate referral codes
  - Create referral relationships
  - Process referral rewards (5% of bet amount)
  - Track referee bonuses (100 LBT for first bet)
  - Get referral stats
  - Batch payout functionality (stub)

---

## 🔧 TODO: Needs Contract Addresses

Update these addresses in `server/web3/config.ts`:

```typescript
export const CONTRACTS = {
  leagueBetToken: '0x...' // TODO: UPDATE
  gameCore: '0x...'        // TODO: UPDATE
  bettingCore: '0x...'     // TODO: UPDATE
  bettingRouter: '0x...'   // TODO: UPDATE
  seasonPredictor: '0x...' // TODO: UPDATE
  swapRouter: '0x...'      // TODO: UPDATE
  tokenRegistry: '0x...'   // TODO: UPDATE
}
```

---

## 📋 Next Steps (Pending)

### 1. **Update Event Sync** (`server/web3/event-sync.ts`)
The new protocol has different events that need to be tracked:

**BettingCore Events:**
- `BetPlaced(betId, bettor, roundId, amount, parlayMultiplier, legCount)`
- `BetCancelled(betId, bettor, refundAmount)`
- `BetLost(betId)`
- `WinningsClaimed(betId, winner, payout)`
- `BountyClaim(betId, claimer, bounty, winner, winnerAmount)`
- `RoundSettled(roundId, totalPayouts)`
- `RevenueFinalized(roundId, protocolShare, seasonShare)`
- `RoundPoolSwept(roundId, remaining, protocolShare, seasonShare)`
- `RoundSeeded(roundId)`
- `OddsLocked(roundId)`

**GameCore Events:**
- `RoundStarted(roundId, seasonId, startTime)`
- `VRFFulfilled(roundId, vrfRequestId)`
- `RoundSettled(roundId, results)`

**Changes from Old Protocol:**
- ❌ No more `LiquidityPool` events
- ❌ No more separate `BettingPool` events
- ✅ Unified `BettingCore` handles everything
- ✅ New bounty system events
- ✅ New round sweep events

### 2. **Update Game Monitor** (`server/web3/game-monitor.ts`)
Remove LP-related functions and update for new protocol:

**Remove:**
- ❌ `seedRoundPools()` - Virtual seeding now, no LP funds needed
- ❌ `finalizeRoundRevenue()` - Different revenue model

**Keep/Update:**
- ✅ `startSeason()`
- ✅ `startRound()`
- ✅ `requestMatchResults()`
- ✅ `settleRound()`
- ✅ `getGameState()` - Update to use GameCore

**Add:**
- ⏳ `sweepRoundPool()` - Sweep unclaimed funds after grace period
- ⏳ Monitor bounty claim deadlines
- ⏳ Auto-process bounty claims if possible

### 3. **Update Faucet** (`server/web3/faucet.ts`)
- Update to use `LeagueBetToken` (LBT) instead of `LeagueToken`
- Update ABI imports

### 4. **Add Referral API Routes**
Create new endpoints in `server/routes.ts`:

```typescript
// Referral endpoints
GET  /api/referrals/:address/stats      // Get user's referral stats
POST /api/referrals                     // Create referral relationship
GET  /api/referrals/:address/code       // Get/generate referral code
GET  /api/referrals/:address/earnings   // Get referral earnings history

// Bounty endpoints
GET /api/bounties/:address              // Get user's bounty claims
GET /api/bounties/available             // Get available bounties
```

### 5. **Database Migration**
Run migration to create new tables:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

New tables:
- `referrals`
- `referral_earnings`
- `bounty_claims`
- `round_sweeps`

---

## 🎯 Key Architectural Changes

### Protocol-Backed Model
- **Old**: LP providers deposit funds, earn share of revenue
- **New**: Protocol holds reserves directly, no LP system
- **Impact**: Simpler, more capital efficient, no withdrawal windows

### Referral System
- **Referrer** earns 5% of every bet placed by referred users
- **Referee** gets 100 LBT bonus on first bet
- **Max** referral bonus per bet: 50 LBT
- **Min** bet to qualify: 10 LBT

### Bounty System
- Winners have 24h to claim winnings after settlement
- Anyone can claim on behalf of winner and earn 10% bounty
- 6h grace period after 24h before pool sweep
- Sweep sends 98% to protocol, 2% to season pool
- Late claims (after sweep) charged 15% fee

### Virtual Seeding
- **Old**: Required 30,000 LEAGUE from LP to seed each round
- **New**: Virtual seeding with no actual funds needed
- **Impact**: No more seeding failures due to insufficient liquidity

### Single Token (LBT)
- **Old**: LEAGUE token
- **New**: LeagueBetToken (LBT) only
- **Impact**: All bets, rewards, and payouts in LBT

---

## 📊 Configuration Summary

### Referral Config
```typescript
REFERRER_BONUS_BPS: 500          // 5%
REFEREE_BONUS: 100 LBT           // First bet bonus
MAX_REFERRAL_BONUS: 50 LBT       // Per bet cap
MIN_BET_FOR_REFERRAL: 10 LBT     // Minimum qualifying bet
```

### Bounty Config
```typescript
MIN_BOUNTY_CLAIM: 50 LBT              // Min payout for bounty
BOUNTY_PERCENTAGE_BPS: 1000           // 10%
CLAIM_DEADLINE_HOURS: 24              // Winner claim deadline
SWEEP_GRACE_PERIOD_HOURS: 6           // Before sweep
LATE_CLAIM_FEE_BPS: 1500              // 15% late fee
```

### Odds Compression
```typescript
Tight range: [1.25x - 2.05x]
Linear compression: raw → compressed
Formula: compressed = 1.25 + (raw - 1.0) * 0.80 / 9.0
```

---

## 🚀 Ready to Deploy

Once you provide contract addresses:

1. Update addresses in `server/web3/config.ts`
2. Update event-sync for new events
3. Update game-monitor for new protocol
4. Run database migrations
5. Test referral system
6. Test bounty system
7. Deploy!

---

## 📞 Support

For questions or issues, refer to:
- Contract source: `client/public/src/`
- Contract ABIs: `client/public/abis/`
- Backend code: `server/web3/`
