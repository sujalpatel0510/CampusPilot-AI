import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "CampusPilot AI — Intelligent Academic Assistant",
    template: "%s · CampusPilot AI",
  },
  description:
    "CampusPilot AI is your intelligent academic assistant — attendance, timetable, assignments, exams, study plans and AI chat, all in one place.",
  applicationName: "CampusPilot AI",
  keywords: ["college", "campus", "AI", "assistant", "attendance", "timetable", "exams", "study plan"],
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
