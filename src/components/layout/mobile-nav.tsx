"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => onOpenChange(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r bg-background shadow-xl">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar className="pt-0" />
          </div>
        </div>
      ) : null}
    </>
  );
}