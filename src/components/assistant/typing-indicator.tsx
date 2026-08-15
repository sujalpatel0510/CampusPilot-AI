"use client";

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600">
        <Bot className="h-4 w-4 text-white" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-muted-foreground" />
          <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}