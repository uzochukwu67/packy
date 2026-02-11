# Phantasma Points System

## Overview

The Phantasma testnet points system tracks and rewards user participation during the testnet phase. Points will be used to reward early adopters when the platform launches on mainnet (January 30th, 2026).

## Points Rewards

- **1 point** - Awarded when a user places a bet
- **10 points** - Awarded when a user wins a bet

## Database Schema

### `user_points` Table

Tracks cumulative points for each user:

```typescript
{
  id: serial
  walletAddress: string (unique)
  totalPoints: number
  betsPlaced: number
  betsWon: number
  lastUpdated: timestamp
  createdAt: timestamp
}
```

### `points_history` Table

Records every point transaction:

```typescript
{
  id: serial
  walletAddress: string
  betId: string (optional)
  points: number (1 or 10)
  reason: 'bet_placed' | 'bet_won'
  createdAt: timestamp
}
```

## API Endpoints

### Get User Points
```
GET /api/points/:address
```

Returns user's total points and statistics.

**Response:**
```json
{
  "id": 1,
  "walletAddress": "0x123...",
  "totalPoints": 45,
  "betsPlaced": 15,
  "betsWon": 3,
  "lastUpdated": "2026-01-21T...",
  "createdAt": "2026-01-20T..."
}
```

### Get Points History
```
GET /api/points/:address/history?limit=50
```

Returns detailed history of all point transactions.

**Response:**
```json
[
  {
    "id": 1,
    "walletAddress": "0x123...",
    "betId": "1",
    "points": 1,
    "reason": "bet_placed",
    "createdAt": "2026-01-21T..."
  },
  {
    "id": 2,
    "walletAddress": "0x123...",
    "betId": "1",
    "points": 10,
    "reason": "bet_won",
    "createdAt": "2026-01-21T..."
  }
]
```

### Get Leaderboard
```
GET /api/points/leaderboard?limit=100
```

Returns top users by points.

**Response:**
```json
[
  {
    "id": 1,
    "walletAddress": "0x123...",
    "totalPoints": 150,
    "betsPlaced": 40,
    "betsWon": 10,
    "lastUpdated": "2026-01-21T...",
    "createdAt": "2026-01-20T..."
  }
]
```

## Automatic Point Awarding

Points are awarded automatically through blockchain event listeners:

### When Bet is Placed
- **Event:** `BetPlaced` from BettingPool contract
- **Action:** 1 point awarded immediately
- **File:** `server/web3/event-sync.ts` - `syncBetPlaced()`

### When Bet is Won
- **Event:** `RoundSettled` triggers bet status check
- **Action:** 10 points awarded when bet status updated to 'won'
- **File:** `server/web3/event-sync.ts` - `updateBetStatusesForRound()`

## Storage Layer Functions

Located in `server/storage.ts`:

- `getUserPoints(walletAddress)` - Get user's points record
- `initializeUserPoints(walletAddress)` - Create new points record
- `awardBetPlacedPoints(walletAddress, betId)` - Award 1 point for bet placement
- `awardBetWonPoints(walletAddress, betId)` - Award 10 points for winning bet
- `getPointsHistory(walletAddress, limit)` - Get user's point transaction history
- `getLeaderboard(limit)` - Get top users by points

## Database Migration

To apply the new tables to your database, run:

```bash
npm run db:push
```

This will create:
- `user_points` table
- `points_history` table

## Frontend Integration

To integrate the points system in the frontend:

1. **Display User Points** - Show in sidebar or profile
```typescript
const { data: points } = useQuery({
  queryKey: ['userPoints', address],
  queryFn: () => fetch(`/api/points/${address}`).then(r => r.json()),
  enabled: !!address,
});
```

2. **Show Leaderboard** - Create leaderboard page
```typescript
const { data: leaderboard } = useQuery({
  queryKey: ['leaderboard'],
  queryFn: () => fetch('/api/points/leaderboard?limit=100').then(r => r.json()),
});
```

3. **Points History** - Show in user profile
```typescript
const { data: history } = useQuery({
  queryKey: ['pointsHistory', address],
  queryFn: () => fetch(`/api/points/${address}/history`).then(r => r.json()),
  enabled: !!address,
});
```

## Example Points Calculation

**User Journey:**
1. Connects wallet - 0 points
2. Places first bet - **+1 point** (total: 1)
3. Places second bet - **+1 point** (total: 2)
4. First bet wins - **+10 points** (total: 12)
5. Places third bet - **+1 point** (total: 13)
6. Second bet loses - **+0 points** (total: 13)
7. Third bet wins - **+10 points** (total: 23)

**Final Stats:**
- Total Points: 23
- Bets Placed: 3
- Bets Won: 2

## Testnet Rewards Strategy

When mainnet launches on January 30th, 2026:

1. Export all `user_points` data from testnet database
2. Create airdrop list based on points ranking
3. Reward top users with:
   - Platform tokens
   - Free betting credits
   - NFT badges for early adopters
   - VIP access to exclusive features

## Security Considerations

- Points are awarded automatically by server-side event listeners
- No manual point manipulation endpoints
- All point transactions are immutably recorded in `points_history`
- Wallet addresses are validated before point operations
- Duplicate bet events are prevented (already handled in bet sync logic)

## Testing

To test the points system:

1. Place a bet on testnet
2. Check points awarded via API: `GET /api/points/YOUR_ADDRESS`
3. Wait for round to settle
4. If bet wins, check updated points (should be +10)
5. Verify in history: `GET /api/points/YOUR_ADDRESS/history`

## Future Enhancements

Potential additions:
- Multiplier bonuses for streaks (5 wins in a row = 2x points)
- Daily login bonuses
- Referral points
- Special event point multipliers
- Achievement-based point bonuses
