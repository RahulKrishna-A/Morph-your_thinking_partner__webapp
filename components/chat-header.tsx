"use client";

import { MenuIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onMenuOpen: () => void;
  onNewSession: () => void;
}

export function ChatHeader({ onMenuOpen, onNewSession }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuOpen}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Open session history"
      >
        <MenuIcon className="size-5" />
      </Button>

      <h1 className="text-base font-semibold tracking-tight">Morph</h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNewSession}
        className="text-muted-foreground hover:text-foreground"
        aria-label="New session"
      >
        <PlusIcon className="size-5" />
      </Button>
    </header>
  );
}
