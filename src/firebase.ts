import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  addDoc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDvzWaXNoh5ekXgFq2m8KcKVI9HgqXdenU",
  authDomain: "mystic-pentameter-t1wkv.firebaseapp.com",
  projectId: "mystic-pentameter-t1wkv",
  storageBucket: "mystic-pentameter-t1wkv.firebasestorage.app",
  messagingSenderId: "138817860724",
  appId: "1:138817860724:web:6e87ecb84bc7faab674d21"
};

const databaseId = "ai-studio-c812043d-be49-4e8c-958b-88b4223e28f1";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore with custom database ID
export const db = getFirestore(app, databaseId);

// Define standard typescript interfaces for our learning app data structures
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

export interface QuizHistory {
  id?: string;
  username: string;
  timestamp: any;
  score: number;
  totalQuestions: number;
  language: string;
  category: string;
  xpEarned: number;
}

export interface SavedWord {
  id: string; // unique hash or word
  username: string;
  word: string;
  translation: string;
  pronunciation: string;
  partOfSpeech: string;
  explanation: string;
  exampleOriginal: string;
  exampleTranslation: string;
  timestamp: any;
  status: "learning" | "mastered";
}

export interface TranslationHistory {
  id?: string;
  username: string;
  timestamp: any;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

// Database helper functions with automatic localStorage fallback for offline/robustness

// 1. Get or Create User Profile
export async function getUserProfile(username: string): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) throw new Error("Username cannot be empty");

  try {
    const userDocRef = doc(db, "users", cleanUsername);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      return data;
    } else {
      // Create a default profile
      const todayStr = new Date().toISOString().split('T')[0];
      const newProfile: UserProfile = {
        username: cleanUsername,
        joinedDate: todayStr,
        streakCount: 1,
        lastActiveDate: todayStr,
        level: "beginner",
        xp: 0,
        sourceLang: "English",
        targetLang: "Marathi"
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn("Firestore error in getUserProfile, falling back to localStorage", err);
    // Fallback to local storage
    const localKey = `lingo_user_${cleanUsername}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      return JSON.parse(localData);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const newProfile: UserProfile = {
        username: cleanUsername,
        joinedDate: todayStr,
        streakCount: 1,
        lastActiveDate: todayStr,
        level: "beginner",
        xp: 0,
        sourceLang: "English",
        targetLang: "Marathi"
      };
      localStorage.setItem(localKey, JSON.stringify(newProfile));
      return newProfile;
    }
  }
}

// 2. Update User Profile (e.g. update languages, xp, level, streak)
export async function updateUserProfile(profile: UserProfile): Promise<void> {
  const cleanUsername = profile.username.trim().toLowerCase();
  try {
    const userDocRef = doc(db, "users", cleanUsername);
    await setDoc(userDocRef, profile, { merge: true });
  } catch (err) {
    console.warn("Firestore error in updateUserProfile, updating local storage only", err);
  }
  localStorage.setItem(`lingo_user_${cleanUsername}`, JSON.stringify(profile));
}

// 3. Process streak count for a user logging in or taking action today
export async function updateDailyStreak(username: string): Promise<UserProfile> {
  const profile = await getUserProfile(username);
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActive = profile.lastActiveDate;

  if (lastActive === todayStr) {
    // Already active today, streak stays the same
    return profile;
  }

  const today = new Date(todayStr);
  const lastActiveDate = new Date(lastActive);
  
  // Calculate difference in days
  const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let updatedStreak = profile.streakCount;
  if (diffDays === 1) {
    // Active on consecutive days! Increment streak.
    updatedStreak += 1;
  } else if (diffDays > 1) {
    // Missed a day, streak resets to 1
    updatedStreak = 1;
  }

  const updatedProfile: UserProfile = {
    ...profile,
    streakCount: updatedStreak,
    lastActiveDate: todayStr
  };

  await updateUserProfile(updatedProfile);
  return updatedProfile;
}

// 4. Save a quiz session result
export async function saveQuizResult(
  username: string, 
  score: number, 
  totalQuestions: number, 
  language: string, 
  category: string,
  xpEarned: number
): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const quizResult: QuizHistory = {
    username: cleanUsername,
    timestamp: new Date().toISOString(),
    score,
    totalQuestions,
    language,
    category,
    xpEarned
  };

  try {
    const quizColRef = collection(db, "quizzes");
    await addDoc(quizColRef, quizResult);

    // Also update user's XP and potentially level
    const profile = await getUserProfile(cleanUsername);
    const newXp = profile.xp + xpEarned;
    let newLevel = profile.level;
    if (newXp >= 1000) newLevel = "advanced";
    else if (newXp >= 300) newLevel = "intermediate";

    await updateUserProfile({
      ...profile,
      xp: newXp,
      level: newLevel
    });
  } catch (err) {
    console.warn("Firestore error in saveQuizResult, falling back to local storage", err);
    // Local storage history
    const localHistoryKey = `lingo_history_${cleanUsername}`;
    const currentHistory = JSON.parse(localStorage.getItem(localHistoryKey) || "[]");
    currentHistory.push({ ...quizResult, id: Math.random().toString() });
    localStorage.setItem(localHistoryKey, JSON.stringify(currentHistory));

    // Update local user profile too
    const profile = await getUserProfile(cleanUsername);
    const newXp = profile.xp + xpEarned;
    let newLevel = profile.level;
    if (newXp >= 1000) newLevel = "advanced";
    else if (newXp >= 300) newLevel = "intermediate";
    await updateUserProfile({
      ...profile,
      xp: newXp,
      level: newLevel
    });
  }
}

// 5. Fetch user quiz history
export async function getQuizHistory(username: string): Promise<QuizHistory[]> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    const quizColRef = collection(db, "quizzes");
    const q = query(
      quizColRef, 
      where("username", "==", cleanUsername),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const results: QuizHistory[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as QuizHistory);
    });
    return results;
  } catch (err) {
    console.warn("Firestore error in getQuizHistory, fetching from local storage", err);
    const localHistoryKey = `lingo_history_${cleanUsername}`;
    return JSON.parse(localStorage.getItem(localHistoryKey) || "[]");
  }
}

// 6. Save a vocabulary word
export async function saveWord(username: string, wordData: Omit<SavedWord, "username" | "timestamp" | "status">): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const savedWord: SavedWord = {
    ...wordData,
    username: cleanUsername,
    timestamp: new Date().toISOString(),
    status: "learning"
  };

  try {
    const wordDocRef = doc(db, "saved_words", `${cleanUsername}_${wordData.id}`);
    await setDoc(wordDocRef, savedWord);
  } catch (err) {
    console.warn("Firestore error in saveWord, falling back to local storage", err);
  }
  
  const localWordsKey = `lingo_words_${cleanUsername}`;
  const currentWords = JSON.parse(localStorage.getItem(localWordsKey) || "[]") as SavedWord[];
  const index = currentWords.findIndex(w => w.id === wordData.id);
  if (index >= 0) {
    currentWords[index] = savedWord;
  } else {
    currentWords.push(savedWord);
  }
  localStorage.setItem(localWordsKey, JSON.stringify(currentWords));
}

// 7. Toggle vocabulary word mastered status
export async function toggleWordMastery(username: string, wordId: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const localWordsKey = `lingo_words_${cleanUsername}`;
  const currentWords = JSON.parse(localStorage.getItem(localWordsKey) || "[]") as SavedWord[];
  const word = currentWords.find(w => w.id === wordId);
  if (!word) return;

  const newStatus = word.status === "learning" ? "mastered" : "learning";
  word.status = newStatus;

  try {
    const wordDocRef = doc(db, "saved_words", `${cleanUsername}_${wordId}`);
    await updateDoc(wordDocRef, { status: newStatus });
  } catch (err) {
    console.warn("Firestore error in toggleWordMastery, updating local storage only", err);
  }

  localStorage.setItem(localWordsKey, JSON.stringify(currentWords));
}

// 8. Delete saved word
export async function unsaveWord(username: string, wordId: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    const wordDocRef = doc(db, "saved_words", `${cleanUsername}_${wordId}`);
    await deleteDoc(wordDocRef);
  } catch (err) {
    console.warn("Firestore error in unsaveWord, updating local storage only", err);
  }

  const localWordsKey = `lingo_words_${cleanUsername}`;
  const currentWords = JSON.parse(localStorage.getItem(localWordsKey) || "[]") as SavedWord[];
  const filtered = currentWords.filter(w => w.id !== wordId);
  localStorage.setItem(localWordsKey, JSON.stringify(filtered));
}

// 9. Get all saved vocabulary words for a user
export async function getSavedWords(username: string): Promise<SavedWord[]> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    const wordsColRef = collection(db, "saved_words");
    const q = query(
      wordsColRef,
      where("username", "==", cleanUsername),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const results: SavedWord[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as SavedWord);
    });
    return results;
  } catch (err) {
    console.warn("Firestore error in getSavedWords, fetching from local storage", err);
    const localWordsKey = `lingo_words_${cleanUsername}`;
    return JSON.parse(localStorage.getItem(localWordsKey) || "[]");
  }
}

// 10. Save translation history
export async function saveTranslation(username: string, originalText: string, translatedText: string, sourceLang: string, targetLang: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const translation: TranslationHistory = {
    username: cleanUsername,
    timestamp: new Date().toISOString(),
    originalText,
    translatedText,
    sourceLang,
    targetLang
  };

  try {
    const transColRef = collection(db, "translations");
    await addDoc(transColRef, translation);
  } catch (err) {
    console.warn("Firestore error in saveTranslation, falling back to local storage", err);
    const localTransKey = `lingo_trans_${cleanUsername}`;
    const currentTrans = JSON.parse(localStorage.getItem(localTransKey) || "[]");
    currentTrans.push({ ...translation, id: Math.random().toString() });
    localStorage.setItem(localTransKey, JSON.stringify(currentTrans));
  }
}

// 11. Fetch translation history
export async function getTranslationHistory(username: string): Promise<TranslationHistory[]> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    const transColRef = collection(db, "translations");
    const q = query(
      transColRef,
      where("username", "==", cleanUsername),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const results: TranslationHistory[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as TranslationHistory);
    });
    return results;
  } catch (err) {
    console.warn("Firestore error in getTranslationHistory, fetching from local storage", err);
    const localTransKey = `lingo_trans_${cleanUsername}`;
    return JSON.parse(localStorage.getItem(localTransKey) || "[]");
  }
}
