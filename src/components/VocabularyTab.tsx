import React, { useState, useEffect } from "react";
import { UserProfile, SavedWord } from "../types";
import { getSavedWords, toggleWordMastery, unsaveWord, saveWord } from "../firebase";
import { 
  BookMarked, 
  Trash2, 
  Sparkles, 
  Search, 
  CheckCircle, 
  Circle, 
  RefreshCw, 
  Plus, 
  X,
  BookOpen,
  Volume2
} from "lucide-react";

interface VocabularyTabProps {
  user: UserProfile;
  onXpEarned: (xp: number) => void;
}

export default function VocabularyTab({ user, onXpEarned }: VocabularyTabProps) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("all");
  const [search, setSearch] = useState("");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Custom word form state
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customWord, setCustomWord] = useState("");
  const [customTranslation, setCustomTranslation] = useState("");
  const [customPronunciation, setCustomPronunciation] = useState("");
  const [customPartOfSpeech, setCustomPartOfSpeech] = useState("noun");
  const [customExplanation, setCustomExplanation] = useState("");
  const [customExample, setCustomExample] = useState("");
  const [customExampleTranslation, setCustomExampleTranslation] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadSavedWords();
  }, [user.username]);

  const loadSavedWords = async () => {
    try {
      setLoading(true);
      const words = await getSavedWords(user.username);
      setSavedWords(words);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMastery = async (wordId: string, currentStatus: "learning" | "mastered") => {
    try {
      await toggleWordMastery(user.username, wordId);
      
      // Update local state directly for speedy feel
      setSavedWords(prev => prev.map(w => {
        if (w.id === wordId) {
          const updatedStatus = currentStatus === "learning" ? "mastered" : "learning";
          // Reward XP when word is mastered
          if (updatedStatus === "mastered") {
            onXpEarned(15);
          }
          return { ...w, status: updatedStatus };
        }
        return w;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    setDeleteWordId(wordId);
  };

  const confirmDeleteWord = async () => {
    if (!deleteWordId) return;
    try {
      await unsaveWord(user.username, deleteWordId);
      setSavedWords(prev => prev.filter(w => w.id !== deleteWordId));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteWordId(null);
    }
  };

  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customWord.trim() || !customTranslation.trim()) {
      setFormError("Word and Translation are required fields!");
      return;
    }

    const wordId = "custom_" + Date.now().toString();
    const newWord: Omit<SavedWord, "username" | "timestamp" | "status"> = {
      id: wordId,
      word: customWord.trim(),
      translation: customTranslation.trim(),
      pronunciation: customPronunciation.trim() || customWord.trim(),
      partOfSpeech: customPartOfSpeech,
      explanation: customExplanation.trim() || "User added custom word",
      exampleOriginal: customExample.trim(),
      exampleTranslation: customExampleTranslation.trim()
    };

    try {
      await saveWord(user.username, newWord);
      
      // Reset form & state
      setCustomWord("");
      setCustomTranslation("");
      setCustomPronunciation("");
      setCustomPartOfSpeech("noun");
      setCustomExplanation("");
      setCustomExample("");
      setCustomExampleTranslation("");
      setShowAddForm(false);
      
      // Refresh list
      loadSavedWords();
      // Earn 5 XP for adding custom learning vocabulary
      onXpEarned(5);
    } catch (err) {
      console.error(err);
      setFormError("Failed to save word to vocabulary. Please retry.");
    }
  };

  const speakWord = (wordText: string, langName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering flashcard flip
    if (!("speechSynthesis" in window)) return;

    const langMap: Record<string, string> = {
      "English": "en-US",
      "Marathi": "mr-IN",
      "Hindi": "hi-IN",
      "Telugu": "te-IN",
      "Spanish": "es-ES",
      "French": "fr-FR",
      "German": "de-DE",
      "Japanese": "ja-JP"
    };

    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = langMap[langName] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Filter & search calculations
  const filteredWords = savedWords.filter(w => {
    const matchesFilter = filter === "all" || w.status === filter;
    const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) || 
                          w.translation.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-slate-900 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-[#4F46E5]" />
            My Personal Dictionary ({savedWords.length})
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Flip cards to review spelling, hear native pronunciations, and log custom target vocabulary.
          </p>
        </div>

        <button
          id="show-add-vocab-btn"
          onClick={() => setShowAddForm(true)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm py-2.5 px-5 rounded-2xl transition-all shadow-[2px_2px_0px_rgba(79,70,229,0.2)] flex items-center gap-1.5 self-start sm:self-auto hover:translate-y-[-1px]"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Custom Word
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            id="vocab-search-input"
            type="text"
            placeholder="Search saved vocabulary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm font-semibold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:outline-hidden focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-500/10 transition-colors"
          />
        </div>

        {/* Tab filters */}
        <div className="flex items-center bg-[#F1F5F9] p-1.5 rounded-2xl self-start sm:self-auto border-2 border-slate-200/60 gap-1">
          <button
            id="filter-all-btn"
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "all" ? "bg-[#4F46E5] text-white shadow-[2px_2px_0px_rgba(79,70,229,0.15)]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Words
          </button>
          <button
            id="filter-learning-btn"
            onClick={() => setFilter("learning")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === "learning" ? "bg-[#4F46E5] text-white shadow-[2px_2px_0px_rgba(79,70,229,0.15)]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Circle className={`w-3 h-3 ${filter === "learning" ? "text-white fill-white" : "text-indigo-500"}`} />
            Learning ({savedWords.filter(w => w.status === "learning").length})
          </button>
          <button
            id="filter-mastered-btn"
            onClick={() => setFilter("mastered")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === "mastered" ? "bg-[#4F46E5] text-white shadow-[2px_2px_0px_rgba(79,70,229,0.15)]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle className={`w-3 h-3 ${filter === "mastered" ? "text-white fill-white" : "text-emerald-500"}`} />
            Mastered ({savedWords.filter(w => w.status === "mastered").length})
          </button>
        </div>
      </div>

      {/* Loading & Empty states */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-500 font-bold">Loading your personal dictionary...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border-2 border-slate-200 bento-shadow space-y-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-[#4F46E5]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-900">No saved vocabulary found</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {search 
                ? "No words matched your search criteria." 
                : `Go to the "Translator" tab to translate sentences and bookmark your very first target language vocabulary.`}
            </p>
          </div>
        </div>
      ) : (
        /* Flashcard Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="vocab-cards-grid">
          {filteredWords.map((item) => {
            const isFlipped = flippedCardId === item.id;
            return (
              <div 
                key={item.id} 
                onClick={() => setFlippedCardId(isFlipped ? null : item.id)}
                className="flashcard h-64 w-full cursor-pointer relative"
              >
                <div className={`flashcard-inner w-full h-full relative duration-500 ${isFlipped ? "flashcard-flipped" : ""}`}>
                  
                  {/* FRONT SIDE */}
                  <div className="flashcard-front absolute w-full h-full bg-white rounded-3xl border-2 border-slate-200 bento-shadow p-5 flex flex-col justify-between hover:border-indigo-400 hover:shadow-[6px_6px_0px_rgba(79,70,229,0.08)] transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">
                        {item.partOfSpeech}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`delete-vocab-word-${item.id}`}
                          onClick={(e) => { e.stopPropagation(); handleDeleteWord(item.id); }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          title="Delete word"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Word Middle */}
                    <div className="text-center py-2 space-y-1">
                      <p className="text-2xl font-black text-slate-900 font-sans leading-tight">
                        {item.word}
                      </p>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        Tap card to flip
                      </p>
                    </div>

                    {/* Footer Progress & Status Toggle */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        id={`toggle-mastery-btn-${item.id}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleMastery(item.id, item.status); 
                        }}
                        className={`flex items-center gap-1 text-[11px] font-extrabold py-1 px-2.5 rounded-xl border-2 transition-all ${
                          item.status === "mastered"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-indigo-50/50 border-indigo-100 text-[#4F46E5] hover:bg-indigo-50"
                        }`}
                      >
                        {item.status === "mastered" ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 fill-emerald-100 text-emerald-700" />
                            Mastered (+15 XP)
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            Learning
                          </>
                        )}
                      </button>

                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-slate-300 animate-spin-slow" />
                        Card Flip
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="flashcard-back absolute w-full h-full bg-slate-950 border-2 border-indigo-900 rounded-3xl p-5 flex flex-col justify-between text-white overflow-hidden shadow-lg">
                    {/* Background visual detail */}
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                    
                    {/* Header Back */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">
                        Meaning & Translation
                      </span>
                      
                      {/* TTS Speak button on back */}
                      <button
                        id={`tts-speak-back-${item.id}`}
                        onClick={(e) => speakWord(item.translation, user.targetLang, e)}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                        title="Pronounce word"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Word Meaning Area */}
                    <div className="space-y-2 py-1 text-center">
                      <p className="text-2xl font-black text-amber-300 leading-tight font-sans">
                        {item.translation}
                      </p>
                      {item.pronunciation && (
                        <p className="text-xs font-semibold text-indigo-200 italic">
                          "{item.pronunciation}"
                        </p>
                      )}
                      
                      {item.exampleOriginal && (
                        <div className="border-t border-white/5 pt-2 text-left space-y-0.5">
                          <p className="text-xs font-bold text-white/90 line-clamp-1">
                            "{item.exampleOriginal}"
                          </p>
                          {item.exampleTranslation && (
                            <p className="text-[10px] font-medium text-indigo-200/80 line-clamp-1">
                              {item.exampleTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Back explanation footer */}
                    <div className="text-[10px] text-indigo-200/90 line-clamp-2 border-t border-white/5 pt-2 text-center font-semibold font-sans">
                      {item.explanation}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Word Modal Popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border-2 border-slate-200 p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              id="close-add-vocab-btn"
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-950 flex items-center gap-1.5 border-b-2 border-slate-100 pb-3">
              <Plus className="w-5 h-5 text-[#4F46E5]" />
              Add Custom Word
            </h3>

            <form onSubmit={handleAddCustomWord} className="space-y-4 pt-4">
              {formError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border-2 border-rose-100">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="custom-word-input" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Word ({user.sourceLang})
                  </label>
                  <input
                    id="custom-word-input"
                    type="text"
                    placeholder="e.g. Hello"
                    value={customWord}
                    onChange={(e) => setCustomWord(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5] font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="custom-translation-input" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Translation ({user.targetLang})
                  </label>
                  <input
                    id="custom-translation-input"
                    type="text"
                    placeholder="e.g. नमस्कार"
                    value={customTranslation}
                    onChange={(e) => setCustomTranslation(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="custom-pronunciation-input" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Pronunciation Guide
                  </label>
                  <input
                    id="custom-pronunciation-input"
                    type="text"
                    placeholder="e.g. Namaskar"
                    value={customPronunciation}
                    onChange={(e) => setCustomPronunciation(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="custom-pos-select" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Part Of Speech
                  </label>
                  <select
                    id="custom-pos-select"
                    value={customPartOfSpeech}
                    onChange={(e) => setCustomPartOfSpeech(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-700 rounded-xl border-2 border-slate-200 focus:outline-hidden bg-white font-semibold"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="phrase">Phrase</option>
                    <option value="pronoun">Pronoun</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="custom-explanation-input" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Short Note / Definition
                </label>
                <input
                  id="custom-explanation-input"
                  type="text"
                  placeholder="e.g. A respectful greeting used in India."
                  value={customExplanation}
                  onChange={(e) => setCustomExplanation(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                />
              </div>

              <div className="border-t-2 border-slate-100 pt-3 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Optional Usage Example
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <input
                      id="custom-example-input"
                      type="text"
                      placeholder={`In ${user.targetLang}`}
                      value={customExample}
                      onChange={(e) => setCustomExample(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      id="custom-example-translation-input"
                      type="text"
                      placeholder={`In ${user.sourceLang}`}
                      value={customExampleTranslation}
                      onChange={(e) => setCustomExampleTranslation(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-slate-800 rounded-xl border-2 border-slate-200 focus:outline-hidden focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t-2 border-slate-100 pt-4 mt-2">
                <button
                  id="cancel-add-vocab-btn"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-vocab-btn"
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl transition-colors shadow-[2px_2px_0px_rgba(79,70,229,0.2)]"
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal Popup */}
      {deleteWordId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border-2 border-slate-200 p-6 relative animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              id="close-delete-modal-btn"
              onClick={() => setDeleteWordId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-950 mb-2">
              Delete Word
            </h3>

            <p className="text-sm text-slate-500 font-medium mb-6">
              Are you sure you want to delete this word from your vocabulary? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                id="cancel-delete-vocab-btn"
                type="button"
                onClick={() => setDeleteWordId(null)}
                className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 rounded-xl w-full border border-slate-200"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-vocab-btn"
                onClick={confirmDeleteWord}
                className="px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-[2px_2px_0px_rgba(225,29,72,0.2)] w-full"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
