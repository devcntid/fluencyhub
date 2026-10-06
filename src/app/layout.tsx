import type { Metadata } from "next";
import { Albert_Sans, Cabin } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const heading = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-heading-g",
  weight: ["400", "500", "600", "700", "800"],
});

const body = Cabin({
  subsets: ["latin"],
  variable: "--font-body-g",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FluencyHub — Applied English for STEM",
  description: "Learn professional English for STEM, business, and interviews.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable} h-full`}>
      <body className="min-h-full overflow-y-scroll">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
