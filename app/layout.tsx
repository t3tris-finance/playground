import { cn } from "cn";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";

export const metadata: Metadata = {
  title: "T3tris SDK Playground",
  description: "Try T3tris SDK calls with your own customer API key.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark-only product: the theme is fixed server-side, no theme provider.
    <html
      lang="en"
      className={cn("dark", "antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
