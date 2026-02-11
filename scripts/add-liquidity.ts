/**
 * Admin Script: Add Initial Liquidity to LP Pool
 * Provides liquidity for round seeding and bet payouts
 */

import { publicClient, walletClient, CONTRACTS } from '../server/web3/config.js';
import { LeagueTokenABI, LiquidityPoolABI } from '../server/web3/abis/index.js';

const LIQUIDITY_AMOUNT = BigInt(100_000 * 10 ** 18); // 100,000 LEAGUE tokens

async function checkBalance() {
  console.log('💰 Checking admin LEAGUE balance...');
  const balance = await publicClient.readContract({
    address: CONTRACTS.leagueToken,
    abi: LeagueTokenABI,
    functionName: 'balanceOf',
    args: [walletClient.account.address],
  }) as bigint;

  const balanceInEther = Number(balance) / 10 ** 18;
  console.log(`   Balance: ${balanceInEther.toLocaleString()} LEAGUE`);

  if (balance < LIQUIDITY_AMOUNT) {
    throw new Error(`Insufficient balance. Need ${Number(LIQUIDITY_AMOUNT) / 10 ** 18} LEAGUE, have ${balanceInEther}`);
  }

  return balance;
}

async function approveTokens() {
  console.log('\n🔐 Approving LEAGUE tokens for LP pool...');

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: CONTRACTS.leagueToken,
    abi: LeagueTokenABI,
    functionName: 'approve',
    args: [CONTRACTS.liquidityPool, LIQUIDITY_AMOUNT],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log('✅ Tokens approved!');
  console.log(`   TX Hash: ${txHash}`);
}

async function addLiquidity() {
  console.log('\n💧 Adding liquidity to pool...');

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: CONTRACTS.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'addLiquidity',
    args: [LIQUIDITY_AMOUNT],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log('✅ Liquidity added successfully!');
  console.log(`   TX Hash: ${txHash}`);
}

async function checkPoolStats() {
  console.log('\n📊 LP Pool Stats:');

  const totalLiquidity = await publicClient.readContract({
    address: CONTRACTS.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'totalLiquidity',
  }) as bigint;

  const availableLiquidity = await publicClient.readContract({
    address: CONTRACTS.liquidityPool,
    abi: LiquidityPoolABI,
    functionName: 'getAvailableLiquidity',
  }) as bigint;

  console.log(`   Total Liquidity: ${(Number(totalLiquidity) / 10 ** 18).toLocaleString()} LEAGUE`);
  console.log(`   Available: ${(Number(availableLiquidity) / 10 ** 18).toLocaleString()} LEAGUE`);
}

async function main() {
  console.log('💧 LIQUIDITY POOL INITIALIZATION\n');
  console.log('===================================\n');

  try {
    // Step 1: Check admin balance
    await checkBalance();

    // Step 2: Approve tokens
    await approveTokens();

    // Step 3: Add liquidity
    await addLiquidity();

    // Step 4: Show pool stats
    await checkPoolStats();

    console.log('\n✅ Liquidity pool initialized successfully!');
    console.log('\n💡 Next step: Run "npm run game:start" to seed the round pools');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.shortMessage) {
      console.error('   Details:', error.shortMessage);
    }
    process.exit(1);
  }
}

main();
