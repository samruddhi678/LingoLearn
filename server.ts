import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini AI
let ai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Spawning and monitoring the LingoLearn MCP Server
function startMcpServer() {
  console.log("[Express] Spawning MCP Server background process...");
  const mcpProcess = spawn("npx", ["tsx", "mcp-server/server.ts"], {
    stdio: "inherit",
    env: { ...process.env }
  });

  mcpProcess.on("error", (err) => {
    console.error("[Express] Failed to start MCP Server process:", err);
  });

  mcpProcess.on("exit", (code) => {
    console.log(`[Express] MCP Server process exited with code ${code}. Restarting in 5s...`);
    setTimeout(startMcpServer, 5000);
  });
}

// Start the MCP Server
startMcpServer();

// MCP Tool Client Call Helper
async function callMcpTool(toolName: string, args: any): Promise<any> {
  try {
    const response = await fetch("http://localhost:3001/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: toolName, arguments: args })
    });
    if (!response.ok) {
      throw new Error(`MCP tool execution returned status ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    console.error(`[Express] Error calling MCP tool "${toolName}":`, err.message);
    throw err;
  }
}

// 1. MCP Tools Declarations for Gemini Function Calling
const mcpToolsDeclarations = [
  {
    name: "saveVocabulary",
    description: "Saves a vocabulary word or phrase with translations and explanations to the user's personal dictionary in Firestore.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user for security isolation." },
        id: { type: "STRING", description: "A unique identifier for the word (e.g. word text lowercase)." },
        word: { type: "STRING", description: "The vocabulary word or phrase in target language." },
        translation: { type: "STRING", description: "The translated text in user's source language." },
        pronunciation: { type: "STRING", description: "Phonetic pronunciation guide of target word." },
        partOfSpeech: { type: "STRING", description: "Grammatical class (e.g., noun, verb, phrase)." },
        explanation: { type: "STRING", description: "Tutor-style usage or grammatical breakdown." },
        exampleOriginal: { type: "STRING", description: "Target language example sentence." },
        exampleTranslation: { type: "STRING", description: "Translation of the example sentence." }
      },
      required: ["username", "id", "word", "translation", "partOfSpeech"]
    }
  },
  {
    name: "getVocabulary",
    description: "Retrieves all saved vocabulary words for a given user.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "markVocabularyMastered",
    description: "Toggles the mastery status of a saved vocabulary word (from 'learning' to 'mastered').",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." },
        wordId: { type: "STRING", description: "The ID of the vocabulary item." }
      },
      required: ["username", "wordId"]
    }
  },
  {
    name: "getUserProgress",
    description: "Retrieves the user's core learning statistics: XP, current level, daily streak count, and joined date.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "updateXP",
    description: "Increments user experience points (XP) in Firestore and recalculates/updates learner rank dynamically.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." },
        xpAmount: { type: "NUMBER", description: "The amount of XP to add (must be a positive number)." }
      },
      required: ["username", "xpAmount"]
    }
  },
  {
    name: "updateDailyStreak",
    description: "Inspects and processes consecutive daily active learning streaks for the user, resetting or incrementing safely.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "getQuizHistory",
    description: "Retrieves historic quiz performance logs for a given user.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "getAnalytics",
    description: "Computes aggregated learner intelligence, including quiz counts, average scores, and vocab stats.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "getPerformanceGraphData",
    description: "Retrieves timeline data points optimized for trend visualization graphs.",
    parameters: {
      type: "OBJECT",
      properties: {
        username: { type: "STRING", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  }
];

// Helper to clean up and parse JSON that might be wrapped in Markdown code blocks
function parseMaybeJSON(text: string): any {
  let cleaned = text.trim();
  
  // Strip markdown code block wrapper if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Try to find the first `{` and last `}`
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonCandidate = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (innerErr) {
        throw new Error(`Failed to parse JSON from response. Raw text: ${text}`);
      }
    }
    throw new Error(`Failed to parse JSON from response. Raw text: ${text}`);
  }
}

// Unified Gemini Tool Call Loop Execution Helper
async function generateContentWithMCP(
  contents: any[],
  systemInstruction: string,
  username?: string,
  responseMimeType?: string
): Promise<string> {
  const genAI = getGenAI();
  const currentContents = [...contents];

  let turns = 0;
  const maxTurns = 5;

  while (turns < maxTurns) {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    // Include tool declarations for Gemini to invoke
    config.tools = [{ functionDeclarations: mcpToolsDeclarations }];

    // Note: If config.tools is defined, Gemini API 2.5 does not support setting responseMimeType: "application/json".
    // We omit it here since tools are always present, and we'll manually parse any JSON structure from the response.
    if (responseMimeType && (!config.tools || config.tools.length === 0)) {
      config.responseMimeType = responseMimeType;
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: currentContents,
      config
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return response.text || "";
    }

    // Append model response containing the function calls
    currentContents.push({
      role: "model",
      parts: functionCalls.map(fc => ({ functionCall: fc }))
    });

    const toolResponseParts = [];
    for (const call of functionCalls) {
      const { name, args } = call;
      
      // Enforce security check: Overwrite any user argument with authenticated username
      if (username && args && "username" in args) {
        args.username = username;
      }

      try {
        const result = await callMcpTool(name, args);
        toolResponseParts.push({
          functionResponse: {
            name,
            response: { result }
          }
        });
      } catch (err: any) {
        toolResponseParts.push({
          functionResponse: {
            name,
            response: { error: err.message || "Failed to execute tool" }
          }
        });
      }
    }

    // Append tool responses so Gemini can continue its turn
    currentContents.push({
      role: "user",
      parts: toolResponseParts
    });

    turns++;
  }

  throw new Error("Exceeded maximum tool calling turns.");
}

// API Routes

// 1. Translation Route via MCP Translator Tool
app.post("/api/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: "Missing required fields: text, sourceLang, targetLang" });
    }

    const result = await callMcpTool("translateText", { text, sourceLang, targetLang });
    res.json(result);
  } catch (error: any) {
    console.error("Translation API Error:", error);
    res.status(500).json({ error: error.message || "Failed to perform translation" });
  }
});

// 2. Generate Interactive Quiz Route via MCP Quiz Tool
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { targetLang, sourceLang, level, category } = req.body;
    if (!targetLang || !sourceLang) {
      return res.status(400).json({ error: "Missing required fields: targetLang, sourceLang" });
    }

    const result = await callMcpTool("generateQuiz", { targetLang, sourceLang, level, category });
    res.json(result);
  } catch (error: any) {
    console.error("Generate Quiz API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// 3. Generate Word of the Day Route (Direct Gemini call with clean format)
app.post("/api/word-of-the-day", async (req, res) => {
  try {
    const { targetLang, sourceLang } = req.body;
    if (!targetLang || !sourceLang) {
      return res.status(400).json({ error: "Missing required fields: targetLang, sourceLang" });
    }

    const genAI = getGenAI();
    const prompt = `Provide a beautiful 'Word of the Day' in ${targetLang} designed to teach a speaker of ${sourceLang}.
Select an interesting, highly practical vocabulary word or common phrase.
Include its translation, phonetic pronunciation guide, part of speech, meaning, and an example sentence in both languages.

You MUST return a JSON object that strictly adheres to this schema:
{
  "word": "the word/phrase in the target language",
  "translation": "the translation of the word/phrase in the source language",
  "pronunciation": "phonetic guide on how to pronounce the target word",
  "partOfSpeech": "noun / verb / adjective / phrase etc.",
  "meaning": "clear and simple explanation of the word's meaning and context",
  "exampleOriginal": "an elegant example sentence in the target language using this word",
  "exampleTranslation": "translation of that example sentence into the source language"
}

Make sure the word selection is highly relevant and delightful for a student.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Word of the Day API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate Word of the Day" });
  }
});

// 4. Chat Assistant / Language Tutor Route with MCP Tool Integration
app.post("/api/chat-tutor", async (req, res) => {
  try {
    const { message, history, targetLang, sourceLang, username } = req.body;
    if (!message || !targetLang || !sourceLang) {
      return res.status(400).json({ error: "Missing required fields: message, targetLang, sourceLang" });
    }

    const activeUsername = username || "guest_learner";

    const systemInstruction = `You are a friendly, encouraging, and highly intelligent language tutor named "LingoTutor". 
Your goal is to help the user learn ${targetLang} (they speak ${sourceLang}).
Always speak with professional composure, encourage them, and explain concepts clearly.
When explaining, always provide the target language text, its phonetic pronunciation, and the English/source language translation.
Keep answers concise, helpful, and beautifully formatted (use markdown tags, bold keywords).
Provide occasional simple practices or ask brief questions to keep them engaged.

You have access to MCP tools to inspect or save user vocab, check streak, get quiz logs, and add XP. If the user asks you to save a word, check their progress, streak, or quiz stats, use your tools!`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add user message
    chatHistory.push({
      role: "user",
      parts: [{ text: `[System Instruction: targetLang is ${targetLang}, sourceLang is ${sourceLang}]\n\nUser query: ${message}` }]
    });

    const reply = await generateContentWithMCP(chatHistory, systemInstruction, activeUsername);
    res.json({ reply });
  } catch (error: any) {
    console.error("Chat Tutor API Error:", error);
    res.status(500).json({ error: error.message || "Failed to chat with tutor" });
  }
});

// 5. AI Chat Practice Route (Scenario-based practice with real-time feedback & MCP Tools)
app.post("/api/chat-practice", async (req, res) => {
  try {
    const { message, history, targetLang, sourceLang, scenario, difficulty, username } = req.body;
    if (!message || !targetLang || !sourceLang) {
      return res.status(400).json({ error: "Missing required fields: message, targetLang, sourceLang" });
    }

    const activeScenario = scenario || "Casual Conversation";
    const skillLevel = difficulty || "beginner";
    const activeUsername = username || "guest_learner";

    const systemInstruction = `You are "LingoPractice Partner", an empathetic language tutor facilitating immersive dialogue in ${targetLang} for native speakers of ${sourceLang}.
You are currently roleplaying/simulating the following scenario: "${activeScenario}".
The user's skill level is: "${skillLevel}".

Your tasks for this turn:
1. Parse the user's message: "${message}".
2. Offer constructive, extremely helpful feedback in the user's native language (${sourceLang}) on their grammar, vocabulary, or spelling in their input. If there are mistakes, explain them. E.g. "Instead of 'X', it is more natural/correct to say 'Y' because...". If their message is perfect, set hasErrors to false, but you can still offer a small tip or praise like "Excellent phrasing!".
3. Formulate your conversational response in ${targetLang}.
   - If the level is Beginner: Keep sentences short, simple, use basic vocabulary, and provide a clear phonetic guide and translation.
   - If the level is Intermediate: Use slightly more complex sentences, natural idioms, and helpful explanations of key words.
   - If the level is Advanced: Use natural native-speed phrasing, advanced vocabulary, idiomatic expressions, and challenge them to explain their thoughts.
4. Provide a phonetic pronunciation guide for your reply.
5. Translate your response into ${sourceLang}.
6. Suggest 2 realistic, natural candidate replies that the user could say next in ${targetLang} to keep the conversation flowing. For each suggestion, provide its translation in ${sourceLang}.

You have access to MCP tools to inspect progress, fetch analytics, log xp, and save/retrieve vocabulary words. Use them if relevant or requested.

You MUST return a JSON object that strictly adheres to this schema at the end:
{
  "reply": "Conversational reply in ${targetLang} continuing the roleplay scenario",
  "pronunciation": "Phonetic pronunciation guide of your reply",
  "translation": "Translation of your reply into ${sourceLang}",
  "feedback": {
    "hasErrors": true or false,
    "explanation": "Tutor feedback about the user's input, explaining grammatical errors, spelling, or a tip for more natural wording. Write this in ${sourceLang}",
    "corrections": "The grammatically correct/more natural version of what the user wrote (in ${targetLang}), or null if perfect",
    "tips": "A quick general vocabulary/grammar tip related to what the user said (in ${sourceLang})"
  },
  "suggestedReplies": [
    {
      "text": "First option they could say in ${targetLang}",
      "translation": "Translation of the first option in ${sourceLang}"
    },
    {
      "text": "Second option they could say in ${targetLang}",
      "translation": "Translation of the second option in ${sourceLang}"
    }
  ]
}

Ensure the response is grammatically impeccable, highly context-aware, extremely supportive of the learner, and returned as valid RAW JSON matching the specified format.`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add user message
    chatHistory.push({
      role: "user",
      parts: [{ text: `[Context: Scenario is "${activeScenario}", Skill Level is "${skillLevel}", Target Lang is ${targetLang}, Source Lang is ${sourceLang}]\n\nUser message: ${message}` }]
    });

    const responseText = await generateContentWithMCP(chatHistory, systemInstruction, activeUsername, "application/json");
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsedData = parseMaybeJSON(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Chat Practice API Error:", error);
    res.status(500).json({ error: error.message || "Failed to chat practice" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
