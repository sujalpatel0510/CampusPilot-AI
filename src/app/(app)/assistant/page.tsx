"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Menu } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { ChatMessage, Conversation } from "@/types";
import { ConversationSidebar } from "@/components/assistant/conversation-sidebar";
import { ChatMessage as ChatMessageView } from "@/components/assistant/chat-message";
import { TypingIndicator } from "@/components/assistant/typing-indicator";
import { ChatInput } from "@/components/assistant/chat-input";
import { SuggestedPrompts } from "@/components/assistant/suggested-prompts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantPage() {
  const { data: conversations, loading, refetch } = useApi(() => api.getConversations(), [], { key: "conversations" });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const activeMessages = activeId ? (messages[activeId] ?? []) : [];
  const hasMessages = activeMessages.length > 0;

  const appendMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] ?? []), message],
    }));
  }, []);

  useEffect(() => {
    if (loading || initializedRef.current) return;
    initializedRef.current = true;
    const pendingPrompt = sessionStorage.getItem("cp-prompt");
    if (pendingPrompt) {
      sessionStorage.removeItem("cp-prompt");
      void startNewConversation(pendingPrompt);
    } else if (conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, typing]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      appendMessage(conversationId, {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      });
      setTyping(true);
      try {
        const result = await api.chat(content, conversationId);
        appendMessage(conversationId, {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          timestamp: new Date().toISOString(),
        });
        refetch();
      } catch {
        toast.error("The assistant could not reply right now.");
      } finally {
        setTyping(false);
      }
    },
    [appendMessage, refetch]
  );

  const startNewConversation = useCallback(
    async (initialPrompt?: string) => {
      try {
        const created = await api.createConversation();
        refetch();
        setActiveId(created.id);
        if (initialPrompt) {
          await sendMessage(created.id, initialPrompt);
        }
      } catch {
        toast.error("Could not start a new conversation.");
      }
    },
    [refetch, sendMessage]
  );

  function handleSend(content: string) {
    if (!activeId) {
      void startNewConversation(content);
    } else {
      void sendMessage(activeId, content);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteConversation(id);
      refetch();
      setMessages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeId === id) setActiveId(null);
      toast.success("Conversation deleted.");
    } catch {
      toast.error("Could not delete the conversation.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] gap-0">
        <div className="hidden w-64 shrink-0 flex-col gap-3 border-r p-3 lg:flex">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-20 w-3/4" />
          <Skeleton className="h-20 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <ConversationSidebar
        conversations={conversations ?? []}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => startNewConversation()}
        onDelete={handleDelete}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
            <Bot className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {conversations?.find((c) => c.id === activeId)?.title ?? "CampusPilot AI"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {hasMessages
                ? `${activeMessages.length} messages`
                : "Online · answers from your campus data"}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin sm:p-6">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30">
                <Bot className="h-8 w-8 text-white" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Ask anything about your campus</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Exam schedules, attendance warnings, today&apos;s classes, deadlines or a study
                  plan — I know your academic life.
                </p>
              </div>
              <SuggestedPrompts onSelect={handleSend} />
            </div>
          ) : (
            <>
              {activeMessages.map((message) => (
                <ChatMessageView key={message.id} message={message} />
              ))}
              {typing ? <TypingIndicator /> : null}
            </>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={typing} />
      </div>
    </div>
  );
}
