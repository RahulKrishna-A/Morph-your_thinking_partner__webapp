"use client";

import { LogOutIcon, MessageSquareIcon, SparklesIcon } from "lucide-react";
import { signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { SessionItem } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  user: User | null;
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

function getSessionName(date?: Date): string {
  if (!date) return "New Session";
  const hours = date.getHours();
  if (hours < 12) return "Morning Session";
  if (hours < 17) return "Afternoon Session";
  return "Evening Session";
}

function getSessionTime(date?: Date): string {
  if (!date) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

function getStatusLabel(status?: string) {
  switch (status) {
    case "ready_for_call":
      return "Ready";
    case "processing":
    case "recording_submitted":
      return "Processing";
    case "in_call":
      return "In Call";
    case "completed":
      return "Done";
    default:
      return "New";
  }
}

export function AppSidebar({
  user,
  open,
  onOpenChange,
  sessions,
  activeSessionId,
  onSelectSession,
}: AppSidebarProps) {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-80 flex-col gap-0 bg-sidebar p-0"
      >
        <SheetHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-pop-rose" />
            <SheetTitle className="font-serif text-lg font-bold text-sidebar-foreground">
              Sessions
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col gap-1 p-2">
            {sessions.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <MessageSquareIcon className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No sessions yet
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Tap the + button to start one
                </p>
              </div>
            )}
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => {
                  onSelectSession(session.sessionId);
                  onOpenChange(false);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all hover:bg-sidebar-accent",
                  activeSessionId === session.sessionId &&
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-background/50",
                    activeSessionId === session.sessionId &&
                      "border-pop-rose/30 bg-pop-rose/10"
                  )}
                >
                  <MessageSquareIcon
                    className={cn(
                      "size-4 text-muted-foreground",
                      activeSessionId === session.sessionId && "text-pop-rose"
                    )}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-sidebar-foreground">
                    {getSessionName(session.createdAt)}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatSessionDate(session.createdAt)}</span>
                    {session.createdAt && (
                      <>
                        <span className="text-border">·</span>
                        <span>{getSessionTime(session.createdAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      getStatusDot(session.status)
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground/70">
                    {getStatusLabel(session.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User profile + sign out */}
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar className="size-9 border border-sidebar-border">
              {user?.photoURL ? (
                <AvatarImage
                  src={user.photoURL}
                  alt={user?.displayName ?? "User"}
                />
              ) : null}
              <AvatarFallback className="bg-card text-xs font-medium text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.displayName || "User"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email || ""}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Sign Out"
            >
              <LogOutIcon className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
