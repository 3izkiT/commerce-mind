import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, getRateLimiter, isRateLimitConfigured } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next();
  }

  const body = await request.clone().json().catch(() => null);

  if (!body || typeof body.productDetails !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid payload: productDetails is required" },
      { status: 400 }
    );
  }

  if (body.productDetails.trim().length < 10) {
    return NextResponse.json(
      {
        success: false,
        error: "productDetails must be at least 10 characters",
      },
      { status: 400 }
    );
  }

  if (!isRateLimitConfigured()) {
    return NextResponse.next();
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: "/api/generate-script",
};
