import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidProductInput } from "@/lib/product-input";
import { getClientIp, getRateLimiter, isRateLimitConfigured } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next();
  }

  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object" || !("productDetails" in body)) {
    return NextResponse.json(
      { success: false, error: "Invalid payload: productDetails is required" },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.productDetails !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid payload: productDetails must be a string" },
      { status: 400 }
    );
  }

  if (!isValidProductInput(payload.productDetails)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "กรุณาพิมพ์ชื่อสินค้าและจุดเด่นอย่างน้อย 10 ตัวอักษร (ไม่รับลิงก์)",
      },
      { status: 400 }
    );
  }

  if (!isRateLimitConfigured()) {
    return NextResponse.next();
  }

  try {
    const ratelimit = getRateLimiter();
    if (!ratelimit) {
      return NextResponse.next();
    }

    const ip = getClientIp(request);
    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      const resetDate = new Date(reset);
      return NextResponse.json(
        {
          success: false,
          error: "คุณใช้สิทธิ์เจนฟรีครบแล้ว กรุณาลองใหม่ใน 24 ชั่วโมง",
          resetAt: resetDate.toISOString(),
        },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/generate-script",
};
