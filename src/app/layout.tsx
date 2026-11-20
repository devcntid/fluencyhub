import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Ready — Speak. Connect. Contribute.",
  description: "Program Kesiapan Bahasa Inggris untuk Mahasiswa, Profesional, dan Karir Global.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/brand/logo-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/logo-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full overflow-y-scroll">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
