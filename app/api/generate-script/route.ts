import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isProductUrl, isValidProductInput } from "@/lib/product-input";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.productDetails !== "string") {
      return NextResponse.json(
        { success: false, error: "productDetails is required" },
        { status: 400 }
      );
    }

    const productDetails = body.productDetails.trim();
    const communicationGoal = body.communicationGoal ?? "conversion";
    const tone = body.tone ?? "urgent";

    if (isProductUrl(productDetails)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาพิมพ์ชื่อสินค้าและจุดเด่นแทนการวางลิงก์ เช่น: พัดลมพกพามินิมอล, ลมแรง 3 ระดับ, แบต 10 ชม.",
        },
        { status: 400 }
      );
    }

    if (!isValidProductInput(productDetails)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาพิมพ์ชื่อสินค้าและจุดเด่นอย่างน้อย 10 ตัวอักษร (ไม่รับลิงก์)",
        },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const DEFAULT_MODEL_PRIORITY = [
      process.env.GEMINI_PREMIUM_MODEL || process.env.GEMINI_MODEL_NAME || "gemini-pro-latest",
      process.env.GEMINI_FREE_MODEL || "gemini-flash-latest",
    ];

    const MODEL_PRIORITY = process.env.GEMINI_MODEL_PRIORITY
      ? process.env.GEMINI_MODEL_PRIORITY.split(",").map((name) => name.trim()).filter(Boolean)
      : DEFAULT_MODEL_PRIORITY;

    const safeModelPriority = Array.from(new Set(MODEL_PRIORITY));

    const systemInstruction = `
  คุณคือผู้เชี่ยวชาญด้านการเขียนสคริปต์ปิดการขายและนักจิตวิทยาการพาณิชย์ดิจิทัลในไทย
  หน้าที่ของคุณคือ นำข้อความ "รายละเอียดสินค้าดิบ" ที่ลูกค้าพิมพ์ป้อนเข้ามา นำมาขยี้จุดขายทำเป็นสคริปต์พูด 1 นาที
  
  [กฎเหล็กในการประมวลผล]
  1. ห้ามมโนหรือเดาสินค้าไปเป็นประเภทอื่นเด็ดขาด ให้ยึดตามตัวหนังสือชื่อสินค้าที่ลูกค้าพิมพ์มาเท่านั้น
  2. สกัดเอา "จุดเด่นสินค้า" และ "ปัญหาของกลุ่มเป้าหมาย" มาเขียนเป็นประโยคเปิดหัว (Hook) ให้คมกริบและสั้นกระชับ
  3. body_content ต้องมี [วงเล็บกำกับท่าทาง/การแสดง] เช่น [หยิบสินค้าขึ้นโชว์ใกล้กล้อง] [ชี้ที่จุดเด่น] [ยิ้มมองกล้อง]
  4. ใช้ภาษาพูดแม่ค้าตลาดนัด ห้ามภาษาเขียน ห้ามคำเกริ่นนำ เช่น "สวัสดีค่ะวันนี้มาแนะนำ"
  5. ปลายทางต้องส่งกลับมาเป็นโครงสร้าง JSON Object เท่านั้น ห้ามมีคำเกริ่น ห้ามมีข้อความขยะนอกปีกกา
  
  โครงสร้างบังคับ: { "hook": "ข้อความ", "body_content": "ข้อความ", "caption_and_hashtags": "ข้อความ" }
`;

    const userPrompt = `สร้างสคริปต์จากรายละเอียดสินค้าดิบนี้:

${productDetails}

เป้าหมายการสื่อสาร: ${communicationGoal}
โทนเสียง: ${tone}

ตอบเป็น JSON เท่านั้น: { "hook": "...", "body_content": "...", "caption_and_hashtags": "..." }`;

    let responseText = "";
    let usedModel = "";
    const attemptedModels: string[] = [];
    let lastError: unknown = null;

    async function generateWithRetry(modelName: string, promptText: string) {
      const model = genAI.getGenerativeModel({ model: modelName });
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const result = await model.generateContent(promptText);
          return result.response.text();
        } catch (err) {
          lastError = err;
          if (attempt < maxAttempts) {
            const backoffMs = attempt * 400;
            console.warn(
              `Model ${modelName} attempt ${attempt} failed, retrying in ${backoffMs}ms...`,
              (err as any)?.message || err
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      }
      throw lastError;
    }

    for (const modelName of safeModelPriority) {
      attemptedModels.push(modelName);
      try {
        console.log(`Trying model: ${modelName}`);
        responseText = await generateWithRetry(modelName, systemInstruction + "\n\n" + userPrompt);
        usedModel = modelName;
        break;
      } catch (modelErr) {
        console.warn(`Model ${modelName} failed, trying next model if available...`, (modelErr as any)?.message || modelErr);
      }
    }

    if (!responseText) {
      throw lastError ?? new Error("Failed to generate script from any configured Gemini model");
    }

    // Clean markdown code blocks if AI accidentally includes them
    const cleanJsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanJsonString);

    if (!data.hook || !data.body_content) {
      return NextResponse.json(
        { success: false, error: "Invalid script format from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      usedModel,
      attemptedModels,
    });
  } catch (error) {
    console.error("Generate script error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate script",
      },
      { status: 500 }
    );
  }
}
