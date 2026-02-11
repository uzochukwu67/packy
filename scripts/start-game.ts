/**
 * Admin Script: Start Game
 * Initializes a new season and first round
 */

const API_BASE = 'http://localhost:5000/api/admin';

async function checkGameState() {
  console.log('📊 Checking current game state...');
  try {
    const response = await fetch(`${API_BASE}/game-state`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Current State:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to server at ${API_BASE}. Make sure the server is running with "npm run dev"`);
    }
    throw error;
  }
}

async function startSeason() {
  console.log('\n🏆 Starting new season...');
  const response = await fetch(`${API_BASE}/start-season`, {
    method: 'POST',
  });
  const data = await response.json();

  if (data.success) {
    console.log('✅ Season started successfully!');
    console.log(`   TX Hash: ${data.txHash}`);
  } else {
    console.log('❌ Failed to start season:', data.error);
  }

  return data;
}

async function startRound() {
  console.log('\n⚡ Starting new round...');
  const response = await fetch(`${API_BASE}/start-round`, {
    method: 'POST',
  });
  const data = await response.json();

  if (data.success) {
    console.log('✅ Round started successfully!');
    console.log(`   TX Hash: ${data.txHash}`);
  } else {
    console.log('❌ Failed to start round:', data.error);
  }

  return data;
}

async function seedPools(roundId: string) {
  console.log(`\n💧 Seeding pools for round ${roundId}...`);
  const response = await fetch(`${API_BASE}/seed-pools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roundId }),
  });
  const data = await response.json();

  if (data.success) {
    console.log('✅ Pools seeded successfully!');
    console.log(`   TX Hash: ${data.txHash}`);
  } else {
    console.log('❌ Failed to seed pools:', data.error);
  }

  return data;
}

async function main() {
  console.log('🎮 PACKY GAME INITIALIZATION SCRIPT\n');
  console.log('===================================\n');

  try {
    // Step 1: Check current state
    const state = await checkGameState();

    // Step 2: Start season if not active
    if (state.currentSeasonId === '0' || !state.season?.active) {
      await startSeason();
      // Wait a bit for transaction to confirm
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`\n✓ Season ${state.currentSeasonId} is already active`);
    }

    // Step 3: Start round if none active
    if (state.currentRoundId === '0' || state.roundSettled) {
      await startRound();
      // Wait a bit for transaction to confirm
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get updated state to get round ID
      const updatedState = await checkGameState();

      // Step 4: Seed the pools
      if (updatedState.currentRoundId !== '0') {
        const seedResult = await seedPools(updatedState.currentRoundId);

        if (!seedResult.success && seedResult.error?.includes('insufficient liquidity')) {
          console.log('\n⚠️  LP Pool has insufficient liquidity to seed round pools.');
          console.log('    Run "npm run game:add-lp" to add liquidity to the LP pool first.');
          console.log('    Or use "npm run game:init" to do both in one command.');
        }
      }
    } else {
      console.log(`\n✓ Round ${state.currentRoundId} is already active`);
    }

    console.log('\n✅ Game initialization complete!');
    console.log('\n📝 Summary:');
    const finalState = await checkGameState();
    console.log(`   Season: ${finalState.currentSeasonId}`);
    console.log(`   Round: ${finalState.currentRoundId}`);
    console.log(`   Status: ${finalState.roundSettled ? 'SETTLED' : 'LIVE'}`);
    console.log('\n🎲 Players can now start placing bets!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
