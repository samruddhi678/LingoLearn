import React, { useState, useEffect } from "react";
import { UserProfile, SUPPORTED_LANGUAGES, TranslationResult, TranslationHistory, SavedWord } from "../types";
import { saveTranslation, getTranslationHistory, saveWord, getSavedWords, unsaveWord } from "../firebase";
import { 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRightLeft, 
  Languages, 
  Copy, 
  Check, 
  History, 
  SearchCode, 
  BookMarked,
  Sparkles
} from "lucide-react";

interface TranslatorTabProps {
  user: UserProfile;
  onXpEarned: (xp: number) => void;
}

export default function TranslatorTab({ user, onXpEarned }: TranslatorTabProps) {
  const [text, setText] = useState("");
  const [sourceLang, setSourceLang] = useState(user.sourceLang || "English");
  const [targetLang, setTargetLang] = useState(user.targetLang || "Marathi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  // Fetch histories and saved words on mount
  useEffect(() => {
    loadHistory();
    loadSavedWords();
  }, [user.username]);

  const loadHistory = async () => {
    try {
      const h = await getTranslationHistory(user.username);
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSavedWords = async () => {
    try {
      const w = await getSavedWords(user.username);
      setSavedWords(w);
    } catch (e) {
      console.error(e);
    }
  };

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setResult(null);
  };

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSavedStatus(false);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang
        })
      });

      if (!response.ok) {
        throw new Error("Translation request failed. Please verify API configuration.");
      }

      const data: TranslationResult = await response.json();
      setResult(data);

      // Save translation to database history
      await saveTranslation(
        user.username,
        text.trim(),
        data.translatedText,
        sourceLang,
        targetLang
      );

      // Reward minor XP for translation learning (e.g. 2 XP)
      onXpEarned(2);

      // Reload history to show the new item
      loadHistory();
    } catch (err: any) {
      console.error(err);
      setError("Failed to translate. Make sure your internet is working and the API keys are correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWord = async () => {
    if (!result) return;
    
    // Generate a simple ID for the word
    const wordId = text.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

    const isAlreadySaved = savedWords.some(w => w.id === wordId);

    try {
      if (isAlreadySaved) {
        await unsaveWord(user.username, wordId);
        setSavedStatus(false);
        loadSavedWords();
      } else {
        await saveWord(user.username, {
          id: wordId,
          word: text.trim(),
          translation: result.translatedText,
          pronunciation: result.pronunciation,
          partOfSpeech: result.partsOfSpeech,
          explanation: result.explanation,
          exampleOriginal: result.examples[0]?.original || "",
          exampleTranslation: result.examples[0]?.translation || ""
        });
        setSavedStatus(true);
        loadSavedWords();
        onXpEarned(5); // Reward 5 XP for saving a vocabulary word
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Check if current word is saved whenever result or savedWords changes
  useEffect(() => {
    if (result) {
      const wordId = text.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      setSavedStatus(savedWords.some(w => w.id === wordId));
    }
  }, [result, savedWords, text]);

  const handleSpeech = () => {
    if (!result) return;
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not fully supported in this browser environment.");
      return;
    }

    // Map common languages to BCP47 locale strings
    const langMap: Record<string, string> = {
      "English": "en-US",
      "Marathi": "mr-IN",
      "Hindi": "hi-IN",
      "Telugu": "te-IN",
      "Spanish": "es-ES",
      "French": "fr-FR",
      "German": "de-DE",
      "Japanese": "ja-JP",
      "Chinese": "zh-CN",
      "Arabic": "ar-SA"
    };

    const utterance = new SpeechSynthesisUtterance(result.translatedText);
    utterance.lang = langMap[targetLang] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const loadFromHistory = (item: TranslationHistory) => {
    setText(item.originalText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    // Auto translate from history
    setTimeout(() => {
      const form = document.getElementById("translator-form") as HTMLFormElement;
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-slate-900 flex items-center gap-2">
            <Languages className="w-6 h-6 text-[#4F46E5]" />
            AI Translator & Learning Hub
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Translate text and get detailed grammar lessons, phonetic guides, and vocabulary cards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Translation panel */}
        <div className="md:col-span-2 space-y-6">
          <form id="translator-form" onSubmit={handleTranslate} className="bento-card p-6 space-y-5">
            {/* Language Selection Header */}
            <div className="flex items-center justify-between gap-2 bg-[#F8FAFC] p-2.5 rounded-2xl border-2 border-slate-200">
              <select
                id="translate-source-lang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-hidden py-1 px-2 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>

              <button
                id="swap-langs-btn"
                type="button"
                onClick={swapLanguages}
                className="p-1.5 rounded-xl text-slate-500 hover:text-[#4F46E5] hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-100 transition-all"
                title="Swap Languages"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              <select
                id="translate-target-lang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-hidden py-1 px-2 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Area */}
            <div className="relative">
              <textarea
                id="translation-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Type anything in ${sourceLang} to translate into ${targetLang}...`}
                className="w-full h-32 p-4 text-slate-800 rounded-2xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-500/10 resize-none font-semibold text-sm transition-all bg-[#F8FAFC]"
                maxLength={500}
              />
              <span className="absolute bottom-3 right-4 text-xs text-slate-400 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-100">
                {text.length}/500
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                id="clear-input-btn"
                type="button"
                onClick={() => { setText(""); setResult(null); }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>

              <button
                id="translate-submit-btn"
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-all shadow-[2px_2px_0px_rgba(79,70,229,0.2)] hover:translate-y-[-1px] flex items-center gap-2"
                disabled={loading || !text.trim()}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Translating...
                  </>
                ) : (
                  <>
                    Translate & Learn
                    <Sparkles className="w-4 h-4 fill-white/10" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-600 text-sm font-bold shadow-[2px_2px_0px_rgba(225,29,72,0.05)]">
              {error}
            </div>
          )}

          {/* Results Learning Card */}
          {result && (
            <div className="bento-card p-6 space-y-6" id="learning-result-card">
              {/* Result main translation header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    {targetLang} Translation
                  </span>
                  <p className="text-3xl font-black text-slate-900 tracking-tight mt-2.5">
                    {result.translatedText}
                  </p>
                  {result.pronunciation && (
                    <p className="text-sm font-semibold text-amber-600 italic mt-1 bg-amber-50/50 border border-amber-100/30 px-2 py-0.5 rounded-lg inline-block">
                      Pronounced: "{result.pronunciation}"
                    </p>
                  )}
                  {result.partsOfSpeech && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                      Part of Speech: {result.partsOfSpeech}
                    </p>
                  )}
                </div>

                {/* Interaction Action Panel */}
                <div className="flex items-center gap-1.5">
                  <button
                    id="tts-speak-btn"
                    onClick={handleSpeech}
                    className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-[#4F46E5] rounded-2xl transition-all border-2 border-slate-200"
                    title="Listen Pronunciation"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>
                  <button
                    id="copy-text-btn"
                    onClick={handleCopy}
                    className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-[#4F46E5] rounded-2xl transition-all border-2 border-slate-200"
                    title="Copy Translation"
                  >
                    {copied ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    id="bookmark-word-btn"
                    onClick={handleSaveWord}
                    className={`p-2.5 rounded-2xl transition-all border-2 ${
                      savedStatus
                        ? "bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:text-amber-500 hover:bg-amber-50/50"
                    }`}
                    title={savedStatus ? "Remove from Vocabulary" : "Save to Vocabulary"}
                  >
                    {savedStatus ? <BookmarkCheck className="w-4.5 h-4.5 fill-amber-400 text-amber-500" /> : <Bookmark className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Vocabulary / Grammar tutor explanation */}
              {result.explanation && (
                <div className="space-y-2 bg-[#F8FAFC] rounded-2xl p-4.5 border-2 border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <SearchCode className="w-4 h-4 text-[#4F46E5]" />
                    Tutor Notes & Grammar Explanation
                  </h4>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              )}

              {/* Examples sentences list */}
              {result.examples && result.examples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-slate-400" />
                    Interactive Usage Examples
                  </h4>
                  <div className="space-y-3">
                    {result.examples.map((ex, idx) => (
                      <div key={idx} className="p-4 bg-indigo-50/30 border-2 border-indigo-100/70 rounded-2xl space-y-1">
                        <p className="text-sm font-bold text-slate-800">
                          {ex.original}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {ex.translation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Translation History */}
        <div className="space-y-6">
          <div className="bento-card p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b-2 border-slate-100 pb-2.5">
              <History className="w-4 h-4 text-[#4F46E5]" />
              Recent Practice History
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-bold">No recent translations.</p>
                <p className="text-[11px] mt-1 font-medium">Translated items will appear here for lookup.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3.5 rounded-2xl hover:bg-slate-50 border-2 border-transparent hover:border-slate-200 transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-400">
                      <span>{item.sourceLang} → {item.targetLang}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[#4F46E5] transition-opacity">
                        Load
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {item.originalText}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      {item.translatedText}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
