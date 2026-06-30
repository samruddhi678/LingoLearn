import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import dotenv from "dotenv";

// Import tool handlers
import { saveVocabulary, getVocabulary, markVocabularyMastered } from "./tools/vocabulary.js";
import { getUserProgress, updateXP, updateDailyStreak } from "./tools/progress.js";
import { generateQuiz, saveQuizScore, getQuizHistory } from "./tools/quiz.js";
import { getAnalytics, getPerformanceGraphData } from "./tools/analytics.js";
import { translateText } from "./tools/translator.js";

// Load environment variables
dotenv.config();

// Critical: In standard MCP stdio, stdout is reserved for JSON-RPC. Redirect standard logs to stderr.
const mcpLog = (message: string, ...args: any[]) => {
  console.error(`[MCP-LOG] ${message}`, ...args);
};

mcpLog("Initializing LingoLearn MCP Server...");

// Static list of tools for shared usage (official MCP list handler & HTTP GET gateway)
const mcpToolsList = [
  // Vocabulary Tools
  {
    name: "saveVocabulary",
    description: "Saves a vocabulary word or phrase with translations and explanations to the user's personal dictionary in Firestore.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user for security isolation." },
        id: { type: "string", description: "A unique identifier for the word (e.g. word text lowercase)." },
        word: { type: "string", description: "The vocabulary word or phrase in target language." },
        translation: { type: "string", description: "The translated text in user's source language." },
        pronunciation: { type: "string", description: "Phonetic pronunciation guide of target word." },
        partOfSpeech: { type: "string", description: "Grammatical class (e.g., noun, verb, phrase)." },
        explanation: { type: "string", description: "Tutor-style usage or grammatical breakdown." },
        exampleOriginal: { type: "string", description: "Target language example sentence." },
        exampleTranslation: { type: "string", description: "Translation of the example sentence." }
      },
      required: ["username", "id", "word", "translation", "partOfSpeech"]
    }
  },
  {
    name: "getVocabulary",
    description: "Retrieves all saved vocabulary words for a given user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "markVocabularyMastered",
    description: "Toggles the mastery status of a saved vocabulary word (from 'learning' to 'mastered').",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." },
        wordId: { type: "string", description: "The ID of the vocabulary item." }
      },
      required: ["username", "wordId"]
    }
  },

  // Learning Progress Tools
  {
    name: "getUserProgress",
    description: "Retrieves the user's core learning statistics: XP, current level, daily streak count, and joined date.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "updateXP",
    description: "Increments user experience points (XP) in Firestore and recalculates/updates learner rank dynamically.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." },
        xpAmount: { type: "number", description: "The amount of XP to add (must be a positive number)." }
      },
      required: ["username", "xpAmount"]
    }
  },
  {
    name: "updateDailyStreak",
    description: "Inspects and processes consecutive daily active learning streaks for the user, resetting or incrementing safely.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },

  // Quiz Tools
  {
    name: "generateQuiz",
    description: "Asks Gemini 2.5 Flash to dynamically create a tailored, interactive 5-question multiple-choice quiz.",
    inputSchema: {
      type: "object",
      properties: {
        targetLang: { type: "string", description: "Language to test the user in (e.g. Marathi, Spanish)." },
        sourceLang: { type: "string", description: "User's instruction language (e.g. English)." },
        level: { type: "string", description: "Quiz difficulty: 'beginner', 'intermediate', 'advanced'.", enum: ["beginner", "intermediate", "advanced"] },
        category: { type: "string", description: "Topic/focus, e.g. 'family', 'travel', 'shopping'." }
      },
      required: ["targetLang", "sourceLang"]
    }
  },
  {
    name: "saveQuizScore",
    description: "Stores completed interactive quiz results, registers XP rewards, and syncs learner milestones.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." },
        score: { type: "number", description: "Number of correct choices." },
        totalQuestions: { type: "number", description: "Total questions in the quiz." },
        language: { type: "string", description: "Target language tested." },
        category: { type: "string", description: "Category/topic of the quiz." },
        xpEarned: { type: "number", description: "XP earned for active completion." }
      },
      required: ["username", "score", "totalQuestions", "language", "category", "xpEarned"]
    }
  },
  {
    name: "getQuizHistory",
    description: "Retrieves historic quiz performance logs for a given user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },

  // Analytics Tools
  {
    name: "getAnalytics",
    description: "Computes aggregated learner intelligence, including quiz counts, average scores, and vocab stats.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },
  {
    name: "getPerformanceGraphData",
    description: "Retrieves timeline data points optimized for trend visualization graphs.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The username/ID of the user." }
      },
      required: ["username"]
    }
  },

  // Translation Tool
  {
    name: "translateText",
    description: "Performs highly detailed pedagogical translations with phonetic guides, explanations, and context examples.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to translate." },
        sourceLang: { type: "string", description: "Original language." },
        targetLang: { type: "string", description: "Target language." }
      },
      required: ["text", "sourceLang", "targetLang"]
    }
  }
];

// 1. Instantiate MCP Server with capabilities
const server = new Server(
  {
    name: "lingolearn-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. Register tools list schema
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: mcpToolsList
  };
});

// 3. Helper to validate and route tool calls
async function runTool(name: string, args: any): Promise<any> {
  mcpLog(`Running tool call: "${name}"`, args);

  // Inputs Validation & User Isolation Check
  if ("username" in args && (!args.username || args.username.trim() === "")) {
    throw new Error("Invalid username. High-security environments require strict user isolation.");
  }

  switch (name) {
    // Vocabulary Tools
    case "saveVocabulary":
      return await saveVocabulary(args);
    case "getVocabulary":
      return await getVocabulary(args);
    case "markVocabularyMastered":
      return await markVocabularyMastered(args);

    // Learning Progress Tools
    case "getUserProgress":
      return await getUserProgress(args);
    case "updateXP":
      return await updateXP(args);
    case "updateDailyStreak":
      return await updateDailyStreak(args);

    // Quiz Tools
    case "generateQuiz":
      return await generateQuiz(args);
    case "saveQuizScore":
      return await saveQuizScore(args);
    case "getQuizHistory":
      return await getQuizHistory(args);

    // Analytics Tools
    case "getAnalytics":
      return await getAnalytics(args);
    case "getPerformanceGraphData":
      return await getPerformanceGraphData(args);

    // Translation Tool
    case "translateText":
      return await translateText(args);

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
  }
}

// 4. Register tool execution schema handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const result = await runTool(name, args || {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (err: any) {
    mcpLog(`Error in tool execution: ${err.message}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: err.message || "Failed to execute tool" })
        }
      ],
      isError: true
    };
  }
});

// 5. Connect Stdio transport (Standard MCP)
const startStdioTransport = async () => {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    mcpLog("MCP server listening on stdio.");
  } catch (error) {
    mcpLog("Failed to start stdio transport", error);
  }
};

startStdioTransport();

// 6. Dual HTTP REST JSON-RPC Server
// Exposes the exact same tools over a local HTTP JSON-RPC endpoint on port 3001.
// This allows the Express app to communicate via local HTTP seamlessly without managing raw stdio streams.
const app = express();
app.use(express.json());

app.post("/api/mcp", async (req, res) => {
  const { tool, arguments: args } = req.body;
  if (!tool) {
    return res.status(400).json({ error: "Missing required parameter: tool" });
  }

  try {
    const result = await runTool(tool, args || {});
    res.json(result);
  } catch (err: any) {
    mcpLog(`HTTP MCP Error: ${err.message}`);
    res.status(500).json({ error: err.message || "Execution error" });
  }
});

app.get("/api/mcp/tools", async (req, res) => {
  try {
    res.json({ tools: mcpToolsList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const HTTP_PORT = 3001;
app.listen(HTTP_PORT, "0.0.0.0", () => {
  mcpLog(`HTTP MCP dual gateway running on http://localhost:${HTTP_PORT}`);
});
