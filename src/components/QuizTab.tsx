import React, { useState } from "react";
import { UserProfile, QUIZ_CATEGORIES, QuizQuestion } from "../types";
import { saveQuizResult } from "../firebase";
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X, 
  HelpCircle, 
  ChevronRight, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Bookmark,
  Award
} from "lucide-react";

interface QuizTabProps {
  user: UserProfile;
  onXpEarned: (xp: number) => void;
}

export default function QuizTab({ user, onXpEarned }: QuizTabProps) {
  // Config state
  const [selectedCategory, setSelectedCategory] = useState(QUIZ_CATEGORIES[0].id);
  const [selectedDifficulty, setSelectedDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Quiz session state
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    setError("");
    setQuizStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setXpEarned(0);
    setQuizCompleted(false);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLang: user.targetLang,
          sourceLang: user.sourceLang,
          level: selectedDifficulty,
          category: selectedCategory
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz. Please check configuration.");
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Invalid quiz questions structure returned.");
      }

      setQuestions(data.questions);
      setQuizStarted(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch questions. Please make sure your internet is working or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setXpEarned(prev => prev + currentQuestion.xpReward);
    }

    setIsAnswerSubmitted(true);
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Completed! Save stats to db
      const finalXp = xpEarned + 10; // 10 XP flat completion bonus
      setXpEarned(finalXp);
      setQuizCompleted(true);
      
      try {
        await saveQuizResult(
          user.username,
          score + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0), // handle final submission score
          questions.length,
          user.targetLang,
          selectedCategory,
          finalXp
        );
        // Bubble up XP to parent layout
        onXpEarned(finalXp);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Tab Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5.5 h-5.5 text-violet-600" />
          Interactive Vocabulary Quizzes
        </h2>
        <p className="text-sm text-slate-500">
          Reinforce your vocabulary learning with AI-generated interactive multiple choice quizzes customized to your progress.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* QUIZ CONFIG SCREEN */}
      {!quizStarted && !quizCompleted && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Configure Practice Session ({user.sourceLang} → {user.targetLang})
            </h3>
            
            {/* Category selection */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Choose Vocabulary Category
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUIZ_CATEGORIES.map((cat) => (
                  <button
                    id={`quiz-category-${cat.id}`}
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center gap-2 transition-all ${
                      selectedCategory === cat.id
                        ? "border-violet-500 bg-violet-50/50 text-violet-700 font-bold shadow-xs"
                        : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selection */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Select Difficulty Level
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:max-w-md border border-slate-200/50">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <button
                    id={`quiz-difficulty-${level}`}
                    key={level}
                    type="button"
                    onClick={() => setSelectedDifficulty(level)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedDifficulty === level
                        ? "bg-white text-slate-800 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            id="start-quiz-submit-btn"
            onClick={startQuiz}
            className="w-full sm:w-auto bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-sm py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/10"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating Custom Quiz...
              </>
            ) : (
              <>
                Generate Quiz & Play
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ SESSION SCREEN */}
      {quizStarted && !quizCompleted && questions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6" id="active-quiz-panel">
          {/* Progress Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-600 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Score visual */}
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-600">
                Score: <span className="text-violet-600 font-bold">{score}</span>
              </div>
              {/* XP tally */}
              <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-xs font-semibold text-amber-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{xpEarned} XP</span>
              </div>
            </div>
          </div>

          {/* Question Text Card */}
          <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-2xl text-center space-y-2">
            <HelpCircle className="w-6 h-6 text-violet-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              {questions[currentIndex].questionText}
            </h3>
          </div>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 gap-3">
            {questions[currentIndex].options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === questions[currentIndex].correctAnswer;
              
              let cardStyle = "border-slate-100 hover:bg-slate-50 hover:border-slate-200 bg-white";
              let badgeIcon = null;

              if (isAnswerSubmitted) {
                if (isCorrect) {
                  cardStyle = "border-emerald-200 bg-emerald-50/50 text-emerald-800 font-bold shadow-xs";
                  badgeIcon = <Check className="w-4 h-4 text-emerald-600" />;
                } else if (isSelected) {
                  cardStyle = "border-rose-200 bg-rose-50/50 text-rose-800 font-medium";
                  badgeIcon = <X className="w-4 h-4 text-rose-600" />;
                } else {
                  cardStyle = "border-slate-100 opacity-60 bg-white";
                }
              } else if (isSelected) {
                cardStyle = "border-violet-500 bg-violet-50/30 text-violet-800 font-semibold ring-2 ring-violet-500/10";
              }

              return (
                <button
                  id={`quiz-option-${idx}`}
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${cardStyle}`}
                >
                  <span className="text-sm font-medium">{option}</span>
                  {badgeIcon}
                </button>
              );
            })}
          </div>

          {/* Tutor feedback note */}
          {isAnswerSubmitted && questions[currentIndex].explanation && (
            <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-violet-400" /> LingoTutor explanation
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {questions[currentIndex].explanation}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end border-t border-slate-100 pt-4">
            {!isAnswerSubmitted ? (
              <button
                id="submit-answer-btn"
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button
                id="next-question-btn"
                onClick={nextQuestion}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition-all"
              >
                {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUIZ COMPLETED SUMMARY SCREEN */}
      {quizCompleted && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center max-w-md mx-auto space-y-6" id="quiz-complete-card">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
            <CheckCircle2 className="w-10 h-10 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Quiz Session Complete!
            </h3>
            <p className="text-sm text-slate-500">
              Fantastic work practicing vocabulary in <span className="font-semibold text-slate-700">{user.targetLang}</span>.
            </p>
          </div>

          {/* Stats summary block */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Final Score
              </span>
              <p className="text-2xl font-black text-slate-800">
                {score} <span className="text-sm font-normal text-slate-500">/ {questions.length}</span>
              </p>
            </div>

            <div className="text-center space-y-0.5 border-l border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                XP Earned
              </span>
              <p className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                +{xpEarned}
              </p>
            </div>
          </div>

          {/* Completion encouragement text */}
          <p className="text-xs text-slate-500 italic">
            "Your brain is forming new neural connections! Keep practicing daily to protect your streak."
          </p>

          {/* Buttons to restart or change category */}
          <div className="flex flex-col gap-2.5">
            <button
              id="quiz-restart-btn"
              onClick={startQuiz}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </button>

            <button
              id="quiz-config-screen-btn"
              onClick={() => { setQuizStarted(false); setQuizCompleted(false); }}
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all"
            >
              Choose Another Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
