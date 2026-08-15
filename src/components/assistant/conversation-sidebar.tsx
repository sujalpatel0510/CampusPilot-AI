"use client";

import { useState } from "react";
import { Bot, MessageSquare, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onOpenChange,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r bg-background shadow-xl">
            <SidebarContent
              conversations={filtered}
              activeId={activeId}
              onSelect={(id) => {
                onSelect(id);
                onOpenChange(false);
              }}
              onNew={onNew}
              onDelete={onDelete}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 flex-col border-r lg:flex">
        <SidebarContent
          conversations={filtered}
          activeId={activeId}
          onSelect={onSelect}
          onNew={onNew}
          onDelete={onDelete}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">Conversations</p>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close conversations">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <Button onClick={onNew} className="mb-3 justify-start">
        <Plus className="h-4 w-4" />
        New conversation
      </Button>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations…"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No conversations yet. Start a new one!
          </p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                activeId === conversation.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
                className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                aria-label={`Delete ${conversation.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <Link
        href="/dashboard"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border p-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bot className="h-3.5 w-3.5 text-primary" />
        CampusPilot AI — campus-aware assistant
      </Link>
    </div>
  );
}