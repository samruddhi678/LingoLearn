import { saveQuizResult, getQuizHistory as getQuizHistoryHelper } from "./firebase.js";
import { GoogleGenAI } from "@google/genai";

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required but missing.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateQuiz(args: {
  targetLang: string;
  sourceLang: string;
  level?: string;
  category?: string;
}) {
  const { targetLang, sourceLang, level, category } = args;
  if (!targetLang || !sourceLang) {
    throw new Error("Missing required parameters: targetLang and sourceLang");
  }

  const userLevel = level || "beginner";
  const userCategory = category || "general conversation";

  const ai = getGenAI();
  const prompt = `You are an expert language teacher specializing in teaching ${targetLang} to ${sourceLang} speakers.
Generate an interactive vocabulary, phrase, or grammar quiz containing exactly 5 multiple-choice questions.
Target Language to Learn: ${targetLang}
User's Native/Source Language: ${sourceLang}
Level: ${userLevel}
Category/Topic: ${userCategory}

For each question:
- The questionText should challenge the user's comprehension of ${targetLang} vocabulary, grammar, or phrases. It can ask to translate from ${sourceLang} to ${targetLang}, or vice versa, or fill in the blank.
- Provide exactly 4 diverse, realistic options (Option A, Option B, Option C, Option D).
- Specify the correctAnswer which MUST EXACTLY match one of the options.
- Provide a brief, supportive explanation of why the answer is correct and what the other options mean to help them learn.
- Allocate an xpReward between 10 and 15 XP depending on difficulty.

You MUST return a JSON object that strictly adheres to this schema:
{
  "questions": [
    {
      "questionText": "the question text, e.g. 'How do you write \"thank you\" in Hindi?' or 'What does \"नमस्कार\" mean in English?'",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctAnswer": "the correct option exactly as written in the options array",
      "explanation": "helpful tutor explanation of the correct choice and other words",
      "xpReward": 10
    }
  ]
}

Ensure the questions are high-quality, highly engaging, and grammatically perfect in both languages.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response received from Gemini API");
  }

  return JSON.parse(responseText);
}

export async function saveQuizScore(args: {
  username: string;
  score: number;
  totalQuestions: number;
  language: string;
  category: string;
  xpEarned: number;
}) {
  const { username, score, totalQuestions, language, category, xpEarned } = args;
  if (!username) throw new Error("Missing username");
  if (typeof score !== "number") throw new Error("Missing score");
  if (typeof totalQuestions !== "number") throw new Error("Missing totalQuestions");

  await saveQuizResult(username, score, totalQuestions, language, category, xpEarned);
  return { success: true, message: `Quiz result saved successfully for ${username}.` };
}

export async function getQuizHistory(args: { username: string }) {
  const { username } = args;
  if (!username) throw new Error("Missing username");

  const history = await getQuizHistoryHelper(username);
  return { username, history };
}
