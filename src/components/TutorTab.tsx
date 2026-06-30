import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Volume2, 
  Mic, 
  MicOff, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  MessageSquare, 
  ChevronRight, 
  GraduationCap, 
  ArrowRight, 
  Info,
  VolumeX
} from "lucide-react";

// Expand ChatMessage interface locally for rich practice context
interface PracticeMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  translation?: string;
  pronunciation?: string;
  feedback?: {
    hasErrors: boolean;
    explanation: string;
    corrections: string | null;
    tips: string;
  } | null;
  suggestedReplies?: Array<{ text: string; translation: string }> | null;
}

interface TutorTabProps {
  user: UserProfile;
  onXpEarned?: (xp: number) => void;
}

const SCENARIOS = [
  {
    id: "cafe",
    name: "Order at a Cafe",
    description: "Greet the waiter, order food or drinks, and ask for the bill at a cozy local cafe.",
    icon: "☕",
    color: "from-amber-500 to-orange-600",
    themeColor: "amber",
    tags: ["Dining", "Polite forms"]
  },
  {
    id: "hotel",
    name: "Check-in at a Hotel",
    description: "Check in at the reception desk, ask about amenities, and request clean towels or help.",
    icon: "🏨",
    color: "from-blue-500 to-indigo-600",
    themeColor: "indigo",
    tags: ["Travel", "Service"]
  },
  {
    id: "directions",
    name: "Ask for Directions",
    description: "Ask local citizens how to get to famous landmarks, train stations, or find your way.",
    icon: "🗺️",
    color: "from-emerald-500 to-teal-600",
    themeColor: "emerald",
    tags: ["Navigation", "Streets"]
  },
  {
    id: "market",
    name: "Shop at a Local Market",
    description: "Inquire about prices of fruits or clothing, negotiate a small discount, and buy goods.",
    icon: "🛍️",
    color: "from-rose-500 to-pink-600",
    themeColor: "rose",
    tags: ["Shopping", "Bargaining"]
  },
  {
    id: "casual",
    name: "Casual Casual Chat",
    description: "Introduce yourself, chat about hobbies, discuss the local weather, and make a friend.",
    icon: "💬",
    color: "from-violet-500 to-purple-600",
    themeColor: "violet",
    tags: ["Social", "Greetings"]
  },
  {
    id: "interview",
    name: "Mock Job Interview",
    description: "Introduce your skillset, answer basic career questions, and explain your motivation.",
    icon: "💼",
    color: "from-slate-700 to-slate-900",
    themeColor: "slate",
    tags: ["Formal", "Careers"]
  }
];

export default function TutorTab({ user, onXpEarned }: TutorTabProps) {
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[4]); // Default to Casual Chat
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  
  // Speech STT/TTS settings
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoVocalize, setAutoVocalize] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  // Set default language for Speech Recognition based on user's target language
  const getLanguageLocale = (langCode: string): string => {
    const mapCodeToLocale: Record<string, string> = {
      en: "en-US",
      mr: "mr-IN",
      hi: "hi-IN",
      te: "te-IN",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      ja: "ja-JP",
      zh: "zh-CN",
      ar: "ar-AE"
    };
    return mapCodeToLocale[langCode] || "en-US";
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = getLanguageLocale(user.targetLang);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Speak text via TTS synthesis
  const speakText = (text: string, langCode: string) => {
    if (!window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel(); // Stop any active voices
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageLocale(langCode);
      
      // Attempt to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start/Restart roleplay chat whenever scenario or difficulty level changes
  useEffect(() => {
    startNewRoleplay();
  }, [selectedScenario, difficulty, user.targetLang]);

  // Scroll chat to the bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startNewRoleplay = async () => {
    stopSpeaking();
    setMessages([]);
    setLoading(true);

    try {
      // Prompt system to kickstart the roleplay conversation
      const response = await fetch("/api/chat-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `System: Please initiate the roleplay. Send the welcoming introductory message for the scenario "${selectedScenario.name}" at difficulty level "${difficulty}".`,
          history: [],
          targetLang: user.targetLang,
          sourceLang: user.sourceLang,
          scenario: selectedScenario.name,
          difficulty: difficulty,
          username: user.username
        })
      });

      if (!response.ok) {
        throw new Error("Failed to initialize conversation");
      }

      const data = await response.json();

      const initialMsg: PracticeMessage = {
        id: "intro-" + Date.now(),
        role: "model",
        content: data.reply,
        translation: data.translation,
        pronunciation: data.pronunciation,
        feedback: null, // No feedback for bot's greeting
        suggestedReplies: data.suggestedReplies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([initialMsg]);

      if (autoVocalize) {
        speakText(data.reply, user.targetLang);
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
      setMessages([
        {
          id: "error-" + Date.now(),
          role: "model",
          content: `Hello! Let's practice speaking in **${user.targetLang}** for the scenario **${selectedScenario.name}**. Speak or type your message below to begin!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    stopSpeaking();
    const cleanText = textToSend.trim();

    const userMsg: PracticeMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Filter out system messages or errors from history context
      const historyContext = messages
        .filter(m => !m.id.startsWith("error-"))
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch("/api/chat-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanText,
          history: historyContext,
          targetLang: user.targetLang,
          sourceLang: user.sourceLang,
          scenario: selectedScenario.name,
          difficulty: difficulty,
          username: user.username
        })
      });

      if (!response.ok) {
        throw new Error("Chat practice failed.");
      }

      const data = await response.json();
      
      const modelMsg: PracticeMessage = {
        id: "model-" + (Date.now() + 1),
        role: "model",
        content: data.reply,
        translation: data.translation,
        pronunciation: data.pronunciation,
        feedback: data.feedback,
        suggestedReplies: data.suggestedReplies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);

      // Reward user with 5 XP for active conversation practice
      if (onXpEarned) {
        onXpEarned(5);
      }

      if (autoVocalize) {
        speakText(data.reply, user.targetLang);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: "error-snag-" + Date.now(),
          role: "model",
          content: "LingoTutor is experiencing high traffic. Please retry sending your message.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#4F46E5]" />
            LingoInteractive Scenario Chat
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Immersive scenario roleplay with automatic pronunciation guidance, voice speaking, and real-time grammar feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="bg-rose-50 text-rose-600 border-2 border-rose-200 hover:bg-rose-100 rounded-xl px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 animate-pulse"
              title="Stop speech synthesis"
            >
              <VolumeX className="w-4 h-4" />
              Stop TTS Voice
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs bg-indigo-50 border-2 border-indigo-100 font-extrabold px-3 py-1.5 rounded-xl text-[#4F46E5] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#4F46E5] animate-spin-slow" />
            AI Partner Ready
          </span>
        </div>
      </div>

      {/* 2. Responsive Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns - Scenario Selector and Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* Difficulty Selection Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 bento-shadow space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <GraduationCap className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Select Skill Complexity
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((level) => {
                const isActive = difficulty === level;
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold capitalize border-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-[2px_2px_0px_rgba(79,70,229,0.15)]"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex gap-1.5 items-start">
              <Info className="w-3.5 h-3.5 text-[#4F46E5] shrink-0 mt-0.5" />
              <span>
                {difficulty === "beginner" && "Beginner: Short sentences, simple words, helpful translations, and slow voice feedback."}
                {difficulty === "intermediate" && "Intermediate: Normal conversational pace with practical structures and idioms."}
                {difficulty === "advanced" && "Advanced: Faster speaking, highly natural native slang, and richer grammar critiques."}
              </span>
            </p>
          </div>

          {/* Voice Settings Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 bento-shadow space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Volume2 className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Voice & Speaking Settings
              </h3>
            </div>

            <div className="space-y-3">
              {/* Auto Speak Toggle */}
              <label className="flex items-center justify-between p-3 bg-[#F1F5F9] rounded-2xl border border-slate-200/50 cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    Auto-play Voice Response
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    Vocalize tutor replies automatically
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoVocalize}
                  onChange={(e) => setAutoVocalize(e.target.checked)}
                  className="w-4.5 h-4.5 text-[#4F46E5] rounded-sm border-2 border-slate-300 focus:ring-[#4F46E5]"
                />
              </label>

              {/* Speech recognition support check */}
              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 text-[11px] text-indigo-900 font-semibold leading-relaxed flex gap-2">
                <Mic className="w-4 h-4 text-[#4F46E5] shrink-0" />
                <span>
                  {speechSupported 
                    ? `Click the microphone in the chat box to dictate your speech in ${user.targetLang}.`
                    : "Your browser doesn't support Web Speech Recognition. Use Google Chrome or Safari to practice speaking!"}
                </span>
              </div>
            </div>
          </div>

          {/* Scenario Selector Bento Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 bento-shadow flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Choose Live Scenario ({SCENARIOS.length})
                </h3>
              </div>
            </div>

            {/* List scroll container */}
            <div className="space-y-2.5 overflow-y-auto max-h-[280px] lg:max-h-[380px] pr-1 flex-1">
              {SCENARIOS.map((scenario) => {
                const isSelected = selectedScenario.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      if (selectedScenario.id !== scenario.id) {
                        setSelectedScenario(scenario);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer group ${
                      isSelected
                        ? "bg-[#4F46E5]/5 border-[#4F46E5] shadow-[2px_2px_0px_rgba(79,70,229,0.1)]"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-2xl p-2 bg-slate-50 group-hover:bg-indigo-50 rounded-xl shrink-0 border border-slate-100/60 shadow-2xs">
                      {scenario.icon}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`text-xs font-extrabold truncate ${isSelected ? "text-[#4F46E5]" : "text-slate-800"}`}>
                          {scenario.name}
                        </p>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase text-[#4F46E5] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed line-clamp-2">
                        {scenario.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Columns - Dynamic Conversational Chat Room */}
        <div className="lg:col-span-8 flex flex-col min-h-[580px] lg:h-[720px] bg-white rounded-3xl border-2 border-slate-200 bento-shadow overflow-hidden">
          
          {/* Main Panel Header */}
          <div className="bg-slate-50 border-b-2 border-slate-200 p-4 shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedScenario.icon}</span>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Roleplay: {selectedScenario.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-none mt-1">
                  Practicing in <strong className="text-slate-700 capitalize">{user.targetLang}</strong> • Skill: <strong className="text-slate-700 capitalize">{difficulty}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={startNewRoleplay}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 font-bold text-xs py-1.5 px-3 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Scenario
            </button>
          </div>

          {/* Chat Messages Thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
            {messages.map((msg) => {
              const isModel = msg.role === "model";
              return (
                <div 
                  key={msg.id}
                  className={`flex items-start gap-3.5 max-w-[90%] sm:max-w-[85%] ${
                    isModel ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  {/* Speaker profile picture */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shrink-0 ${
                    isModel 
                      ? "bg-[#4F46E5] border-[#4F46E5] text-white shadow-2xs" 
                      : "bg-slate-200 border-slate-300 text-slate-600"
                  }`}>
                    {isModel ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble Column */}
                  <div className="space-y-2 flex-1">
                    
                    {/* Primary Speech bubble */}
                    <div className={`p-4 rounded-3xl border-2 shadow-2xs ${
                      isModel
                        ? "bg-white border-slate-100 text-slate-800 rounded-tl-xs"
                        : "bg-[#4F46E5] border-[#4F46E5] text-white rounded-tr-xs"
                    }`}>
                      
                      {/* Main sentence text */}
                      <div className="space-y-1.5">
                        <div className="text-base font-black leading-relaxed whitespace-pre-wrap select-text">
                          {msg.content}
                        </div>
                        
                        {/* Phonetic Pronunciation Guide */}
                        {isModel && msg.pronunciation && (
                          <div className="text-xs font-bold text-slate-400 italic">
                            "{msg.pronunciation}"
                          </div>
                        )}
                      </div>

                      {/* Expandable Translation Drawer */}
                      {isModel && msg.translation && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {msg.translation}
                          </p>
                          <div className="flex gap-1.5">
                            {/* Pronounce Original Target Text */}
                            <button
                              onClick={() => speakText(msg.content, user.targetLang)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                              title="Listen to Target Pronunciation"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Speak Button for User's speech bubble */}
                      {!isModel && (
                        <div className="mt-1 flex justify-end">
                          <button
                            onClick={() => speakText(msg.content, user.targetLang)}
                            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                            title="Hear your voice selection"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Bubble Timestamp */}
                      <span className={`block text-[9px] font-black text-right mt-1.5 ${
                        isModel ? "text-slate-400" : "text-indigo-200"
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Real-time Grammatical Feedback Card (ONLY FOR BOT REPLIES AND INCORPORATING USER PREVIOUS INPUT) */}
                    {isModel && msg.feedback && (
                      <div className={`p-4 rounded-3xl border-2 text-xs leading-relaxed space-y-2 bento-shadow ${
                        msg.feedback.hasErrors
                          ? "bg-amber-50/80 border-amber-200 text-amber-900"
                          : "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      }`}>
                        <div className="flex items-center gap-2 font-black border-b pb-1.5 border-slate-200/40">
                          {msg.feedback.hasErrors ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="uppercase tracking-wider">Tutor Grammatical Correction (+5 XP earned)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="uppercase tracking-wider">Pristine Grammar Check! (+5 XP earned)</span>
                            </>
                          )}
                        </div>

                        {msg.feedback.corrections && (
                          <div className="space-y-1">
                            <span className="font-extrabold uppercase text-[10px] text-slate-400 block tracking-wide">
                              Better/Correct Phrasing:
                            </span>
                            <div className="font-black text-slate-900 bg-white border border-slate-200/50 p-2 rounded-xl flex justify-between items-center gap-2">
                              <span>{msg.feedback.corrections}</span>
                              <button
                                onClick={() => speakText(msg.feedback!.corrections!, user.targetLang)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-[#4F46E5] shrink-0"
                                title="Listen to corrected form"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1 mt-1.5">
                          <span className="font-extrabold uppercase text-[10px] text-slate-400 block tracking-wide">
                            LingoTutor Analysis:
                          </span>
                          <p className="font-medium text-slate-700">
                            {msg.feedback.explanation}
                          </p>
                        </div>

                        {msg.feedback.tips && (
                          <div className="pt-1.5 border-t border-slate-200/40 mt-1 flex gap-1.5">
                            <span className="font-bold text-slate-500 uppercase text-[9px] shrink-0">Tip:</span>
                            <p className="font-bold text-slate-600 text-[11px]">{msg.feedback.tips}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Candidate Next Replies (ONLY ON THE MOST RECENT MODEL RESPONSE) */}
                    {isModel && msg.suggestedReplies && messages[messages.length - 1].id === msg.id && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Suggested responses (Tap to reply):
                        </span>
                        
                        <div className="flex flex-col gap-1.5">
                          {msg.suggestedReplies.map((reply, idx) => (
                            <button
                              id={`suggested-reply-${idx}`}
                              key={idx}
                              onClick={() => handleSend(reply.text)}
                              className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 p-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-4 cursor-pointer text-slate-800"
                            >
                              <div className="min-w-0">
                                <span className="text-slate-900 block truncate">{reply.text}</span>
                                <span className="text-[10px] text-slate-400 block font-semibold truncate mt-0.5">
                                  {reply.translation}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#4F46E5] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {/* Chat loader */}
            {loading && (
              <div className="flex items-start gap-3.5 max-w-[80%] mr-auto">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] border-2 border-[#4F46E5] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border-2 border-slate-100 p-4 rounded-3xl rounded-tl-xs flex items-center gap-2 text-slate-400 text-sm bento-shadow">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce duration-300"></span>
                    <span className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce duration-300 [animation-delay:0.15s]"></span>
                    <span className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce duration-300 [animation-delay:0.3s]"></span>
                  </span>
                  LingoTutor is analyzing...
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Action Input Box Form */}
          <div className="p-4 bg-slate-50 border-t-2 border-slate-200 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="flex items-center gap-2.5 bg-white border-2 border-slate-200 rounded-2xl p-2 focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-[#4F46E5]/10 transition-all shadow-xs"
            >
              {/* Dictation mic button */}
              {speechSupported && (
                <button
                  id="mic-stt-btn"
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                  }`}
                  title={isListening ? "Listening... click to stop" : `Start dictation in ${user.targetLang}`}
                >
                  {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>
              )}

              <input
                id="practice-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening... Speak clearly..." : `Practice chatting in ${user.targetLang}...`}
                disabled={loading}
                className="flex-1 text-sm text-slate-800 font-semibold bg-transparent py-2.5 px-3 outline-hidden"
              />

              <button
                id="practice-send-btn"
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-45 text-white p-3 rounded-xl transition-all shadow-[2px_2px_0px_rgba(79,70,229,0.2)] hover:translate-y-[-1px] cursor-pointer"
                title="Send practice input"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2.5 flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                <Info className="w-3 h-3" />
                Press send or enter to post reply • +5 XP per turn
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
