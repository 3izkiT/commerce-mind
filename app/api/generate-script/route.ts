import { NextResponse } from "next/server";
import { generateScript } from "@/lib/gemini";

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

    if (productDetails.length < 10) {
      return NextResponse.json(
        { success: false, error: "productDetails must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const data = await generateScript(productDetails, communicationGoal, tone);

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
