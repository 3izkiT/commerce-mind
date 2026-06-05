import { createHmac } from "crypto";
import { PRICES, type PackageType } from "./pricing";

export { PRICES, type PackageType };

const BASE_URL = "https://www.moneyspace.net/merchantapi";

export interface PaymentGateResult {
  transaction_id: string;
  qr_image_link: string;
  order_id: string;
  mock?: boolean;
}

export interface PaymentCheckResult {
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  transaction_id: string;
  amount?: string;
}

function isMoneySpaceConfigured(): boolean {
  return !!(
    process.env.MONEYSPACE_API_KEY && process.env.MONEYSPACE_SECRET
  );
}

function getCredentials() {
  return {
    secretId: process.env.MONEYSPACE_API_KEY!,
    secretKey: process.env.MONEYSPACE_SECRET!,
  };
}

function createTimeHash(): string {
  const d = new Date();
  const pad = (n: number, len: number) => String(n).padStart(len, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}` +
    `${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}${pad(d.getSeconds(), 2)}`
  );
}

function hmacSHA256(key: string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `cm${timestamp}${random}`.slice(0, 20);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

async function createPaymentTransaction(
  amount: number,
  packageType: PackageType
): Promise<{ transactionId: string; orderId: string }> {
  const credentials = getCredentials();
  const orderId = generateOrderId();
  const timeHash = createTimeHash();
  const amountStr = formatAmount(amount);

  const hash = hmacSHA256(
    credentials.secretKey,
    [
      "Customer",
      "CommerceMind",
      "",
      "",
      amountStr,
      "THB",
      `CommerceMind.ai - ${packageType} package`,
      "",
      "",
      "include",
      timeHash,
      orderId,
      "qrnone",
      "",
      "",
      "",
    ].join("")
  );

  const body = new URLSearchParams({
    secreteID: credentials.secretId,
    firstname: "Customer",
    lastname: "CommerceMind",
    amount: amountStr,
    currency: "THB",
    feeType: "include",
    timeHash,
    customer_order_id: orderId,
    gatewayType: "qrnone",
    description: `CommerceMind.ai - ${packageType} package`,
    hash,
  });

  const res = await fetch(`${BASE_URL}/v2/createpayment/obj`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const payload = await res.json();

  if (!payload["Transaction ID"]) {
    throw new Error(payload.status ?? "Failed to create payment");
  }

  return {
    transactionId: payload["Transaction ID"],
    orderId,
  };
}

async function getPaymentLink(transactionId: string): Promise<string> {
  const credentials = getCredentials();
  const timeHash = createTimeHash();
  const hash = hmacSHA256(
    credentials.secretKey,
    [transactionId, timeHash].join("")
  );

  const params = new URLSearchParams({
    secreteID: credentials.secretId,
    transactionID: transactionId,
    timehash: timeHash,
    hash,
  });

  return `${BASE_URL}/makepayment/linkpaymentcard?${params.toString()}`;
}

export async function createPayment(
  packageType: PackageType = "single"
): Promise<PaymentGateResult> {
  const amount = PRICES[packageType];

  if (!isMoneySpaceConfigured()) {
    const mockTxId = `mock_${Date.now()}`;
    return {
      transaction_id: mockTxId,
      qr_image_link: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_PAY_${mockTxId}_${amount}`,
      order_id: generateOrderId(),
      mock: true,
    };
  }

  const tx = await createPaymentTransaction(amount, packageType);
  const paymentLink = await getPaymentLink(tx.transactionId);

  return {
    transaction_id: tx.transactionId,
    qr_image_link: paymentLink,
    order_id: tx.orderId,
  };
}

export async function checkPaymentStatus(
  transactionId: string
): Promise<PaymentCheckResult> {
  if (transactionId.startsWith("mock_")) {
    const createdAt = parseInt(transactionId.replace("mock_", ""), 10);
    const elapsed = Date.now() - createdAt;
    if (elapsed > 12000) {
      return { status: "COMPLETED", transaction_id: transactionId };
    }
    return { status: "PENDING", transaction_id: transactionId };
  }

  if (!isMoneySpaceConfigured()) {
    return { status: "PENDING", transaction_id: transactionId };
  }

  const credentials = getCredentials();
  const timeHash = createTimeHash();
  const hash = hmacSHA256(
    credentials.secretKey,
    [transactionId, timeHash].join("")
  );

  const body = new URLSearchParams({
    secreteID: credentials.secretId,
    transactionID: transactionId,
    timeHash,
    hash,
  });

  const res = await fetch(`${BASE_URL}/v1/findbytransaction/obj`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const rawPayload = await res.json();
  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    payload[key.toLowerCase().trim()] = String(value);
  }

  const statusMap: Record<string, PaymentCheckResult["status"]> = {
    paymentsuccess: "COMPLETED",
    paymentpending: "PENDING",
    paymentfailed: "FAILED",
    paymentcancelled: "CANCELLED",
    success: "COMPLETED",
    pending: "PENDING",
    failed: "FAILED",
    cancelled: "CANCELLED",
  };

  const rawStatus = payload["status payment"] ?? "pending";
  const status = statusMap[rawStatus.toLowerCase()] ?? "PENDING";

  return {
    status,
    transaction_id: transactionId,
    amount: payload["amount"],
  };
}
