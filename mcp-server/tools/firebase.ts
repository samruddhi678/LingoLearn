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
  deleteDoc 
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
export const db = getFirestore(app, databaseId);

// Types
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
  timestamp: string;
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
  timestamp: string;
  status: "learning" | "mastered";
}

// Firebase Helpers matching exact client signature but safe for node execution

export async function getUserProfile(username: string): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) throw new Error("Username cannot be empty");

  const userDocRef = doc(db, "users", cleanUsername);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
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
    await setDoc(userDocRef, newProfile);
    return newProfile;
  }
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
  const cleanUsername = profile.username.trim().toLowerCase();
  const userDocRef = doc(db, "users", cleanUsername);
  await setDoc(userDocRef, profile, { merge: true });
}

export async function updateDailyStreak(username: string): Promise<UserProfile> {
  const profile = await getUserProfile(username);
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActive = profile.lastActiveDate;

  if (lastActive === todayStr) {
    return profile;
  }

  const today = new Date(todayStr);
  const lastActiveDate = new Date(lastActive);
  const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let updatedStreak = profile.streakCount;
  if (diffDays === 1) {
    updatedStreak += 1;
  } else if (diffDays > 1) {
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

  const quizColRef = collection(db, "quizzes");
  await addDoc(quizColRef, quizResult);

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

export async function getQuizHistory(username: string): Promise<QuizHistory[]> {
  const cleanUsername = username.trim().toLowerCase();
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
}

export async function saveWord(username: string, wordData: Omit<SavedWord, "username" | "timestamp" | "status">): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const savedWord: SavedWord = {
    ...wordData,
    username: cleanUsername,
    timestamp: new Date().toISOString(),
    status: "learning"
  };

  const wordDocRef = doc(db, "saved_words", `${cleanUsername}_${wordData.id}`);
  await setDoc(wordDocRef, savedWord);
}

export async function toggleWordMastery(username: string, wordId: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const wordDocRef = doc(db, "saved_words", `${cleanUsername}_${wordId}`);
  const docSnap = await getDoc(wordDocRef);
  if (docSnap.exists()) {
    const word = docSnap.data() as SavedWord;
    const newStatus = word.status === "learning" ? "mastered" : "learning";
    await updateDoc(wordDocRef, { status: newStatus });
  }
}

export async function getSavedWords(username: string): Promise<SavedWord[]> {
  const cleanUsername = username.trim().toLowerCase();
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
}
