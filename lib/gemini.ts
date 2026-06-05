import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";

const MODEL = "gemini-1.5-pro";

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
  tone: string,
  sourceUrl?: string
): Promise<ScriptResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
  });

  const promptInput = sourceUrl
    ? `${productDetails}\n(ข้อมูลสินค้าดึงมาจากลิงก์: ${sourceUrl})`
    : productDetails;

  // Combine system prompt and user prompt into a single text
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(promptInput, communicationGoal, tone)}`;

  const result = await model.generateContent(fullPrompt);

  const text = result.response.text();
  const parsed = JSON.parse(text) as ScriptResult;

  if (!parsed.hook || !parsed.body_content) {
    throw new Error("Invalid script format from Gemini");
  }

  return parsed;
}
