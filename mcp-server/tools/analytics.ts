import { getQuizHistory, getSavedWords, getUserProfile } from "./firebase.js";

export async function getAnalytics(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const [history, words, profile] = await Promise.all([
    getQuizHistory(username),
    getSavedWords(username),
    getUserProfile(username)
  ]);

  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0 
    ? Math.round((history.reduce((sum, item) => sum + (item.score / item.totalQuestions), 0) / totalQuizzes) * 100)
    : 0;

  const savedCount = words.length;
  const masteredCount = words.filter(w => w.status === "mastered").length;

  return {
    username,
    totalQuizzes,
    avgScore,
    savedVocabularyCount: savedCount,
    masteredVocabularyCount: masteredCount,
    streakCount: profile.streakCount,
    xp: profile.xp,
    level: profile.level
  };
}

export async function getPerformanceGraphData(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const history = await getQuizHistory(username);
  
  // Return reversed past sessions (left-to-right) with mapped percentage and categories
  const graphData = history.slice().reverse().map((item, idx) => {
    const scoreRatio = item.score / item.totalQuestions;
    return {
      index: idx,
      scorePercent: Math.round(scoreRatio * 100),
      category: item.category,
      timestamp: item.timestamp,
      xpEarned: item.xpEarned
    };
  });

  return { username, dataPoints: graphData };
}
