import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail, updateUserLastLogin } from "@/lib/db/users.queries";

export function getAuthSecret() {
  const env = process.env;
  return (env["NEXTAUTH_SECRET"] || env["AUTH_SECRET"] || "").trim();
}

export function getAuthOptions(): NextAuthOptions {
  return {
    secret: getAuthSecret() || undefined,
    providers: [
      GoogleProvider({
        clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
        clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      }),
    ],
    session: { strategy: "jwt" },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    callbacks: {
      async signIn({ user }) {
        if (!user.email) return false;
        const dbUser = await getUserByEmail(user.email);
        // Jika akun ditemukan dan status is_active = false, tolak login
        if (dbUser && !dbUser.isActive) {
          return false;
        }
        return true;
      },
      async jwt({ token, user, account }) {
        const email = (user?.email ?? (typeof token.email === "string" ? token.email : "")).trim();
        if (!email) return token;

        const now = Date.now();
        const stale = !token.roleCheckedAt || now - token.roleCheckedAt > 10 * 60 * 1000;
        const needDb = Boolean(user?.email) || !token.id || !token.role || stale;
        if (!needDb) return token;

        let dbUser = await getUserByEmail(email);
        if (!dbUser) {
          if (!user?.email) return token;
          dbUser = await createUser({
            name: user.name ?? email,
            email,
            googleId: account?.providerAccountId ?? null,
            avatarUrl: user.image ?? null,
            role: "user",
          });
        }
        if (user?.email) await updateUserLastLogin(dbUser.id);
        token.id = String(dbUser.id);
        token.role = dbUser.role;
        token.email = dbUser.email;
        token.revenueSharePct = dbUser.revenueSharePct;
        token.roleCheckedAt = now;
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id ?? "";
          session.user.role = token.role ?? "user";
          session.user.revenueSharePct = token.revenueSharePct;
        }
        return session;
      },
    },
  };
}

/** Lazily resolved so the secret is read at request time, not at build time. */
export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuthOptions(), prop, receiver);
  },
  ownKeys() {
    return Reflect.ownKeys(getAuthOptions());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getAuthOptions(), prop);
  },
});

export function getAdminPath() {
  return process.env["ADMIN_PATH"] ?? "fh-admin";
}

