/**
 * Referral System
 * Handles referral tracking, rewards, and payouts
 */

import { publicClient, walletClient, CONTRACTS, REFERRAL_CONFIG, log } from './config';
import { LeagueBetTokenABI } from './abis/index';
import { storage } from '../storage';

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(address: string): string {
  // Use last 8 characters of address + random 4 chars
  const addressSuffix = address.slice(-8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${addressSuffix}${random}`;
}

/**
 * Create a new referral relationship
 */
export async function createReferral(
  referrerAddress: string,
  refereeAddress: string,
  referralCode?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if referee already has a referral
    const existing = await storage.getReferralByReferee(refereeAddress);
    if (existing) {
      return {
        success: false,
        error: 'User already has a referrer',
      };
    }

    // Check if user is trying to refer themselves
    if (referrerAddress.toLowerCase() === refereeAddress.toLowerCase()) {
      return {
        success: false,
        error: 'Cannot refer yourself',
      };
    }

    // Generate referral code if not provided
    const code = referralCode || generateReferralCode(referrerAddress);

    // Create referral record
    await storage.createReferral({
      referrerAddress,
      refereeAddress,
      referralCode: code,
      totalReferralEarnings: '0',
      refereeBonus: '0',
      isActive: true,
    });

    log(`✅ Referral created: ${referrerAddress} → ${refereeAddress} (code: ${code})`);

    return { success: true };
  } catch (error: any) {
    log(`Failed to create referral: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process referral reward when a bet is placed
 */
export async function processReferralReward(
  refereeAddress: string,
  betId: string,
  betAmount: bigint
): Promise<{ success: boolean; rewardAmount?: bigint; error?: string }> {
  try {
    // Check if bet qualifies for referral
    if (betAmount < REFERRAL_CONFIG.MIN_BET_FOR_REFERRAL) {
      return { success: false, error: 'Bet amount too small for referral' };
    }

    // Get referral relationship
    const referral = await storage.getReferralByReferee(refereeAddress);
    if (!referral || !referral.isActive) {
      return { success: false, error: 'No active referral found' };
    }

    // Calculate reward (5% of bet amount)
    const rewardAmount = (betAmount * BigInt(REFERRAL_CONFIG.REFERRER_BONUS_BPS)) / BigInt(10000);

    // Cap reward at maximum
    const cappedReward = rewardAmount > REFERRAL_CONFIG.MAX_REFERRAL_BONUS
      ? REFERRAL_CONFIG.MAX_REFERRAL_BONUS
      : rewardAmount;

    // Record the earning
    await storage.recordReferralEarning({
      referrerAddress: referral.referrerAddress,
      refereeAddress,
      betId,
      betAmount: betAmount.toString(),
      rewardAmount: cappedReward.toString(),
      paid: false,
    });

    // Update total earnings
    await storage.updateReferralEarnings(
      referral.referrerAddress,
      refereeAddress,
      cappedReward.toString()
    );

    log(`💰 Referral reward: ${cappedReward.toString()} LBT for ${referral.referrerAddress} from bet ${betId}`);

    // If this is referee's first bet, award bonus
    if (!referral.refereeFirstBetId) {
      // TODO: Award referee bonus (100 LBT) - requires minting or transfer
      log(`🎁 First bet bonus eligible for ${refereeAddress}`);
    }

    return {
      success: true,
      rewardAmount: cappedReward,
    };
  } catch (error: any) {
    log(`Failed to process referral reward: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(address: string) {
  try {
    const referrals = await storage.getReferralsByReferrer(address);
    const totalEarnings = await storage.getTotalReferralEarnings(address);
    const earnings = await storage.getReferralEarnings(address, 100);

    return {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.isActive).length,
      totalEarnings,
      recentEarnings: earnings,
      referrals,
    };
  } catch (error: any) {
    log(`Failed to get referral stats: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Check if user was referred and return referrer
 */
export async function getReferrer(address: string): Promise<string | null> {
  try {
    const referral = await storage.getReferralByReferee(address);
    return referral?.referrerAddress || null;
  } catch (error: any) {
    log(`Failed to get referrer: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Batch payout referral rewards (admin function)
 * Pays out all unpaid referral earnings
 */
export async function batchPayoutReferralRewards(): Promise<{
  success: boolean;
  paidCount: number;
  totalAmount: bigint;
  error?: string;
}> {
  try {
    // TODO: Implement batch payout logic
    // 1. Query all unpaid referral earnings
    // 2. Group by referrer address
    // 3. Transfer LBT tokens to each referrer
    // 4. Mark as paid

    log('⚠️ Batch payout not yet implemented');

    return {
      success: false,
      paidCount: 0,
      totalAmount: 0n,
      error: 'Not implemented',
    };
  } catch (error: any) {
    log(`Failed to batch payout referral rewards: ${error.message}`, 'error');
    return {
      success: false,
      paidCount: 0,
      totalAmount: 0n,
      error: error.message,
    };
  }
}
