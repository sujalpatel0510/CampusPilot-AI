"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FloatingAssistant } from "@/components/layout/floating-assistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        window.dispatchEvent(new Event("campuspilot:open-search"));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 glass lg:block">
        <Sidebar />
      </aside>
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>
      <FloatingAssistant />
    </div>
  );
}