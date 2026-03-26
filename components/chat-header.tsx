"use client";

import {
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  ZapIcon,
} from "lucide-react";
import { signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  user: User | null;
  onMenuOpen: () => void;
  onNewSession: () => void;
  sessionStatus: string | null;
  callState: string;
  credits?: number | null;
}

function getStatusInfo(
  sessionStatus: string | null,
  callState: string
): { label: string; color: string; pulse: boolean } {
  if (callState === "in_call")
    return { label: "In Call", color: "bg-green-500", pulse: true };
  if (callState === "calling")
    return { label: "Connecting", color: "bg-yellow-500", pulse: true };
  if (sessionStatus === "processing" || sessionStatus === "recording_submitted")
    return { label: "Processing", color: "bg-yellow-500", pulse: true };
  if (sessionStatus === "ready_for_call")
    return { label: "Ready", color: "bg-green-500", pulse: false };
  if (sessionStatus === "completed")
    return { label: "Completed", color: "bg-muted-foreground", pulse: false };
  return { label: "Idle", color: "bg-muted-foreground/50", pulse: false };
}

export function ChatHeader({
  user,
  onMenuOpen,
  onNewSession,
  sessionStatus,
  callState,
  credits,
}: ChatHeaderProps) {
  const status = getStatusInfo(sessionStatus, callState);
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-3 backdrop-blur-xl">
      {/* Left: Menu + Status */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuOpen}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open session history"
          title="Session History"
        >
          <MenuIcon className="size-5" />
        </Button>

        {/* Status pill */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1">
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full opacity-75",
                status.color,
                status.pulse && "animate-ping"
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                status.color
              )}
            />
          </span>
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {status.label}
          </span>
        </div>
      </div>

      {/* Center: Brand */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        {/* Orb-coloured gradient dot as mini logo mark */}
        <div className="size-[18px] shrink-0 rounded-full bg-linear-to-br from-[#CADCFC] to-[#8BA9C4] ring-1 ring-border/40 shadow-sm" />
        <h1 className="font-serif text-base font-bold tracking-tight text-foreground">
          Morph
        </h1>
      </div>

      {/* Right: New session + User dropdown */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewSession}
          className="text-muted-foreground hover:text-foreground"
          aria-label="New session"
          title="New Session"
        >
          <PlusIcon className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-7 cursor-pointer border border-border transition-opacity hover:opacity-80">
              {user?.photoURL ? (
                <AvatarImage
                  src={user.photoURL}
                  alt={user.displayName ?? "User"}
                />
              ) : null}
              <AvatarFallback className="bg-card text-xs font-medium text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-2">
            {/* Profile section */}
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar className="size-10 shrink-0 border border-border">
                {user?.photoURL ? (
                  <AvatarImage
                    src={user.photoURL}
                    alt={user.displayName ?? "User"}
                  />
                ) : null}
                <AvatarFallback className="bg-card text-sm font-semibold text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold leading-none text-foreground">
                  {user?.displayName || "User"}
                </p>
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Credits badge */}
            {credits !== null && credits !== undefined && (
              <div className="mx-1 mt-1 mb-1 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pop-amber/15">
                  <ZapIcon className="size-3.5 text-pop-amber" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {credits} {credits === 1 ? "credit" : "credits"} remaining
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    used for Morph calls
                  </span>
                </div>
              </div>
            )}

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleSignOut}
                variant="destructive"
                className="gap-2"
              >
                <LogOutIcon className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
