import "server-only";
import { createHash } from "crypto";
import midtransClient from "midtrans-client";
import { midtransClientKey, midtransSnapScriptUrl } from "./midtrans-public";

export { midtransClientKey, midtransSnapScriptUrl };

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapClient() {
  return new midtransClient.Snap({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

function coreClient() {
  return new midtransClient.CoreApi({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

type CoreCharge = {
  transaction_id?: string;
  qr_string?: string;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  va_numbers?: Array<{ bank?: string; va_number?: string }>;
  actions?: Array<{ name?: string; url?: string }>;
  status_code?: string;
  status_message?: string;
};

export type MidtransCoreResult =
  | {
      success: true;
      transactionId: string;
      vaNumber?: string;
      qrString?: string;
      qrImageUrl?: string;
      redirectUrl?: string;
    }
  | { success: false; fallback: true; message?: string };

function coreChargeConfig(
  methodCode: string,
  callbackUrl: string,
): { paymentType: string; extra: Record<string, unknown> } | null {
  switch (methodCode) {
    case "MIDTRANS_QRIS_GOPAY":
      return { paymentType: "qris", extra: { qris: { acquirer: "gopay" } } };
    case "MIDTRANS_GOPAY":
      return { paymentType: "gopay", extra: { gopay: { enable_callback: true, callback_url: callbackUrl } } };
    case "MIDTRANS_SHOPEEPAY":
      return { paymentType: "shopeepay", extra: { shopeepay: { callback_url: callbackUrl } } };
    case "MIDTRANS_DANA":
      return { paymentType: "dana", extra: { dana: { callback_url: callbackUrl } } };
    case "MIDTRANS_BNI_VA":
      return { paymentType: "bank_transfer", extra: { bank_transfer: { bank: "bni" } } };
    case "MIDTRANS_BCA_VA":
      return { paymentType: "bank_transfer", extra: { bank_transfer: { bank: "bca" } } };
    case "MIDTRANS_BRI_VA":
      return { paymentType: "bank_transfer", extra: { bank_transfer: { bank: "bri" } } };
    case "MIDTRANS_PERMATA_VA":
      return { paymentType: "bank_transfer", extra: { bank_transfer: { bank: "permata" } } };
    case "MIDTRANS_CIMB_VA":
      return { paymentType: "bank_transfer", extra: { bank_transfer: { bank: "cimb" } } };
    case "MIDTRANS_MANDIRI_VA":
      return {
        paymentType: "echannel",
        extra: { echannel: { bill_info1: "Payment For", bill_info2: "English Ready" } },
      };
    default:
      return null;
  }
}

function parseCoreCharge(raw: CoreCharge): MidtransCoreResult {
  const vaNumber =
    raw.va_numbers?.[0]?.va_number ??
    raw.permata_va_number ??
    (raw.bill_key && raw.biller_code ? `${raw.biller_code}-${raw.bill_key}` : raw.bill_key);
  const qrImageUrl = raw.actions?.find((a) => a.name === "generate-qr-code")?.url;
  const redirectUrl = raw.actions?.find((a) =>
    ["deeplink-redirect", "desktop-web-checkout", "mobile-web-checkout"].includes(a.name ?? ""),
  )?.url;
  if (!raw.transaction_id && !vaNumber && !raw.qr_string && !qrImageUrl && !redirectUrl) {
    return { success: false, fallback: true, message: raw.status_message };
  }
  return {
    success: true,
    transactionId: raw.transaction_id ?? "",
    vaNumber: vaNumber ?? undefined,
    qrString: raw.qr_string,
    qrImageUrl,
    redirectUrl,
  };
}

export async function chargeMidtransCore(params: {
  orderNumber: string;
  grossAmount: number;
  methodCode: string;
  customerDetails: { firstName: string; email: string; phone: string };
  callbackUrl: string;
}): Promise<MidtransCoreResult> {
  const config = coreChargeConfig(params.methodCode, params.callbackUrl);
  if (!config) return { success: false, fallback: true };
  try {
    const raw = (await coreClient().charge({
      payment_type: config.paymentType,
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: Math.round(params.grossAmount),
      },
      customer_details: {
        first_name: params.customerDetails.firstName,
        email: params.customerDetails.email,
        phone: params.customerDetails.phone,
      },
      ...config.extra,
    })) as CoreCharge;
    return parseCoreCharge(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Midtrans Core charge failed";
    return { success: false, fallback: true, message };
  }
}

const ENABLED_BY_CODE: Record<string, string[]> = {
  MIDTRANS_QRIS_GOPAY: ["qris", "gopay"],
  MIDTRANS_BNI_VA: ["bni_va"],
  MIDTRANS_GOPAY: ["gopay"],
  MIDTRANS_MANDIRI_VA: ["echannel", "mandiri_va"],
  MIDTRANS_PERMATA_VA: ["permata_va"],
  MIDTRANS_SHOPEEPAY: ["shopeepay"],
  MIDTRANS_DANA: ["dana"],
  MIDTRANS_OVO: ["other_qris"],
  MIDTRANS_BCA_VA: ["bca_va"],
  MIDTRANS_BRI_VA: ["bri_va"],
  MIDTRANS_BSI_VA: ["other_va"],
  MIDTRANS_CIMB_VA: ["cimb_va"],
  MIDTRANS_DANAMON_VA: ["other_va"],
  MIDTRANS_GOOGLEPAY: ["gopay"],
  MIDTRANS_CREDITCARD: ["credit_card"],
};

export async function createSnapToken(params: {
  orderNumber: string;
  grossAmount: number;
  customerDetails: { firstName: string; email: string; phone: string };
  methodCode?: string;
}) {
  const enabled = params.methodCode ? ENABLED_BY_CODE[params.methodCode] : undefined;
  const snap = snapClient();
  const result = await snap.createTransaction({
    transaction_details: {
      order_id: params.orderNumber,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      email: params.customerDetails.email,
      phone: params.customerDetails.phone,
    },
    ...(enabled ? { enabled_payments: enabled } : {}),
  });
  return result as { token: string; redirect_url: string };
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const hash = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY ?? ""}`)
    .digest("hex");
  return hash === signatureKey;
}
