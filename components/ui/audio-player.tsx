"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Static waveform shape (pseudo-random heights for visual realism) ─── */
const WAVEFORM = [
  30, 55, 80, 45, 70, 60, 35, 85, 50, 40,
  75, 35, 65, 85, 45, 55, 72, 38, 82, 60,
  42, 52, 33, 72, 88, 44, 62, 52, 35, 70,
];

/* ─── Hook ─── */
function useNativeAudioPlayer(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      cancelAnimationFrame(animRef.current);
    };
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.pause();
      cancelAnimationFrame(animRef.current);
      audioRef.current = null;
    };
  }, [src]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime);
      animRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play();
    setPlaying(true);
    animRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
  }, []);

  const toggle = useCallback(() => {
    playing ? pause() : play();
  }, [playing, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return { playing, buffering, duration, currentTime, progress, toggle, seek };
}

/* ─── Utility ─── */
function formatTime(secs: number) {
  if (!secs || !isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─── Waveform scrub bar ─── */
function WaveformScrubBar({
  progress,
  duration,
  onSeek,
  filledColor,
  emptyColor,
  className,
}: {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
  filledColor: string;
  emptyColor: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const total = WAVEFORM.length;

  const handleSeek = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el || duration <= 0) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
      onSeek(pct * duration);
    },
    [duration, onSeek]
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center gap-[2px] cursor-pointer touch-none select-none", className)}
      onPointerDown={(e) => {
        e.preventDefault();
        handleSeek(e.clientX);
        const onMove = (ev: PointerEvent) => handleSeek(ev.clientX);
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      {WAVEFORM.map((h, i) => {
        const barCenter = ((i + 0.5) / total) * 100;
        const filled = barCenter <= progress;
        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-75"
            style={{
              height: `${(h / 88) * 100}%`,
              backgroundColor: filled ? filledColor : emptyColor,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Spinner ─── */
function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   InlineAudioPlayer — user's sent voice recording
   Lives inside a white (primary) message bubble.
   ═══════════════════════════════════════════════════════════ */
export function InlineAudioPlayer({
  url,
  label,
}: {
  url: string;
  label?: string;
}) {
  const { playing, buffering, duration, currentTime, progress, toggle, seek } =
    useNativeAudioPlayer(url);

  const displayTime =
    playing || currentTime > 0
      ? formatTime(currentTime)
      : duration > 0
        ? formatTime(duration)
        : "--:--";

  return (
    <div className="mt-2 flex items-center gap-2.5">
      {/* Play / Pause */}
      <button
        onClick={toggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/16 active:bg-primary-foreground/22"
        aria-label={playing ? "Pause" : "Play"}
      >
        {buffering ? (
          <Spinner className="size-3.5" />
        ) : playing ? (
          <PauseIcon className="size-3.5" />
        ) : (
          <PlayIcon className="size-3.5 translate-x-px" />
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <WaveformScrubBar
          className="h-7"
          progress={progress}
          duration={duration}
          onSeek={seek}
          filledColor="rgba(10,10,10,0.72)"
          emptyColor="rgba(10,10,10,0.18)"
        />
        <span className="tabular-nums text-[10px] text-primary-foreground/50">
          {displayTime}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VmResponsePlayer — Morph's voice response
   Compact voice-message bubble, assistant-aligned.
   ═══════════════════════════════════════════════════════════ */
export function VmResponsePlayer({ url }: { url: string }) {
  const { playing, buffering, duration, currentTime, progress, toggle, seek } =
    useNativeAudioPlayer(url);

  const timeLabel =
    playing || currentTime > 0
      ? `${formatTime(currentTime)} / ${formatTime(duration)}`
      : duration > 0
        ? formatTime(duration)
        : "Loading…";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2.5 min-w-[200px] max-w-[260px]">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/85 active:bg-foreground/70"
          aria-label={playing ? "Pause" : "Play"}
        >
          {buffering ? (
            <Spinner className="size-3.5 border-background border-t-transparent" />
          ) : playing ? (
            <PauseIcon className="size-3.5" />
          ) : (
            <PlayIcon className="size-3.5 translate-x-px" />
          )}
        </button>

        {/* Waveform + time */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <WaveformScrubBar
            className="h-6"
            progress={progress}
            duration={duration}
            onSeek={seek}
            filledColor="var(--pop-rose)"
            emptyColor="rgba(120,120,120,0.18)"
          />
          <span className="tabular-nums text-[10px] text-muted-foreground">
            {timeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
