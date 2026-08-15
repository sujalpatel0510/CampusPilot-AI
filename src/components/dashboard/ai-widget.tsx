"use client";

import { ArrowRight, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

const PROMPTS = [
  "When is my next exam?",
  "Am I at risk of being debarred?",
  "What are my classes today?",
];

export function AiWidget() {
  const router = useRouter();

  function ask(prompt?: string) {
    if (prompt) sessionStorage.setItem("cp-prompt", prompt);
    router.push("/assistant");
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-indigo-600/5 via-primary/5 to-violet-600/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
                <Bot className="h-3.5 w-3.5 text-white" />
              </span>
              Ask CampusPilot AI
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Get instant answers about your exams, attendance and schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => ask()}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open assistant
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => ask(prompt)}
              className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}