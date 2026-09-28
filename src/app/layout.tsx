import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealMind — AI Sales Intelligence with Hindsight Memory",
  description:
    "DealMind is an AI sales intelligence agent that retains and recalls everything about every customer using persistent Hindsight memory — so every meeting starts prepared.",
  keywords: [
    "DealMind",
    "AI sales agent",
    "Hindsight memory",
    "persistent memory",
    "sales intelligence",
    "meeting prep",
    "CRM",
  ],
  authors: [{ name: "DealMind" }],
  openGraph: {
    title: "DealMind — AI Sales Intelligence with Hindsight Memory",
    description:
      "An AI sales agent with persistent memory. See the difference memory makes.",
    siteName: "DealMind",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
