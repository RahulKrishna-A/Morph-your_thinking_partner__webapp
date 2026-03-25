"use client";

import { LogOutIcon, MessageSquareIcon } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { SessionItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: SessionItem[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

function formatSessionDate(date?: Date): string {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusDot(status?: string) {
  switch (status) {
    case "ready_for_call":
      return "bg-green-500";
    case "processing":
    case "recording_submitted":
      return "bg-yellow-500 animate-pulse";
    case "in_call":
      return "bg-blue-500 animate-pulse";
    case "completed":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground/50";
  }
}

export function AppSidebar({
  open,
  onOpenChange,
  sessions,
  activeSessionId,
  onSelectSession,
}: AppSidebarProps) {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-80 flex-col gap-0 bg-sidebar p-0"
      >
        <SheetHeader className="border-b border-sidebar-border px-4 py-4">
          <SheetTitle className="text-lg font-semibold text-sidebar-foreground">
            Session History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {sessions.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No sessions yet
              </p>
            )}
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => {
                  onSelectSession(session.sessionId);
                  onOpenChange(false);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-sidebar-accent",
                  activeSessionId === session.sessionId &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-sidebar-foreground">
                    Session
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatSessionDate(session.createdAt)}
                  </span>
                </div>
                <div
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    getStatusDot(session.status)
                  )}
                />
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOutIcon className="size-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
