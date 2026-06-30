import React, { useState, useEffect } from "react";
import { UserProfile, QuizHistory } from "../types";
import { getQuizHistory, getSavedWords } from "../firebase";
import { 
  Flame, 
  TrendingUp, 
  Activity, 
  Award, 
  Calendar, 
  Hourglass, 
  CheckCircle, 
  BookMarked,
  HelpCircle,
  Clock
} from "lucide-react";

interface AnalyticsTabProps {
  user: UserProfile;
}

export default function AnalyticsTab({ user }: AnalyticsTabProps) {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user.username]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const h = await getQuizHistory(user.username);
      setHistory(h);

      const words = await getSavedWords(user.username);
      setSavedCount(words.length);
      setMasteredCount(words.filter(w => w.status === "mastered").length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0 
    ? Math.round((history.reduce((sum, item) => sum + (item.score / item.totalQuestions), 0) / totalQuizzes) * 100)
    : 0;
  
  // Calculate level caps
  const currentLevel = user.level || "beginner";
  let xpMax = 300;
  let xpMin = 0;
  if (currentLevel === "intermediate") {
    xpMin = 300;
    xpMax = 1000;
  } else if (currentLevel === "advanced") {
    xpMin = 1000;
    xpMax = 5000;
  }
  const levelProgressPercent = Math.min(100, Math.max(0, ((user.xp - xpMin) / (xpMax - xpMin)) * 100));

  // Calendar streak simulation visualizer
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIndex = new Date().getDay();

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Tab Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
          <Activity className="w-5.5 h-5.5 text-violet-600" />
          Analytics & Daily Streak Progress
        </h2>
        <p className="text-sm text-slate-500">
          Monitor your vocabulary level, review quiz trends, and maintain your practice streak.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-500">Loading progress reports...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: Streak and Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Flame Streak Card */}
            <div className="bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden" id="streak-panel-card">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100">
                    Daily practice streak
                  </span>
                  <p className="text-3xl font-black font-display tracking-tight flex items-center gap-1.5 mt-1">
                    <Flame className="w-8 h-8 fill-amber-300 text-amber-300 animate-bounce" />
                    {user.streakCount} {user.streakCount === 1 ? "Day" : "Days"}
                  </p>
                </div>
                <div className="p-2 bg-white/15 rounded-xl border border-white/10 text-xs font-semibold">
                  Active
                </div>
              </div>

              {/* Weekly calendar check boxes */}
              <div className="mt-8 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-100">
                  <span>Weekly Target Progress</span>
                  <span>{user.streakCount >= 7 ? "Week Met! 🎉" : "Keep going!"}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysOfWeek.map((day, idx) => {
                    // Highlight active practice days based on streak count
                    const isActive = idx === todayIndex || (todayIndex - idx >= 0 && todayIndex - idx < user.streakCount);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          isActive 
                            ? "bg-white text-orange-600 shadow-xs border border-white"
                            : "bg-orange-700/35 border border-orange-700/20 text-orange-200"
                        }`}>
                          {day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Level Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between md:col-span-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current rank & experience
                  </span>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight font-display capitalize">
                    {user.level || "Beginner"} Learner
                  </p>
                </div>
                <div className="p-2 bg-violet-50 rounded-xl text-violet-600 border border-violet-100/50">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Progress to Next Rank</span>
                  <span>{user.xp} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-violet-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${levelProgressPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>{currentLevel === "beginner" ? "0 XP" : currentLevel === "intermediate" ? "300 XP" : "1000 XP"}</span>
                  <span>{currentLevel === "beginner" ? "300 XP (Intermediate)" : currentLevel === "intermediate" ? "1000 XP (Advanced)" : "5000 XP (Master)"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Stats Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-summary-panel">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Practice Sessions
              </span>
              <p className="text-2xl font-black text-slate-800 font-display">
                {totalQuizzes}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">
                Completed interactive quizzes
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Average Score
              </span>
              <p className="text-2xl font-black text-slate-800 font-display">
                {avgScore}%
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">
                Quiz translation accuracy
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vocabulary List
              </span>
              <p className="text-2xl font-black text-slate-800 font-display">
                {savedCount}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">
                Saved practice words
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mastered Words
              </span>
              <p className="text-2xl font-black text-slate-800 font-display">
                {masteredCount}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">
                Words set to mastered rank
              </span>
            </div>
          </div>

          {/* Bottom layout: Performance chart and raw activity log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual SVG Progress chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <TrendingUp className="w-4.5 h-4.5 text-violet-500" />
                Performance Analytics Trend
              </h3>

              {totalQuizzes === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                  Practice interactive quizzes to view analytics trend lines!
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Custom SVG graph */}
                  <div className="w-full h-48 bg-slate-50 rounded-xl p-3 flex items-end relative border border-slate-100">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid background lines */}
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                      <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="0.5" />

                      {/* Polyline chart mapping quiz history */}
                      <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={history
                          .slice()
                          .reverse()
                          .map((item, idx) => {
                            const x = (idx / Math.max(1, totalQuizzes - 1)) * 100;
                            const scoreRatio = item.score / item.totalQuestions;
                            const y = 100 - (scoreRatio * 80 + 10); // leave padding
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />

                      {/* Sparkle Nodes */}
                      {history.slice().reverse().map((item, idx) => {
                        const x = (idx / Math.max(1, totalQuizzes - 1)) * 100;
                        const scoreRatio = item.score / item.totalQuestions;
                        const y = 100 - (scoreRatio * 80 + 10);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="2.5"
                            fill="#a78bfa"
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Floating Axis Labels */}
                    <div className="absolute left-2.5 top-2.5 text-[8px] font-bold text-slate-400 uppercase">
                      100% Score
                    </div>
                    <div className="absolute left-2.5 bottom-2.5 text-[8px] font-bold text-slate-400 uppercase">
                      0% Score
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider">
                    Timeline: Past {totalQuizzes} sessions (left to right)
                  </p>
                </div>
              )}
            </div>

            {/* Raw interactive practice log */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Clock className="w-4.5 h-4.5 text-slate-500" />
                Practice Activity Log
              </h3>

              {totalQuizzes === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No logged practice activities yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-700 capitalize">
                          {item.category.replace("_", " ")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <p className="font-bold text-slate-800">
                          {item.score} / {item.totalQuestions}
                        </p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase">
                          +{item.xpEarned} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
