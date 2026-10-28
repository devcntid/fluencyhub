import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { getAuthOptions, getAuthSecret } from "@/lib/auth";

export const auth = cache(async () => {
  if (!getAuthSecret()) {
    console.error("NEXTAUTH_SECRET is empty at runtime. Check Vercel env for Production.");
    return null;
  }
  try {
    return await getServerSession(getAuthOptions());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string } | null)?.code;
    if (code === "NO_SECRET" || message.toLowerCase().includes("secret")) {
      console.error("NextAuth secret error:", message);
      return null;
    }
    console.warn("[session] NextAuth session error caught gracefully:", message);
    return null;
  }
});
