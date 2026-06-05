import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isProductUrl, isValidProductInput } from "@/lib/product-input";
import { resolveProductInput } from "@/lib/product-resolver";

const SCRAPE_ERROR_TH =
  "ไม่สามารถดึงข้อมูลจากลิงก์ได้ กรุณาพิมพ์รายละเอียดสินค้าแทน";

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

    if (!isValidProductInput(productDetails)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาวางลิงก์สินค้าที่ถูกต้อง หรือพิมพ์รายละเอียดอย่างน้อย 10 ตัวอักษร",
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

    let resolved;
    try {
      resolved = await resolveProductInput(productDetails);
    } catch (error) {
      console.error("Product resolve error:", error);
      if (isProductUrl(productDetails)) {
        resolved = { text: productDetails, source: "url", originalUrl: productDetails };
      } else {
        return NextResponse.json(
          { success: false, error: SCRAPE_ERROR_TH },
          { status: 422 }
        );
      }
    }

    // Initialize Gemini model using a shared alias or environment-configured model name
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const activeModel = process.env.GEMINI_MODEL_NAME || "gemini-flash-latest";
    const model = genAI.getGenerativeModel({ model: activeModel });

    const systemInstruction = `
คุณคือผู้เชี่ยวชาญสคริปต์วิดีโอสั้นขายของสำหรับแม่ค้า/ครีเอเตอร์ไทยบน TikTok, Reels, Shorts

กฎสำคัญ:
1. ตอบเป็น JSON เท่านั้น ไม่มี markdown ไม่มีคำอธิบายเพิ่ม
2. รูปแบบ: {"hook": "...", "body_content": "..."}
3. ใช้ภาษาพูดแม่ค้าตลาดนัด ห้ามภาษาเขียน ห้ามคำเกริ่นนำ เช่น "สวัสดีค่ะวันนี้มาแนะนำ"
4. hook: ประโยคเปิดที่ดึงดูดความสนใจใน 3 วินาทีแรก สั้น กระชับ ตรงประเด็น
5. body_content: เนื้อหาหลักสคริปต์ ต้องมี [วงเล็บกำกับท่าทาง/การแสดง] เช่น [หยิบสินค้าขึ้นโชว์ใกล้กล้อง] [ชี้ที่จุดเด่น] [ยิ้มมองกล้อง]
6. โทนเสียง 3 แบบ:
   - สายตะโกนเร่งรีบ: ใช้คำเร่งด่วน สร้าง FOMO กระตุ้นให้รีบซื้อ
   - สายป้ายยาเนียนๆ: แนะนำเหมือนเพื่อน ไม่ขายตรง เน้นประสบการณ์จริง
   - สายฮาตลกร้าย: ใส่อารมณ์ขัน มุกตลก แต่ยังขายของได้
7. เน้นประโยชน์สินค้า จุดเด่น ราคา โปรโม ตามข้อมูลที่ได้รับ
8. ความยาว hook ไม่เกิน 2 ประโยค, body_content ประมาณ 150-300 คำ
`;

    const userPrompt = `สร้างสคริปต์วิดีโอสั้นขายของจากข้อมูลนี้:

รายละเอียดสินค้า:
${resolved.text}

เป้าหมายการสื่อสาร: ${communicationGoal}

โทนเสียง: ${tone}

ตอบเป็น JSON เท่านั้น: {"hook": "...", "body_content": "..."}`;

    const result = await model.generateContent(
      systemInstruction + "\n\n" + userPrompt
    );

    const responseText = result.response.text();

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

    return NextResponse.json({ success: true, data });
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
