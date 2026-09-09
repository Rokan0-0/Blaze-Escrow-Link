import { ServerDb } from '../db/serverDb';
import { Profile } from '../mock/types';

export function calculateTrustTier(score: number): {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  creditLimitKobo: number;
} {
  if (score >= 80) {
    return { tier: 'Platinum', creditLimitKobo: 35000000 }; // ₦350,000
  }
  if (score >= 60) {
    return { tier: 'Gold', creditLimitKobo: 15000000 }; // ₦150,000
  }
  if (score >= 40) {
    return { tier: 'Silver', creditLimitKobo: 5000000 }; // ₦50,000
  }
  return { tier: 'Bronze', creditLimitKobo: 0 }; // ₦0
}

export async function updateTrustScore(
  userId: string,
  delta: number,
  reason: string,
  transactionId?: string
): Promise<Profile | undefined> {
  const profile = await ServerDb.getProfileById(userId);
  if (!profile) return undefined;

  const oldScore = profile.trust_score;
  const newScore = Math.min(100, Math.max(0, oldScore + delta));

  const { tier, creditLimitKobo } = calculateTrustTier(newScore);

  profile.trust_score = newScore;
  profile.trust_tier = tier;
  profile.credit_limit = creditLimitKobo;

  await ServerDb.saveProfile(profile);

  // Add notification if tier upgraded
  if (oldScore < 60 && newScore >= 60) {
    await ServerDb.addNotification(
      userId,
      'Trust Tier Upgraded to Gold!',
      `Congratulations! You unlocked Gold Tier trust status with a ₦150,000 credit limit.`,
      'SYSTEM'
    );
  } else if (oldScore < 80 && newScore >= 80) {
    await ServerDb.addNotification(
      userId,
      'Platinum Trust Status Achieved!',
      `You reached Platinum Tier status! Your Ecobank Blaze credit limit is now ₦350,000.`,
      'SYSTEM'
    );
  }

  return profile;
}
