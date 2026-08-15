"use client";

import { Bot, UserRound } from "lucide-react";
import type { ChatMessage } from "@/types";
import { formatTime12 } from "@/lib/utils";
import { cn } from "@/lib/utils";

function renderRichText(content: string): React.ReactNode[] {
  return content.split("\n").map((line, index) => {
    if (line.startsWith("• ")) {
      return (
        <li key={index} className="ml-1 list-disc leading-relaxed [&:not(:last-child)]:mb-1">
          {renderInline(line.slice(2))}
        </li>
      );
    }
    return (
      <p key={index} className="leading-relaxed [&:not(:last-child)]:mb-1.5">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <strong key={key++} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts;
}

export function ChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600">
          <Bot className="h-4 w-4 text-white" />
        </span>
      ) : null}

      <div className={cn("max-w-[85%] sm:max-w-[75%]", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border bg-card text-card-foreground"
          )}
        >
          {isUser ? (
            <p className="text-left leading-relaxed">{message.content}</p>
          ) : (
            <ul className="text-left">{renderRichText(message.content)}</ul>
          )}
        </div>
        <p className="mt-1 px-1 text-[10px] text-muted-foreground">
          {isUser ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-2.5 w-2.5" />
              You · {formatTime12(message.timestamp.slice(11, 16))}
            </span>
          ) : (
            `CampusPilot AI · ${formatTime12(message.timestamp.slice(11, 16))}`
          )}
        </p>
      </div>
    </div>
  );
}