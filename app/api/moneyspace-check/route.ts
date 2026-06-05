import { NextResponse } from "next/server";
import { checkPaymentStatus } from "@/lib/moneyspace";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tx = searchParams.get("tx");

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "tx query parameter is required" },
        { status: 400 }
      );
    }

    const result = await checkPaymentStatus(tx);

    return NextResponse.json({
      success: true,
      status: result.status,
      transaction_id: result.transaction_id,
      amount: result.amount,
    });
  } catch (error) {
    console.error("MoneySpace check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check payment",
      },
      { status: 500 }
    );
  }
}
