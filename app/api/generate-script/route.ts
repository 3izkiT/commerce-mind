import { NextResponse } from "next/server";
import { generateScript } from "@/lib/gemini";
import { isValidProductInput } from "@/lib/product-input";
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
      return NextResponse.json(
        { success: false, error: SCRAPE_ERROR_TH },
        { status: 422 }
      );
    }

    const data = await generateScript(
      resolved.text,
      communicationGoal,
      tone
    );

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
