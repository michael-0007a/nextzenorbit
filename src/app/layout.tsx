import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NEXTZEN ORBIT - AI Resume Builder & Job Tracker",
    template: "%s | NEXTZEN ORBIT",
  },
  description:
    "AI-powered resume optimization, job analysis, and application tracking for ambitious professionals.",
  keywords: [
    "NEXTZEN ORBIT",
    "resume builder",
    "job search",
    "AI resume",
    "ATS optimization",
    "application tracker",
    "career",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
