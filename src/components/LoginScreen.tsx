import React, { useState } from "react";
import { SUPPORTED_LANGUAGES, UserProfile } from "../types";
import { getUserProfile, updateDailyStreak } from "../firebase";
import { Sparkles, Globe, ArrowRight, Flame } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Marathi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username to start learning!");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get or create user profile
      let profile = await getUserProfile(username);
      
      // Update streak on login
      profile = await updateDailyStreak(profile.username);

      // If it's a newly created user or they want to update their preferred languages, save them
      profile.sourceLang = sourceLang;
      profile.targetLang = targetLang;

      onLoginSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError("An error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" id="login-card">
        {/* Decorative Top Branding Bar */}
        <div className="bg-linear-to-r from-violet-600 to-indigo-600 p-8 text-center text-white relative">
          <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
            AI-Powered Learning
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/25 backdrop-blur-md">
            <Globe className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">LingoLearn</h1>
          <p className="text-indigo-100 text-sm mt-1">Real-time translator & interactive practice</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium" id="login-error">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Learning Username
            </label>
            <input
              id="username-input"
              type="text"
              placeholder="e.g. sam_gugale"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-800 transition-all font-medium"
              disabled={loading}
              maxLength={20}
            />
            <p className="text-[11px] text-slate-400">
              Enter any username. We'll use this to keep your stats, daily streaks, and saved vocabulary!
            </p>
          </div>

          {/* Source & Target Language Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="source-language-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                I Speak
              </label>
              <select
                id="source-language-select"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm focus:outline-hidden focus:border-violet-500"
                disabled={loading}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="target-language-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                I Want To Learn
              </label>
              <select
                id="target-language-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm focus:outline-hidden focus:border-violet-500"
                disabled={loading}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Info Block */}
          <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100 flex items-start gap-3">
            <div className="p-1 bg-amber-100 rounded-lg text-amber-600 mt-0.5">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Daily Practice Streak</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice every day to build a streak! Interactive quizzes, real-time translations, and chat with LingoTutor contribute to daily learning.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/25 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Logging in...
              </span>
            ) : (
              <>
                Start Learning Journey
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
