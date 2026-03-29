"use client";

import Image from "next/image";
import { LogOutIcon, MessageSquareIcon, PlusCircleIcon, ZapIcon } from "lucide-react";
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
  credits?: number | null;
}

type SessionGroup = { label: string; sessions: SessionItem[] };

function groupSessions(sessions: SessionItem[]): SessionGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  const today: SessionItem[] = [];
  const yesterday: SessionItem[] = [];
  const thisWeek: SessionItem[] = [];
  const older: SessionItem[] = [];

  for (const session of sessions) {
    const d = session.createdAt;
    if (!d) {
      today.push(session);
    } else if (d >= todayStart) {
      today.push(session);
    } else if (d >= yesterdayStart) {
      yesterday.push(session);
    } else if (d >= weekStart) {
      thisWeek.push(session);
    } else {
      older.push(session);
    }
  }

  const groups: SessionGroup[] = [];
  if (today.length) groups.push({ label: "Today", sessions: today });
  if (yesterday.length) groups.push({ label: "Yesterday", sessions: yesterday });
  if (thisWeek.length) groups.push({ label: "This Week", sessions: thisWeek });
  if (older.length) groups.push({ label: "Earlier", sessions: older });
  return groups;
}

function getSessionTime(date?: Date): string {
  if (!date) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getSessionLabel(date?: Date): string {
  if (!date) return "New Session";
  const h = date.getHours();
  if (h < 12) return "Morning Session";
  if (h < 17) return "Afternoon Session";
  return "Evening Session";
}

function getStatusConfig(status?: string): {
  dot: string;
  label: string;
  labelClass: string;
} {
  switch (status) {
    case "ready_for_call":
      return {
        dot: "bg-green-500",
        label: "Ready",
        labelClass: "text-green-600 dark:text-green-400",
      };
    case "processing":
    case "recording_submitted":
    case "transcribing":
      return {
        dot: "bg-yellow-500 animate-pulse",
        label: "Processing",
        labelClass: "text-yellow-600 dark:text-yellow-400",
      };
    case "in_call":
    case "call_in_progress":
      return {
        dot: "bg-blue-500 animate-pulse",
        label: "In Call",
        labelClass: "text-blue-600 dark:text-blue-400",
      };
    case "processing_research":
      return {
        dot: "bg-purple-500 animate-pulse",
        label: "Researching",
        labelClass: "text-purple-600 dark:text-purple-400",
      };
    case "building_vm":
      return {
        dot: "bg-indigo-500 animate-pulse",
        label: "Building",
        labelClass: "text-indigo-600 dark:text-indigo-400",
      };
    case "completed":
    case "complete":
      return {
        dot: "bg-muted-foreground/40",
        label: "Done",
        labelClass: "text-muted-foreground",
      };
    default:
      return {
        dot: "bg-muted-foreground/20",
        label: "New",
        labelClass: "text-muted-foreground/60",
      };
  }
}

export function AppSidebar({
  user,
  open,
  onOpenChange,
  sessions,
  activeSessionId,
  onSelectSession,
  credits,
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

  const groups = groupSessions(sessions);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-80 flex-col gap-0 bg-sidebar p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/Logo.png"
                alt=""
                width={22}
                height={22}
                className="size-[22px] shrink-0 object-contain dark:invert"
              />
              <div>
                <SheetTitle className="font-serif text-base font-bold leading-none text-sidebar-foreground">
                  Morph
                </SheetTitle>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  your thinking history
                </p>
              </div>
            </div>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-accent text-muted-foreground">
              <PlusCircleIcon className="size-3.5" />
            </div>
          </div>
        </SheetHeader>

        {/* Session list */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col p-2 pb-3">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-sidebar-border bg-sidebar-accent/50">
                  <MessageSquareIcon className="size-5 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No sessions yet
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    Tap + to start your first one
                  </p>
                </div>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-1">
                  {/* Group label */}
                  <div className="px-3 pb-1 pt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {group.label}
                    </span>
                  </div>

                  {/* Sessions in group */}
                  <div className="flex flex-col gap-0.5">
                    {group.sessions.map((session) => {
                      const isActive = activeSessionId === session.sessionId;
                      const sc = getStatusConfig(session.status);

                      return (
                        <button
                          key={session.sessionId}
                          onClick={() => {
                            onSelectSession(session.sessionId);
                            onOpenChange(false);
                          }}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                            isActive
                              ? "bg-sidebar-accent shadow-sm"
                              : "hover:bg-sidebar-accent/60"
                          )}
                        >
                          {/* Icon */}
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                              isActive
                                ? "border-pop-rose/30 bg-pop-rose/10"
                                : "border-sidebar-border bg-background/40"
                            )}
                          >
                            <MessageSquareIcon
                              className={cn(
                                "size-3.5",
                                isActive
                                  ? "text-pop-rose"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span
                              className={cn(
                                "truncate text-sm font-medium",
                                isActive
                                  ? "text-sidebar-foreground"
                                  : "text-sidebar-foreground/80"
                              )}
                            >
                              {getSessionLabel(session.createdAt)}
                            </span>
                            {session.createdAt && (
                              <span className="text-[11px] text-muted-foreground/60">
                                {getSessionTime(session.createdAt)}
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                sc.labelClass
                              )}
                            >
                              {sc.label}
                            </span>
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                sc.dot
                              )}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Footer */}
        <div className="p-3 space-y-2">
          {/* Credits */}
          {credits !== null && credits !== undefined && (
            <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pop-amber/15">
                <ZapIcon className="size-3.5 text-pop-amber" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-xs font-semibold text-sidebar-foreground">
                  {credits} {credits === 1 ? "credit" : "credits"} remaining
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  used for Morph calls
                </span>
              </div>
            </div>
          )}

          {/* User profile */}
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar className="size-8 shrink-0 border border-sidebar-border">
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
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.displayName || "User"}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user?.email || ""}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Sign Out"
            >
              <LogOutIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
