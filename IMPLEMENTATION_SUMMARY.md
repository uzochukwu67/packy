# Game State Synchronization - Implementation Summary

## ✅ What Has Been Implemented

### 1. Database Schema
**File**: `shared/schema.ts`

Added two new tables:
- **`rounds`**: Stores round metadata (roundId, seasonId, start/end times, VRF status, settlement status, isActive flag)
- **`matches`**: Stores match results (roundId, matchIndex, team IDs/names, scores, outcomes, odds, settlement status)

### 2. Storage Layer
**File**: `server/storage.ts`

Added database methods:
- `saveRound()` - Save new round to database
- `getRoundById()` - Get round by ID
- `updateRound()` - Update round status
- `getActiveRound()` - Get currently active round
- `saveMatch()` / `saveMatches()` - Save match data
- `getMatchesByRound()` - Get all matches for a round
- `updateMatch()` - Update match results

### 3. Event Synchronization
**File**: `server/web3/event-sync.ts` (NEW)

Created blockchain event listeners:
- **RoundStarted**: Syncs new round + initial match data to database
- **VRFFulfilled**: Updates match results when randomness is fulfilled
- **RoundSettled**: Marks round as settled

Helper functions:
- `getTeamName()` - Maps team ID to name
- `getOutcome()` - Converts contract enum to string ('pending', 'home_win', 'away_win', 'draw')

### 4. Enhanced Monitoring
**File**: `server/web3/game-monitor.ts` (UPDATED)

Added:
- Event listener initialization on startup
- Current round sync on startup
- Time tracking - marks round as inactive when 15 minutes elapsed
- Database sync for all game state changes

### 5. API Endpoints
**File**: `server/routes.ts` (UPDATED)

New endpoints:

#### `GET /api/game/state`
Returns current active round with time remaining
```json
{
  "hasActiveRound": true,
  "round": {
    "roundId": "1",
    "seasonId": "1",
    "timeRemainingMs": 540000,
    "isActive": true,
    "vrfFulfilled": false,
    "settled": false
  }
}
```

#### `GET /api/game/matches`
Returns matches for current active round
```json
{
  "hasActiveRound": true,
  "roundId": "1",
  "matches": [...]
}
```

#### `GET /api/game/rounds/:roundId/matches`
Get matches for specific round

#### `GET /api/game/rounds/:roundId`
Get specific round details with time remaining

## 🔄 How It Works

### Round Lifecycle:

1. **Round Start**:
   - Admin calls `startRound()` on contract
   - `RoundStarted` event fires
   - Event listener syncs round + matches to database
   - Round marked as `isActive: true`

2. **During Round** (15 minutes):
   - Frontend polls `/api/game/state` every 5 seconds
   - Gets cached data from database (fast!)
   - Shows countdown timer using `timeRemainingMs`

3. **Round End**:
   - Monitoring loop detects `timeRemainingMs === 0`
   - Updates database: `isActive: false`
   - Auto-requests VRF for match results

4. **VRF Fulfilled**:
   - `VRFFulfilled` event fires
   - Event listener fetches match results from blockchain
   - Updates all matches in database with scores/outcomes
   - Round marked as `vrfFulfilled: true`

5. **Round Settlement**:
   - Admin or monitoring system settles round
   - `RoundSettled` event fires
   - Round marked as `settled: true`

## 📝 Next Steps - What You Need To Do

### Step 1: Run Database Migration
```bash
npm run db:push
```
This will create the `rounds` and `matches` tables.

### Step 2: Test the Backend

Start the server:
```bash
npm run dev
```

Check the logs - you should see:
```
✅ Blockchain event listeners started
✅ Game monitoring started
```

### Step 3: Start a New Round

Use the admin script:
```bash
npm run game:start
```

Or call the API:
```bash
curl -X POST http://localhost:5000/api/admin/start-round
```

### Step 4: Verify Database Sync

Check that data is being saved:
```bash
# Query your database
SELECT * FROM rounds;
SELECT * FROM matches WHERE round_id = '1';
```

Or test the API:
```bash
curl http://localhost:5000/api/game/state
curl http://localhost:5000/api/game/matches
```

### Step 5: Frontend Integration (TODO)

You'll need to update the frontend to use the new API endpoints instead of direct blockchain calls.

Create a new hook in `client/src/hooks/useGameStateAPI.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';

export function useGameStateAPI() {
  const { data, refetch } = useQuery({
    queryKey: ['gameState'],
    queryFn: async () => {
      const res = await fetch('/api/game/state');
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const {data: matchesData } = useQuery({
    queryKey: ['matches', data?.round?.roundId],
    queryFn: async () => {
      const res = await fetch('/api/game/matches');
      return res.json();
    },
    enabled: !!data?.hasActiveRound,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return {
    gameState: data,
    matches: matchesData?.matches || [],
    timeRemainingMs: data?.round?.timeRemainingMs || 0,
    isActive: data?.round?.isActive || false,
    vrfFulfilled: data?.round?.vrfFulfilled || false,
    settled: data?.round?.settled || false,
    refetch,
  };
}
```

Update `Dashboard.tsx`:
```typescript
// import { useDashboardData } from '@/hooks/contracts/useGameEngine'; // OLD
import { useGameStateAPI } from '@/hooks/useGameStateAPI'; // NEW

export default function Dashboard() {
  const { gameState, matches, timeRemainingMs, isActive, vrfFulfilled } = useGameStateAPI();

  // Show countdown timer
  const minutes = Math.floor(timeRemainingMs / 60000);
  const seconds = Math.floor((timeRemainingMs % 60000) / 1000);

  return (
    <div>
      {isActive && (
        <div className="countdown">
          ⏱️ Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}

      {!isActive && !vrfFulfilled && (
        <div className="waiting">
          ⏳ Round ended - Waiting for results...
        </div>
      )}

      {vrfFulfilled && (
        <div className="results-ready">
          ✅ Results available!
        </div>
      )}

      {/* Render matches */}
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

## 🎯 Benefits

✅ **Faster Frontend**: Reads from database instead of blockchain
✅ **Real-time Countdown**: Shows exact time remaining in round
✅ **Better UX**: Instant updates when VRF is fulfilled
✅ **Historical Data**: Can query past rounds and matches
✅ **Reduced RPC Calls**: Less load on RPC provider
✅ **Cost Savings**: Fewer blockchain requests

## 🔍 Troubleshooting

### Events not syncing?
- Check server logs for event listener errors
- Verify RPC URL is correct in `.env`
- Make sure monitoring system is running

### Round not showing as inactive after 15 minutes?
- Check the monitoring loop is running (every 30 seconds)
- Verify `MONITORING_CONFIG.POLL_INTERVAL_MS` in `config.ts`

### Matches not updating with results?
- Check that VRF was fulfilled on blockchain
- Verify event listener for `VRFFulfilled` is working
- Check database to see if matches were updated

## 📚 Files Modified/Created

- ✅ `shared/schema.ts` - Added rounds & matches tables
- ✅ `server/storage.ts` - Added database methods
- ✅ `server/web3/event-sync.ts` - NEW: Event listeners
- ✅ `server/web3/game-monitor.ts` - Updated monitoring
- ✅ `server/routes.ts` - Added game state API endpoints
- 📝 Frontend files - TODO (see Step 5 above)

## 🚀 Deployment Notes

When deploying to production:
1. Run `npm run db:push` in production environment
2. Ensure `RPC_URL` env var is set with a reliable provider (Alchemy/Infura)
3. Monitor logs to ensure event listeners are working
4. Test that rounds are being synced properly
