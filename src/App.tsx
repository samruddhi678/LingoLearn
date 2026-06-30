import React, { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { getUserProfile, updateUserProfile } from "./firebase";
import LoginScreen from "./components/LoginScreen";
import TranslatorTab from "./components/TranslatorTab";
import VocabularyTab from "./components/VocabularyTab";
import QuizTab from "./components/QuizTab";
import AnalyticsTab from "./components/AnalyticsTab";
import TutorTab from "./components/TutorTab";

import { 
  Languages, 
  BookMarked, 
  BookOpen, 
  Activity, 
  Bot, 
  LogOut, 
  Flame, 
  Sparkles, 
  Award,
  BellRing,
  X
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"translator" | "vocabulary" | "quizzes" | "analytics" | "tutor">("translator");
  const [levelUpAlert, setLevelUpAlert] = useState<string | null>(null);

  // Check if a user is already cached in localStorage
  useEffect(() => {
    const cachedUser = localStorage.getItem("lingo_current_user");
    if (cachedUser) {
      loadProfile(cachedUser);
    }
  }, []);

  const loadProfile = async (username: string) => {
    try {
      const profile = await getUserProfile(username);
      setUser(profile);
      localStorage.setItem("lingo_current_user", profile.username);
    } catch (e) {
      console.error("Error autoloading user", e);
    }
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("lingo_current_user", profile.username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("lingo_current_user");
    setActiveTab("translator");
  };

  const handleXpEarned = async (xpEarned: number) => {
    if (!user) return;

    const currentXp = user.xp;
    const newXp = currentXp + xpEarned;
    let newLevel = user.level;

    // Check level thresholds
    if (newXp >= 1000 && currentXp < 1000) {
      newLevel = "advanced";
      setLevelUpAlert(`Congratulations! 🎉 You reached Advanced Learner status! Keep up the brilliant work.`);
    } else if (newXp >= 300 && currentXp < 300) {
      newLevel = "intermediate";
      setLevelUpAlert(`Hooray! 🌟 You leveled up to Intermediate Learner! Your language skills are blooming.`);
    }

    const updatedProfile: UserProfile = {
      ...user,
      xp: newXp,
      level: newLevel
    };

    setUser(updatedProfile);
    await updateUserProfile(updatedProfile);
  };

  // If no user is signed in, show the Login screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* 1. LEVEL UP ALERT BAR */}
      {levelUpAlert && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-3 px-4 shadow-md flex items-center justify-between text-sm font-semibold z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
            <span>{levelUpAlert}</span>
          </div>
          <button 
            id="close-level-up-alert-btn"
            onClick={() => setLevelUpAlert(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. NAVIGATION HEADER */}
      <header className="bg-white border-b-2 border-slate-200 py-4 px-6 flex items-center justify-between shadow-[4px_4px_0px_rgba(15,23,42,0.03)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tight shadow-[2px_2px_0px_rgba(15,23,42,0.15)]">
            L
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-display tracking-tight text-[#4F46E5] leading-none">
              LingoLearn.
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 tracking-wider">
              Learning {user.targetLang} from {user.sourceLang}
            </p>
          </div>
        </div>

        {/* User Stats Bar */}
        <div className="flex items-center gap-4">
          
          {/* Daily Streak Flame */}
          <div 
            id="streak-header-badge"
            className="flex items-center gap-1.5 bg-rose-50 border-2 border-rose-100 text-[#E11D48] py-1.5 px-3 rounded-2xl text-xs font-bold transition-all hover:bg-rose-100/50 cursor-pointer shadow-[2px_2px_0px_rgba(225,29,72,0.05)]"
            onClick={() => setActiveTab("analytics")}
            title="Practice Streak Count"
          >
            <Flame className="w-4.5 h-4.5 fill-[#E11D48] text-[#E11D48] animate-pulse" />
            <span>{user.streakCount} Day Streak</span>
          </div>

          {/* XP Level info */}
          <div 
            id="xp-header-badge"
            className="hidden sm:flex items-center gap-1.5 bg-[#F5F3FF] border-2 border-[#E0E7FF] text-[#4F46E5] py-1.5 px-3 rounded-2xl text-xs font-bold cursor-pointer hover:bg-indigo-50/50 shadow-[2px_2px_0px_rgba(79,70,229,0.05)]"
            onClick={() => setActiveTab("analytics")}
          >
            <Award className="w-4.5 h-4.5 text-[#4F46E5]" />
            <span className="capitalize">{user.level} ({user.xp} XP)</span>
          </div>

          {/* Logged Username / Logout */}
          <div className="flex items-center gap-3 border-l-2 border-slate-200 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-slate-700 leading-none">
                @{user.username}
              </p>
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">
                Active student
              </span>
            </div>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border-2 border-transparent hover:border-rose-200"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* 3. APP CONTENT LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation tabs column (responsive sidebar on MD+, top nav on small screens) */}
        <nav className="bg-white border-b-2 md:border-b-0 md:border-r-2 border-slate-200 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0 md:w-64">
          
          <button
            id="tab-btn-translator"
            onClick={() => setActiveTab("translator")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all w-full select-none shrink-0 md:shrink border-2 ${
              activeTab === "translator"
                ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[3px_3px_0px_rgba(79,70,229,0.2)]"
                : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <Languages className="w-4.5 h-4.5" />
            <span className="block">Translator & Learn</span>
          </button>

          <button
            id="tab-btn-vocabulary"
            onClick={() => setActiveTab("vocabulary")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all w-full select-none shrink-0 md:shrink border-2 ${
              activeTab === "vocabulary"
                ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[3px_3px_0px_rgba(79,70,229,0.2)]"
                : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <BookMarked className="w-4.5 h-4.5" />
            <span className="block">My Vocabulary</span>
          </button>

          <button
            id="tab-btn-quizzes"
            onClick={() => setActiveTab("quizzes")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all w-full select-none shrink-0 md:shrink border-2 ${
              activeTab === "quizzes"
                ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[3px_3px_0px_rgba(79,70,229,0.2)]"
                : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span className="block">Interactive Quizzes</span>
          </button>

          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all w-full select-none shrink-0 md:shrink border-2 ${
              activeTab === "analytics"
                ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[3px_3px_0px_rgba(79,70,229,0.2)]"
                : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            <span className="block">Analytics & Streak</span>
          </button>

          <button
            id="tab-btn-tutor"
            onClick={() => setActiveTab("tutor")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all w-full select-none shrink-0 md:shrink border-2 ${
              activeTab === "tutor"
                ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[3px_3px_0px_rgba(79,70,229,0.2)]"
                : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <Bot className="w-4.5 h-4.5" />
            <span className="block">LingoTutor Chat</span>
          </button>

        </nav>

        {/* Primary View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F8FAFC]">
          
          {/* Render individual tab panels */}
          {activeTab === "translator" && (
            <TranslatorTab user={user} onXpEarned={handleXpEarned} />
          )}

          {activeTab === "vocabulary" && (
            <VocabularyTab user={user} onXpEarned={handleXpEarned} />
          )}

          {activeTab === "quizzes" && (
            <QuizTab user={user} onXpEarned={handleXpEarned} />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab user={user} />
          )}

          {activeTab === "tutor" && (
            <TutorTab user={user} onXpEarned={handleXpEarned} />
          )}

        </main>
      </div>
    </div>
  );
}
