"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function FloatingAssistant() {
  const { user } = useAuth();
  if (user && user.role !== "student") return null;
  return (
    <Link
      href="/assistant"
      aria-label="Ask CampusPilot AI"
      className="group fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 sm:hidden"
    >
      <Bot className="h-5 w-5" />
      <span className="pointer-events-none absolute right-14 hidden whitespace-nowrap rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md group-hover:block">
        Ask CampusPilot AI
      </span>
    </Link>
  );
}