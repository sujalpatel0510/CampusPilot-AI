"use client";

import { useState } from "react";
import { ArrowUp, Mic, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);

  function send() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function toggleMic() {
    if (listening) {
      setListening(false);
      toast.info("Voice input stopped.");
      return;
    }
    setListening(true);
    toast.info("Listening… (voice input is simulated in this preview)");
    setTimeout(() => {
      setListening(false);
    }, 3000);
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about exams, attendance, classes…"
          className="max-h-32 min-h-[52px] resize-none pr-28"
          disabled={disabled}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toast.info("File attachment is simulated in this preview.")}
            aria-label="Attach file"
            className="text-muted-foreground"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant={listening ? "destructive" : "ghost"}
            size="icon-sm"
            onClick={toggleMic}
            aria-label="Voice input"
            className={listening ? "" : "text-muted-foreground"}
            disabled={disabled}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" onClick={send} disabled={disabled || !value.trim()} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        CampusPilot AI can make mistakes — verify important details.
      </p>
    </div>
  );
}