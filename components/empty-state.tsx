"use client";

import { Orb } from "@/components/ui/orb";
import type { AgentState } from "@/components/ui/orb";

interface EmptyStateProps {
  agentState: AgentState;
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0" />
    </svg>
  );
}

function getStatusLabel(state: AgentState): string {
  switch (state) {
    case "thinking":
      return "THINKING";
    case "listening":
      return "LISTENING";
    case "talking":
      return "TALKING";
    default:
      return "IDLE";
  }
}

export function EmptyState({ agentState }: EmptyStateProps) {
  const statusLabel = getStatusLabel(agentState);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-20 left-10 -z-10 size-64 rounded-full bg-pop-rose/5 blur-3xl" />
      <div className="pointer-events-none absolute right-10 bottom-40 -z-10 size-80 rounded-full bg-pop-amber/10 blur-3xl" />

      {/* Heading */}
      <header className="relative text-center">
        <h1 className="font-serif text-[42px] leading-[0.95] font-bold tracking-tight text-foreground">
          Checking in
          <br />
          <span className="font-serif text-[36px] italic text-muted-foreground">
            on morph
          </span>
        </h1>
        <Sparkle className="absolute -top-2 -right-6 size-6 animate-float text-pop-rose" />
      </header>

      {/* Script subtitle */}
      <p className="-mt-1 -rotate-2 font-script text-[28px] text-pop-rose">
        what&apos;s on your mind? put it out
      </p>

      {/* Device / Orb section */}
      <div className="relative mt-4">
        {/* Floating emojis */}
        <span
          className="absolute -top-8 -left-10 animate-float text-4xl drop-shadow-sm select-none"
          aria-hidden="true"
        >
          🍓
        </span>
        <span
          className="absolute -right-8 -top-12 animate-float-delayed text-4xl drop-shadow-sm select-none"
          aria-hidden="true"
        >
          🪴
        </span>
        <span
          className="absolute -bottom-6 -right-6 animate-float-slow text-3xl drop-shadow-sm select-none"
          aria-hidden="true"
        >
          ☕️
        </span>

        {/* Device shell */}
        <div className="relative -rotate-1 rounded-[32px] border-2 border-border bg-card p-5 shadow-[8px_12px_0px_theme(--color-border)]">
          {/* Antenna nub */}
          <div className="absolute -top-5 left-10 flex flex-col items-center">
            <div className="size-2.5 rounded-full border-2 border-card bg-pop-rose shadow-sm" />
            <div className="h-4 w-1 rounded-t-full bg-border" />
          </div>

          {/* LCD Screen with Orb */}
          <div className="relative flex h-[140px] w-[220px] items-center justify-center overflow-hidden rounded-2xl border-[3px] border-foreground/20 bg-lcd-bg shadow-[inset_3px_4px_10px_rgba(0,0,0,0.3)]">
            {/* Scanlines overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.06))",
                backgroundSize: "100% 4px",
              }}
            />
            {/* Glare */}
            <div className="pointer-events-none absolute -top-10 -right-10 z-10 h-48 w-24 rotate-45 bg-white/10" />

            {/* Orb inside */}
            <div className="relative z-0 size-24 overflow-hidden rounded-full">
              <Orb className="size-full" agentState={agentState} />
            </div>
          </div>

          {/* Device bottom details */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex gap-2">
              <div className="size-2.5 rounded-full bg-border shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]" />
              <div className="size-2.5 rounded-full bg-pop-rose shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-1 w-10 rounded-full bg-border" />
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute -bottom-7 -right-3 z-20 flex rotate-[8deg] flex-col items-center rounded-xl border-2 border-foreground bg-card px-4 py-2 shadow-[3px_4px_0px_theme(--color-foreground)]">
            <span className="font-serif text-sm leading-none italic text-muted-foreground">
              currently
            </span>
            <span className="mt-0.5 text-2xl font-bold leading-none tracking-widest text-foreground">
              {statusLabel}
            </span>
            <Sparkle className="absolute -top-3 -left-3 size-5 -rotate-12 text-pop-amber drop-shadow-sm" />
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <p className="mt-10 max-w-[240px] text-center text-sm text-muted-foreground">
        Tap{" "}
        <span className="font-semibold text-foreground">Record Thoughts</span>{" "}
        below to begin your brain dump
      </p>
    </div>
  );
}
