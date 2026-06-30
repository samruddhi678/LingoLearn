export interface UserProfile {
  username: string;
  joinedDate: string;
  streakCount: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  level: string; // "beginner", "intermediate", "advanced"
  xp: number;
  sourceLang: string;
  targetLang: string;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  xpReward: number;
}

export interface QuizHistory {
  id?: string;
  username: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  language: string;
  category: string;
  xpEarned: number;
}

export interface SavedWord {
  id: string;
  username: string;
  word: string;
  translation: string;
  pronunciation: string;
  partOfSpeech: string;
  explanation: string;
  exampleOriginal: string;
  exampleTranslation: string;
  timestamp: string;
  status: "learning" | "mastered";
}

export interface TranslationHistory {
  id?: string;
  username: string;
  timestamp: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslationResult {
  translatedText: string;
  pronunciation: string;
  partsOfSpeech: string;
  explanation: string;
  examples: Array<{
    original: string;
    translation: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "mr", name: "Marathi", flag: "🇮🇳", nativeName: "मराठी" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "te", name: "Telugu", flag: "🇮🇳", nativeName: "తెలుగు" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" }
];

export const QUIZ_CATEGORIES = [
  { id: "general conversation", name: "General Conversation", icon: "MessageCircle" },
  { id: "travel & directions", name: "Travel & Directions", icon: "Compass" },
  { id: "food & dining", name: "Food & Dining", icon: "Utensils" },
  { id: "shopping & money", name: "Shopping & Money", icon: "ShoppingBag" },
  { id: "grammar & verbs", name: "Grammar & Verbs", icon: "BookOpen" },
  { id: "family & relationships", name: "Family & Relationships", icon: "Users" }
];
