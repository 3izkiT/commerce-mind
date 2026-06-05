import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";

const MODEL = "gemini-1.5-pro-001";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export interface ScriptResult {
  hook: string;
  body_content: string;
}

export async function generateScript(
  productDetails: string,
  communicationGoal: string,
  tone: string
): Promise<ScriptResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(
    buildUserPrompt(productDetails, communicationGoal, tone)
  );

  const text = result.response.text();
  const parsed = JSON.parse(text) as ScriptResult;

  if (!parsed.hook || !parsed.body_content) {
    throw new Error("Invalid script format from Gemini");
  }

  return parsed;
}
