import "server-only";

function xenditKey() {
  return process.env.XENDIT_API_KEY ?? process.env.XENDIT_SECRET_KEY ?? "";
}

function authHeader() {
  return `Basic ${Buffer.from(`${xenditKey()}:`).toString("base64")}`;
}

async function xenditFetch<T>(
  path: string,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`https://api.xendit.co${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & {
    message?: string;
    error_code?: string;
    errors?: Array<{ path?: string; message?: string }>;
  };
  if (!res.ok) {
    const detail = json.errors?.map((e) => e.message ?? e.path).filter(Boolean).join("; ");
    throw new Error(detail || json.message || json.error_code || `Xendit error ${res.status}`);
  }
  return json;
}

const VA_BANKS: Record<string, string> = {
  XENDIT_VA_BCA: "BCA",
  XENDIT_VA_MANDIRI: "MANDIRI",
  XENDIT_VA_BSI: "BSI",
  XENDIT_VA_BRI: "BRI",
  XENDIT_VA_BNI: "BNI",
  XENDIT_VA_BJB: "BJB",
  XENDIT_VA_BNC: "BNC",
  XENDIT_VA_CIMB: "CIMB",
  XENDIT_VA_MUAMALAT: "MUAMALAT",
  XENDIT_VA_PERMATA: "PERMATA",
};

const EWALLET_CHANNELS: Record<string, string> = {
  XENDIT_EWALLET_GOPAY: "ID_GOPAY",
  XENDIT_EWALLET_SHOPEEPAY: "ID_SHOPEEPAY",
  XENDIT_EWALLET_DANA: "ID_DANA",
  XENDIT_EWALLET_LINKAJA: "ID_LINKAJA",
};

export async function createXenditVA(params: {
  externalId: string;
  methodCode: string;
  name: string;
  amount: number;
  expiresAt: Date;
}) {
  const bankCode = VA_BANKS[params.methodCode];
  if (!bankCode) throw new Error(`Unsupported Xendit VA: ${params.methodCode}`);
  return xenditFetch<{
    id: string;
    account_number: string;
    expiration_date?: string;
  }>("/callback_virtual_accounts", {
    external_id: params.externalId,
    bank_code: bankCode,
    name: params.name.slice(0, 50),
    expected_amount: Math.round(params.amount),
    is_closed: true,
    is_single_use: true,
    expiration_date: params.expiresAt.toISOString(),
  });
}

function readQrString(json: {
  id?: string;
  qr_string?: string;
  qr_code?: string;
  actions?: Array<{ type?: string; descriptor?: string; value?: string }>;
}): { id: string; qr_string: string } {
  const fromAction = json.actions?.find(
    (a) => a.descriptor === "QR_STRING" || a.descriptor === "QR_CODE" || a.type === "PRESENT_TO_CUSTOMER",
  )?.value;
  const value = json.qr_string ?? json.qr_code ?? fromAction ?? "";
  if (!value) throw new Error("Xendit QRIS did not return a QR payload");
  return { id: json.id ?? "", qr_string: value };
}

export async function createXenditQRIS(params: {
  externalId: string;
  amount: number;
}) {
  const amount = Math.round(params.amount);
  const lastErrors: string[] = [];

  try {
    const json = await xenditFetch<{ id: string; qr_string?: string; qr_code?: string }>(
      "/qr_codes",
      {
        reference_id: params.externalId,
        type: "DYNAMIC",
        currency: "IDR",
        amount,
      },
      { "api-version": "2022-07-31" },
    );
    return readQrString(json);
  } catch (error) {
    lastErrors.push(error instanceof Error ? error.message : "QR Codes API failed");
  }

  try {
    const json = await xenditFetch<{
      payment_request_id?: string;
      id?: string;
      actions?: Array<{ type?: string; descriptor?: string; value?: string }>;
    }>(
      "/v3/payment_requests",
      {
        reference_id: params.externalId,
        type: "PAY",
        country: "ID",
        currency: "IDR",
        request_amount: amount,
        channel_code: "QRIS",
      },
      { "api-version": "2024-11-11" },
    );
    return readQrString({ id: json.payment_request_id ?? json.id, actions: json.actions });
  } catch (error) {
    lastErrors.push(error instanceof Error ? error.message : "Payments v3 QRIS failed");
  }

  try {
    const json = await xenditFetch<{ id: string; qr_string?: string; qr_code?: string }>("/qr_codes", {
      external_id: params.externalId,
      type: "DYNAMIC",
      callback_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/webhooks/xendit`,
      amount,
    });
    return readQrString(json);
  } catch (error) {
    lastErrors.push(error instanceof Error ? error.message : "Legacy QR API failed");
  }

  throw new Error(lastErrors.filter(Boolean).join(" | ") || "Xendit QRIS failed");
}

export async function createXenditEWallet(params: {
  externalId: string;
  amount: number;
  methodCode: string;
  successRedirectURL: string;
  failureRedirectURL: string;
  mobileNumber?: string;
}) {
  const channelCode = EWALLET_CHANNELS[params.methodCode];
  if (!channelCode) throw new Error(`Unsupported Xendit e-wallet: ${params.methodCode}`);
  return xenditFetch<{
    id: string;
    actions?: { desktop_web_checkout_url?: string; mobile_web_checkout_url?: string };
    status?: string;
  }>("/ewallets/charges", {
    reference_id: params.externalId,
    currency: "IDR",
    amount: Math.round(params.amount),
    checkout_method: "ONE_TIME_PAYMENT",
    channel_code: channelCode,
    channel_properties: {
      success_redirect_url: params.successRedirectURL,
      failure_redirect_url: params.failureRedirectURL,
      ...(params.mobileNumber ? { mobile_number: params.mobileNumber } : {}),
    },
  });
}

export async function createXenditRetail(params: {
  externalId: string;
  amount: number;
  methodCode: string;
}) {
  const channel = params.methodCode === "XENDIT_RETAIL_INDOMARET" ? "INDOMARET" : "ALFAMART";
  return xenditFetch<{
    id: string;
    payment_code: string;
  }>("/payment_codes", {
    reference_id: params.externalId,
    channel_code: channel,
    market: "ID",
    currency: "IDR",
    amount: Math.round(params.amount),
    customer_name: "English Ready",
  });
}

export function verifyXenditWebhook(callbackToken: string): boolean {
  const expected =
    process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN ?? process.env.XENDIT_WEBHOOK_TOKEN ?? "";
  if (!expected) return true;
  return callbackToken === expected;
}
