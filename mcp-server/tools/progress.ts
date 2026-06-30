import { getUserProfile, updateUserProfile, updateDailyStreak as updateStreakHelper } from "./firebase.js";

export async function getUserProgress(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const profile = await getUserProfile(username);
  return profile;
}

export async function updateXP(args: { username: string; xpAmount: number }) {
  const { username, xpAmount } = args;
  if (!username) throw new Error("Missing username");
  if (typeof xpAmount !== "number" || xpAmount <= 0) {
    throw new Error("xpAmount must be a positive number");
  }

  const profile = await getUserProfile(username);
  const newXp = profile.xp + xpAmount;
  let newLevel = profile.level;
  if (newXp >= 1000) newLevel = "advanced";
  else if (newXp >= 300) newLevel = "intermediate";

  const updatedProfile = {
    ...profile,
    xp: newXp,
    level: newLevel
  };

  await updateUserProfile(updatedProfile);
  return { success: true, profile: updatedProfile, xpEarned: xpAmount };
}

export async function updateDailyStreak(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const updatedProfile = await updateStreakHelper(username);
  return { success: true, streakCount: updatedProfile.streakCount, lastActiveDate: updatedProfile.lastActiveDate };
}
