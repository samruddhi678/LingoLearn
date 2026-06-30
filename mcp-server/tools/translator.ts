import { GoogleGenAI } from "@google/genai";

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required but missing.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function translateText(args: {
  text: string;
  sourceLang: string;
  targetLang: string;
}) {
  const { text, sourceLang, targetLang } = args;
  if (!text || !sourceLang || !targetLang) {
    throw new Error("Missing required parameters: text, sourceLang, targetLang");
  }

  const ai = getGenAI();
  const prompt = `You are a professional language tutor and translator. 
Translate the following text from ${sourceLang} to ${targetLang}. 
Provide a detailed response optimized for language learning.
Include:
- The translated text
- A phonetic pronunciation guide (especially if target language uses non-Latin scripts like Devanagari/Hindi/Marathi/Telugu, but also helpful for English/others)
- Parts of speech (noun, verb, adjective, phrase, etc.)
- A brief grammatical or vocabulary explanation of the words or structures used
- 2 example sentences using the translated word/phrase in the target language, along with their translation back into ${sourceLang}.

You MUST return a JSON object that strictly adheres to this schema:
{
  "translatedText": "the translated text in the target language",
  "pronunciation": "phonetic guide / pronunciation of the translated text",
  "partsOfSpeech": "part of speech, e.g., noun, verb, phrase",
  "explanation": "brief grammatical or vocabulary explanation of key words or structures",
  "examples": [
    {
      "original": "an example sentence using the translated word/phrase in the target language",
      "translation": "translation of that example sentence back into the source language"
    }
  ]
}

Text to translate: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Empty response received from Gemini API");
  }

  return JSON.parse(responseText);
}
