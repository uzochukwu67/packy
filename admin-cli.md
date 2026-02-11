# Admin CLI Commands

## Quick Start

### Complete Game Initialization (Recommended for first time)
```bash
npm run game:init
```
This will:
1. Add 100,000 LEAGUE tokens to LP pool
2. Start Season 1
3. Start Round 1
4. Seed round pools with 3,000 LEAGUE

### Or Step by Step

```bash
# 1. Add liquidity to LP pool (REQUIRED FIRST TIME)
npm run game:add-lp

# 2. Start the game
npm run game:start

# 3. Check status anytime
npm run game:status
```

## Manual API Commands

Use these cURL commands or create API calls from your admin panel:

### 1. Check Current Game State
```bash
curl http://localhost:5000/api/admin/game-state
```

### 2. Start a New Season
```bash
curl -X POST http://localhost:5000/api/admin/start-season
```

### 3. Start a New Round
```bash
curl -X POST http://localhost:5000/api/admin/start-round
```

### 4. Seed Round Pools (Required before betting)
```bash
curl -X POST http://localhost:5000/api/admin/seed-pools \
  -H "Content-Type: application/json" \
  -d '{"roundId": "1"}'
```

### 5. Request VRF for Match Results (after 15 minutes)
```bash
curl -X POST http://localhost:5000/api/admin/request-vrf \
  -H "Content-Type: application/json" \
  -d '{"enableNativePayment": false}'
```

### 6. Settle Round (after VRF fulfills)
```bash
curl -X POST http://localhost:5000/api/admin/settle-round \
  -H "Content-Type: application/json" \
  -d '{"roundId": "1"}'
```

### 7. Finalize Revenue Distribution
```bash
curl -X POST http://localhost:5000/api/admin/finalize-revenue \
  -H "Content-Type: application/json" \
  -d '{"roundId": "1"}'
```

## Complete Workflow

1. **Start Season** → Creates season 1
2. **Start Round** → Creates round 1 with 10 matches
3. **Seed Pools** → Seeds betting pools with initial liquidity (3000 LEAGUE)
4. *Users place bets...*
5. **Wait 15 minutes** (ROUND_DURATION)
6. **Request VRF** → Chainlink VRF generates random match results
7. **Wait for VRF** (usually 1-2 minutes)
8. **Settle Round** → Calculates winners
9. **Finalize Revenue** → Distributes profits to LP pool
10. **Repeat from step 2** for next round

## Automated Monitoring

The server automatically monitors and will:
- ✅ Request VRF when round time expires
- ✅ Settle round when VRF fulfills

You just need to:
1. Start the season (once)
2. Start each round manually or automate with cron
3. Seed pools for each round
