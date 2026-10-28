import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderByNumber, updateOrderStatus } from "@/lib/db/orders.queries";
import { createWebhookLog } from "@/lib/db/webhook-logs.queries";
import { markOrderPaid } from "@/lib/orders";
import {
  verifyFaspayLegacySignature,
  verifyGatewaySignature,
} from "@/lib/payment/faspay";
import { isWebhookDuplicate } from "@/lib/redis";

function formatFaspayDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function POST(req: Request) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { response_error: { response_code: "99", response_desc: "Invalid request body" } },
      { status: 400 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { response_error: { response_code: "99", response_desc: "Malformed JSON" } },
      { status: 400 },
    );
  }

  const sigHeader = req.headers.get("x-gateway-signature");
  const timeHeader = req.headers.get("x-gateway-timestamp");
  const isGatewayEvent = Boolean(sigHeader || body.event_type || (body.data as Record<string, unknown> | undefined)?.transaction_id);

  // 1. Handling Payment Service Gateway Webhook
  if (isGatewayEvent && body.event_type) {
    const valid = verifyGatewaySignature(sigHeader, timeHeader, rawBody);
    const data = (body.data as Record<string, unknown> | undefined) ?? {};
    const orderNumber = String(data.merchant_reference ?? body.merchant_reference ?? "");
    const eventType = String(body.event_type ?? "");

    await createWebhookLog({
      orderNumber,
      provider: "faspay",
      eventType,
      gatewayTxnId: String(data.transaction_id ?? ""),
      payloadJson: body,
      signatureValid: valid,
      processingStatus: valid ? "received" : "failed",
      errorMessage: valid ? null : "Invalid Gateway signature",
    });

    if (!valid && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (eventType === "transaction.succeeded") {
      const order = await getOrderByNumber(orderNumber);
      if (order && order.status !== "paid") {
        const course = await getCourseById(order.courseId);
        if (course) await markOrderPaid(order, course);
      }
    } else if (eventType === "transaction.failed") {
      const order = await getOrderByNumber(orderNumber);
      if (order && order.status !== "paid") {
        await updateOrderStatus(order.id, "failed");
      }
    } else if (eventType === "transaction.expired") {
      const order = await getOrderByNumber(orderNumber);
      if (order && order.status !== "paid") {
        await updateOrderStatus(order.id, "expired");
      }
    }

    return NextResponse.json({ ok: true, received: true });
  }

  // 2. Handling Direct Faspay Payment Notification (LokaDesa / Faspay Standard)
  const billNo = String(body.bill_no ?? "");
  const statusCode = String(body.payment_status_code ?? "");
  const signature = String(body.signature ?? "");
  const trxId = String(body.trx_id ?? "");
  const merchantId = String(body.merchant_id ?? "");
  const merchant = String(body.merchant ?? "FluencyHub");

  const validSig = verifyFaspayLegacySignature(billNo, statusCode, signature);

  await createWebhookLog({
    orderNumber: billNo,
    provider: "faspay",
    eventType: `status_${statusCode}`,
    gatewayTxnId: trxId,
    payloadJson: body,
    signatureValid: validSig,
    processingStatus: validSig ? "received" : "failed",
    errorMessage: validSig ? null : "Otentifikasi tidak benar (SIGNATURE)",
  });

  // Scenario 19.21: If signature is invalid, return standard Faspay error response
  if (!validSig) {
    return NextResponse.json({
      response_error: {
        response_code: "55",
        response_desc: "Otentifikasi tidak benar (SIGNATURE)",
      },
    });
  }

  // Check duplicate
  const dupKey = `faspay:${trxId || billNo}:${statusCode}`;
  if (await isWebhookDuplicate(dupKey)) {
    return NextResponse.json({
      response: "Payment Notification",
      trx_id: trxId,
      merchant_id: merchantId,
      merchant,
      bill_no: billNo,
      response_code: "00",
      response_desc: "Sukses (Duplicate Ignored)",
      response_date: formatFaspayDate(),
    });
  }

  // Find order and mark paid
  const order = await getOrderByNumber(billNo);
  if (order) {
    if (statusCode === "2" && order.status !== "paid") {
      // 2 = Payment Sukses
      const course = await getCourseById(order.courseId);
      if (course) await markOrderPaid(order, course);
    } else if (["3", "8", "cancel"].includes(statusCode)) {
      await updateOrderStatus(order.id, "cancelled");
    } else if (["4", "expired"].includes(statusCode)) {
      await updateOrderStatus(order.id, "expired");
    }
  }

  // Scenario 18.25: Faspay expected success response
  return NextResponse.json({
    response: "Payment Notification",
    trx_id: trxId,
    merchant_id: merchantId,
    merchant,
    bill_no: billNo,
    response_code: "00",
    response_desc: "Sukses",
    response_date: formatFaspayDate(),
  });
}
