import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ nextauth?: string[] }> }
) {
  try {
    const params = await props.params;
    return await handler(req, { params });
  } catch (err) {
    console.error("[nextauth GET error]", err);
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ nextauth?: string[] }> }
) {
  try {
    const params = await props.params;
    // NextAuth only natively supports GET on /api/auth/csrf.
    // If a POST is sent to /csrf, gracefully resolve it with a GET request so it doesn't log 400.
    if (params?.nextauth?.[0] === "csrf") {
      const getReq = new NextRequest(req.url, {
        method: "GET",
        headers: req.headers,
      });
      return await handler(getReq, { params });
    }
    return await handler(req, { params });
  } catch (err) {
    console.error("[nextauth POST error]", err);
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}
