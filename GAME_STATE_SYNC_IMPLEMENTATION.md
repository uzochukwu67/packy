# Game State Synchronization Implementation Guide

## Overview
This document outlines the implementation needed to sync blockchain game state (rounds, matches, VRF results) to the database for real-time frontend updates.

## Problem Statement
Currently:
- ❌ Frontend fetches data directly from blockchain (slow, no caching)
- ❌ No way to know when round ends (15 minutes) without constant polling
- ❌ No notification when VRF is fulfilled and match results are available
- ❌ Match results not stored in database for historical queries

## Solution Architecture

### 1. Database Schema ✅ COMPLETED
Created tables for:
- **`rounds`**: Stores round metadata (start time, end time, VRF status, settlement status)
- **`matches`**: Stores match results (team IDs, scores, outcomes, odds)

### 2. Event-Driven Synchronization (TO IMPLEMENT)

#### Key Events to Monitor:
From `GameEngine.sol`:
```solidity
event RoundStarted(uint256 indexed roundId, uint256 indexed seasonId, uint256 startTime);
event VRFRequested(uint256 indexed roundId, uint256 requestId, uint256 paid);
event VRFFulfilled(uint256 indexed requestId, uint256 indexed roundId);
event RoundSettled(uint256 indexed roundId, uint256 indexed seasonId);
event MatchSettled(...);
```

#### Implementation Steps:

**Step 1: Add Event Listeners in `game-monitor.ts`**
```typescript
import { storage } from '../storage';

// Listen for RoundStarted event
publicClient.watchContractEvent({
  address: CONTRACTS.gameEngine,
  abi: GameEngineABI,
  eventName: 'RoundStarted',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { roundId, seasonId, startTime } = log.args;

      // Fetch match data from blockchain
      const matches = await publicClient.readContract({
        address: CONTRACTS.gameEngine,
        abi: GameEngineABI,
        functionName: 'getRoundMatches',
        args: [roundId],
      });

      // Save round to database
      await storage.saveRound({
        roundId: roundId.toString(),
        seasonId: seasonId.toString(),
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(startTime) * 1000 + 15 * 60 * 1000),
        settled: false,
        isActive: true,
      });

      // Save matches
      const matchRecords = matches.map((match, index) => ({
        roundId: roundId.toString(),
        matchIndex: index,
        homeTeamId: Number(match.homeTeamId),
        awayTeamId: Number(match.awayTeamId),
        homeTeamName: getTeamName(Number(match.homeTeamId)),
        awayTeamName: getTeamName(Number(match.awayTeamId)),
        homeOdds: match.homeOdds.toString(),
        awayOdds: match.awayOdds.toString(),
        drawOdds: match.drawOdds.toString(),
        outcome: 'pending',
        settled: false,
      }));

      await storage.saveMatches(matchRecords);

      log(`✅ Round ${roundId} synced to database`);
    }
  }
});

// Listen for VRFFulfilled event
publicClient.watchContractEvent({
  address: CONTRACTS.gameEngine,
  abi: GameEngineABI,
  eventName: 'VRFFulfilled',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { requestId, roundId } = log.args;

      // Update round VRF status
      await storage.updateRound(roundId.toString(), {
        vrfRequestId: requestId.toString(),
        vrfFulfilledAt: new Date(),
      });

      // Fetch updated matches with results
      const matches = await publicClient.readContract({
        address: CONTRACTS.gameEngine,
        abi: GameEngineABI,
        functionName: 'getRoundMatches',
        args: [roundId],
      });

      // Update each match with scores
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        await storage.updateMatch(roundId.toString(), i, {
          homeScore: Number(match.homeScore),
          awayScore: Number(match.awayScore),
          outcome: getOutcome(match.outcome),
          settled: match.settled,
          settledAt: match.settled ? new Date() : undefined,
        });
      }

      // Broadcast to WebSocket clients
      broadcastGameUpdate({
        type: 'VRF_FULFILLED',
        roundId: roundId.toString(),
        matches,
      });

      log(`✅ Round ${roundId} results synced after VRF fulfillment`);
    }
  }
});
```

**Step 2: Enhanced Monitoring Loop**
Update the existing monitoring loop to:
1. Track time remaining in round
2. Mark round as inactive when time expires
3. Auto-request VRF when round ends

```typescript
export function startMonitoring() {
  monitoringInterval = setInterval(async () => {
    const state = await getGameState();
    const dbRound = await storage.getRoundById(state.currentRoundId.toString());

    // Check if round time expired
    if (dbRound && state.timeUntilRoundEnd === 0 && dbRound.isActive) {
      await storage.updateRound(dbRound.roundId, {
        isActive: false,
        endTime: new Date(),
      });

      broadcastGameUpdate({
        type: 'ROUND_ENDED',
        roundId: dbRound.roundId,
      });

      log(`⏱️  Round ${dbRound.roundId} betting period ended`);
    }

    // Auto-request VRF if needed
    if (state.shouldRequestVRF) {
      await requestMatchResults();
    }

    // Auto-settle round if VRF fulfilled
    if (state.shouldSettleRound) {
      await settleRound(state.currentRoundId);
    }
  }, MONITORING_CONFIG.POLL_INTERVAL_MS);
}
```

### 3. API Endpoints (TO IMPLEMENT)

Add to `server/routes.ts`:

```typescript
// Get current game state with time remaining
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
    const timeRemaining = Math.max(0, endTime - now);

    res.json({
      hasActiveRound: true,
      round: {
        ...activeRound,
        timeRemainingMs: timeRemaining,
        isActive: activeRound.isActive && timeRemaining > 0,
        vrfFulfilled: !!activeRound.vrfFulfilledAt,
        settled: activeRound.settled,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get matches for current round
app.get('/api/game/matches', async (_req, res) => {
  try {
    const activeRound = await storage.getActiveRound();

    if (!activeRound) {
      return res.json({ matches: [] });
    }

    const matches = await storage.getMatchesByRound(activeRound.roundId);
    res.json({ matches });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get matches for specific round
app.get('/api/game/rounds/:roundId/matches', async (req, res) => {
  try {
    const { roundId } = req.params;
    const matches = await storage.getMatchesByRound(roundId);
    res.json({ matches });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. WebSocket Real-Time Updates (TO IMPLEMENT)

Create `server/websocket.ts`:

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

const clients = new Set<WebSocket>();

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });
}

export function broadcastGameUpdate(data: any) {
  const message = JSON.stringify(data);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

Update `server/index.ts`:
```typescript
import { setupWebSocket } from './websocket';

// After registerRoutes
setupWebSocket(httpServer);
```

### 5. Frontend Integration (TO IMPLEMENT)

Create `client/src/hooks/useGameState.ts`:

```typescript
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useGameState() {
  const [wsData, setWsData] = useState<any>(null);

  // Poll API for game state
  const { data, refetch } = useQuery({
    queryKey: ['gameState'],
    queryFn: async () => {
      const res = await fetch('/api/game/state');
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setWsData(data);

      // Refetch when we get updates
      if (data.type === 'VRF_FULFILLED' || data.type === 'ROUND_ENDED') {
        refetch();
      }
    };

    return () => ws.close();
  }, [refetch]);

  return {
    gameState: data,
    liveUpdate: wsData,
    timeRemainingMs: data?.round?.timeRemainingMs || 0,
    isActive: data?.round?.isActive || false,
    vrfFulfilled: data?.round?.vrfFulfilled || false,
  };
}
```

Update `Dashboard.tsx`:
```typescript
import { useGameState } from '@/hooks/useGameState';

export default function Dashboard() {
  const { gameState, timeRemainingMs, isActive, vrfFulfilled } = useGameState();

  // Show countdown timer
  const minutes = Math.floor(timeRemainingMs / 60000);
  const seconds = Math.floor((timeRemainingMs % 60000) / 1000);

  return (
    <div>
      {isActive && (
        <div className="countdown">
          Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}

      {!isActive && !vrfFulfilled && (
        <div className="status">⏱️ Round ended - Waiting for results...</div>
      )}

      {vrfFulfilled && (
        <div className="status">✅ Results available!</div>
      )}

      {/* Render matches */}
    </div>
  );
}
```

## Next Steps

1. **Run database migration**:
   ```bash
   npm run db:push
   ```

2. **Implement event listeners** in `server/web3/game-monitor.ts`

3. **Add API endpoints** in `server/routes.ts`

4. **Set up WebSocket** in `server/index.ts` and `server/websocket.ts`

5. **Update frontend** to use new hooks and API

6. **Test the flow**:
   - Start a round
   - Verify it's saved to database
   - Wait 15 minutes
   - Verify VRF is requested
   - Verify results are synced
   - Verify frontend updates in real-time

## Benefits

✅ Faster frontend (reads from database, not blockchain)
✅ Real-time updates via WebSocket
✅ Countdown timer showing time remaining
✅ Historical data for past rounds
✅ Better UX - users see results immediately when VRF is fulfilled
✅ Reduced RPC calls and costs
