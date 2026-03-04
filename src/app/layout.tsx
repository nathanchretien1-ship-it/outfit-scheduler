import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Shirt, CalendarHeart, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import AuthNav from "@/components/auth-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outfit Scheduler - AI Powered Wardrobe",
  description: "Plan your daily outfits with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background`}
      >
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center mx-auto px-4 md:px-8">
            <Link href="/" className="flex items-center space-x-2 mr-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">
                OutfitScheduler
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/wardrobe"
                className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
              >
                <Shirt className="h-4 w-4" />
                Dressing
              </Link>
              <Link
                href="/planner"
                className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
              >
                <CalendarHeart className="h-4 w-4" />
                Planning
              </Link>
            </nav>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <AuthNav />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 md:px-8 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
