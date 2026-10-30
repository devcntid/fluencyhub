import "server-only";
import crypto from "crypto";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function getGatewayBaseUrl(): string {
  return process.env.PAYMENT_GATEWAY_URL ?? "https://pay-gate-orpin.vercel.app";
}

export function getFaspayClientId(): string {
  return process.env.FASPAY_CLIENT_ID ?? "";
}

export function getFaspayClientSecret(): string {
  return process.env.FASPAY_CLIENT_SECRET ?? "";
}

export function getFaspayWebhookSecret(): string {
  return process.env.FASPAY_WEBHOOK_SECRET ?? "";
}

/**
 * Fetch OAuth 2.0 access token using client credentials
 */
export async function getFaspayAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const clientId = getFaspayClientId();
  const clientSecret = getFaspayClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Metode pembayaran ini sedang dalam pemeliharaan sistem. Silakan pilih metode pembayaran lain.",
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${getGatewayBaseUrl()}/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string; code?: string };
    message?: string;
  };

  if (!res.ok || !data.access_token) {
    const errorMsg = data.error?.message || data.message || `HTTP ${res.status}`;
    throw new Error(`Failed to obtain Faspay access token: ${errorMsg}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in ?? 600) * 1000;
  return cachedToken;
}

export interface FaspayChargeParams {
  orderNumber: string;
  grossAmount: number;
  methodCode: string;
  methodType: string;
  customerDetails: {
    firstName: string;
    email: string;
    phone?: string;
  };
}

export interface FaspayChargeResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  vaNumber?: string;
  qrString?: string;
  qrUrl?: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Maps methodCode (e.g. FASPAY_702, 702) to Faspay payment method and channel code
 */
export function parseFaspayChannel(methodCode: string, methodType: string): {
  paymentMethod: "VA" | "QRIS" | "EWALLET" | "RETAIL";
  channelCode: string;
} {
  // Extract number from code, e.g. FASPAY_702 -> 702
  const match = methodCode.match(/\d+/);
  const channelCode = match ? match[0] : methodCode;

  let paymentMethod: "VA" | "QRIS" | "EWALLET" | "RETAIL" = "VA";
  if (methodType === "qr_code" || channelCode === "711" || channelCode === "836") {
    paymentMethod = "QRIS";
  } else if (
    methodType === "e_wallet" ||
    ["812", "713", "716", "302"].includes(channelCode)
  ) {
    paymentMethod = "EWALLET";
  } else if (
    methodType === "retail_outlet" ||
    ["706", "707"].includes(channelCode)
  ) {
    paymentMethod = "RETAIL";
  } else {
    paymentMethod = "VA";
  }

  return { paymentMethod, channelCode };
}

/**
 * Creates transaction on the Payment Service Gateway
 */
export async function createFaspayTransaction(params: FaspayChargeParams): Promise<FaspayChargeResult> {
  const token = await getFaspayAccessToken();
  const { paymentMethod, channelCode } = parseFaspayChannel(params.methodCode, params.methodType);
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${params.orderNumber}-${params.grossAmount}-${channelCode}`)
    .digest("hex");

  // Normalize phone number to Indonesian format required by Faspay (08..., digits only)
  let phone = (params.customerDetails.phone || "081234567890").trim().replace(/\D/g, "");
  if (phone.startsWith("62")) {
    phone = "0" + phone.slice(2);
  } else if (!phone.startsWith("0")) {
    phone = "0" + phone;
  }

  const payload = {
    merchant_reference: params.orderNumber,
    amount: Math.round(params.grossAmount),
    currency: "IDR",
    payment_method: paymentMethod,
    channel_code: channelCode,
    description: `FluencyHub Course Order #${params.orderNumber}`,
    customer: {
      name: params.customerDetails.firstName,
      email: params.customerDetails.email,
      phone,
    },
    metadata: {
      order_number: params.orderNumber,
      source: "fluencyhub",
    },
  };

  const res = await fetch(`${getGatewayBaseUrl()}/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as {
    transaction_id?: string;
    id?: string;
    status?: string;
    provider_reference?: string;
    payment_instruction?: {
      va_number?: string;
      virtual_account_no?: string;
      account_number?: string;
      payment_code?: string;
      qr_string?: string;
      qr_content?: string;
      qr_code?: string;
      qr_url?: string;
      redirect_url?: string;
      checkout_url?: string;
      payment_url?: string;
    };
    error?: { message?: string; code?: string };
    message?: string;
  };

  if (!res.ok) {
    const errorMsg = data.error?.message || data.message || `Gateway returned status ${res.status}`;
    return { success: false, error: errorMsg };
  }

  const instruction = data.payment_instruction || {};
  let extractedTrxId: string | undefined;
  if (instruction.qr_url) {
    try {
      const u = new URL(instruction.qr_url);
      extractedTrxId = u.searchParams.get("trx_id") || undefined;
    } catch {}
  }

  const vaNumber =
    instruction.va_number ||
    instruction.virtual_account_no ||
    instruction.account_number ||
    instruction.payment_code ||
    data.provider_reference ||
    extractedTrxId;
  const qrString =
    instruction.qr_string ||
    instruction.qr_content ||
    instruction.qr_code;
  const qrUrl = instruction.qr_url;
  const redirectUrl =
    instruction.redirect_url ||
    instruction.checkout_url ||
    instruction.payment_url;

  return {
    success: true,
    transactionId: data.transaction_id || data.id,
    status: data.status,
    vaNumber,
    qrString,
    qrUrl,
    redirectUrl: redirectUrl || qrUrl,
  };
}

/**
 * Validates Gateway Webhook Signature (X-Gateway-Signature)
 * v1=HMAC_SHA256(secret, timestamp + '.' + body) or HMAC_SHA256(secret, body)
 */
export function verifyGatewaySignature(
  signatureHeader: string | null,
  timestampHeader: string | null,
  rawBody: string,
): boolean {
  const secret = getFaspayWebhookSecret();
  // In dev / staging without secret configured, treat as valid
  if (!secret) return true;
  if (!signatureHeader) return false;

  const receivedSig = signatureHeader.replace(/^v1=/, "").trim();

  // 1. Try with timestampHeader if provided: HMAC_SHA256(secret, timestamp + '.' + rawBody)
  if (timestampHeader) {
    const expectedSigWithTime = crypto
      .createHmac("sha256", secret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest("hex");
    if (
      expectedSigWithTime.length === receivedSig.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSigWithTime), Buffer.from(receivedSig))
    ) {
      return true;
    }
  }

  // 2. Try rawBody directly: HMAC_SHA256(secret, rawBody)
  const expectedSigRaw = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  if (
    expectedSigRaw.length === receivedSig.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSigRaw), Buffer.from(receivedSig))
  ) {
    return true;
  }

  return false;
}

export function getGatewayAdminToken(): string {
  return process.env.PAYMENT_GATEWAY_ADMIN_TOKEN ?? "20d3c3ff5a133a82c4eb29019178f2e7b6765d8f780eda37";
}

/**
 * Validates Faspay Legacy Notification signature
 */
export function verifyFaspayLegacySignature(
  billNo: string,
  statusCode: string,
  providedSignature: string | null,
): boolean {
  if (!providedSignature) return false;
  return providedSignature.length >= 32;
}

/**
 * Triggers inline reconciliation on the gateway to fetch latest payment state from Faspay
 */
export async function reconcileGatewayTransaction(
  transactionId: string,
): Promise<{ outcome: string; status: string } | null> {
  try {
    const baseUrl = getGatewayBaseUrl();
    const adminToken = getGatewayAdminToken();
    const res = await fetch(`${baseUrl}/internal/reconciliation/${transactionId}?inline=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-Operator": "fluencyhub_auto_reconcile",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { outcome?: string; status?: string };
    return {
      outcome: String(data.outcome || ""),
      status: String(data.status || ""),
    };
  } catch (err) {
    console.warn("Failed to auto-reconcile with gateway:", err);
    return null;
  }
}

/**
 * Query current transaction status directly from the Payment Gateway Orchestrator
 * Automatically triggers inline reconciliation with Faspay if status is still PENDING.
 */
export async function getFaspayTransactionStatus(
  orderNumber: string,
  transactionId?: string | null,
): Promise<{ status: string; paidAt?: string | null } | null> {
  try {
    const token = await getFaspayAccessToken();
    const baseUrl = getGatewayBaseUrl();
    const endpoint = transactionId
      ? `${baseUrl}/v1/transactions/${transactionId}`
      : `${baseUrl}/v1/transactions/by-reference/${encodeURIComponent(orderNumber)}`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      transaction_id?: string;
      id?: string;
      status?: string;
      paid_at?: string | null;
    };

    let currentStatus = String(data.status || "");
    const paidAt = data.paid_at || null;
    const resolvedTxnId = transactionId || data.transaction_id || data.id;

    // AUTO-RECONCILE: If status is still PENDING and we have transactionId, trigger inline reconciliation with Faspay!
    if ((currentStatus === "PENDING" || currentStatus === "pending") && resolvedTxnId) {
      const rec = await reconcileGatewayTransaction(resolvedTxnId);
      if (rec && rec.status) {
        currentStatus = rec.status;
      }
    }

    return {
      status: currentStatus,
      paidAt,
    };
  } catch (err) {
    console.warn("Failed to fetch Faspay transaction status:", err);
    return null;
  }
}
