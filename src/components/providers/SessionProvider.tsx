"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/ui/NotificationProvider";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </NextAuthSessionProvider>
  );
}

