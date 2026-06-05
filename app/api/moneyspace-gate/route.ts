import { NextResponse } from "next/server";
import { createPayment, type PackageType } from "@/lib/moneyspace";

const VALID_PACKAGES: PackageType[] = ["single", "pro", "buffet"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const packageType = (body.packageType ?? "single") as PackageType;

    if (!VALID_PACKAGES.includes(packageType)) {
      return NextResponse.json(
        { success: false, error: "Invalid package type" },
        { status: 400 }
      );
    }

    const payment = await createPayment(packageType);

    return NextResponse.json({
      success: true,
      transaction_id: payment.transaction_id,
      qr_image_link: payment.qr_image_link,
      order_id: payment.order_id,
      mock: payment.mock ?? false,
    });
  } catch (error) {
    console.error("MoneySpace gate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: 500 }
    );
  }
}
