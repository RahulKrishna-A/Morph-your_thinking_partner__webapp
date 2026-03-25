"use client";

import { useEffect, useRef, useState } from "react";
import {
  MicIcon,
  PhoneIcon,
  PhoneOffIcon,
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  SendIcon,
  SquareIcon,
} from "lucide-react";
import type { RecordingState, CallState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
  recordingState: RecordingState;
  callState: CallState;
  sessionDocStatus: string | null;
  hasSession: boolean;
  audioUrl: string | null;
  localPreviewUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitRecording: () => void;
  onReRecord: () => void;
  onCallAgent: () => void;
  onEndCall: () => void;
}

function RecordingTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="tabular-nums text-sm font-medium text-pop-rose">
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

function MiniPreviewPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onEnded={() => setPlaying(false)}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="size-8 rounded-full bg-card text-muted-foreground hover:text-foreground"
        aria-label={playing ? "Pause preview" : "Play preview"}
      >
        {playing ? (
          <PauseIcon className="size-3.5" />
        ) : (
          <PlayIcon className="size-3.5" />
        )}
      </Button>
    </>
  );
}

export function ChatInputBar({
  recordingState,
  callState,
  sessionDocStatus,
  hasSession,
  audioUrl,
  localPreviewUrl,
  onStartRecording,
  onStopRecording,
  onSubmitRecording,
  onReRecord,
  onCallAgent,
  onEndCall,
}: ChatInputBarProps) {
  const isRecording = recordingState === "recording";
  const isRecorded = recordingState === "recorded";
  const isUploading = recordingState === "uploading";
  const isCallActive = callState === "in_call";
  const canCallAgent = sessionDocStatus === "ready_for_call";
  const isCalling = callState === "calling";
  const isCompleted = sessionDocStatus === "completed";

  // Record Thoughts is one-time per session — hide it once any recording exists
  // (either locally submitted or already on the session doc via audioUrl/status).
  const hasSubmittedRecording =
    recordingState === "submitted" ||
    !!audioUrl ||
    (sessionDocStatus !== null && sessionDocStatus !== "completed");

  // Don't show the bar when session is fully completed
  const showCompletedHint =
    isCompleted && callState === "idle" && recordingState !== "recording";

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl">
      {/* Waveform when recording */}
      {isRecording && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
            </span>
            <RecordingTimer active={isRecording} />
          </div>
          <div className="flex-1">
            <LiveWaveform
              active={isRecording}
              height={40}
              barWidth={3}
              barGap={2}
              mode="static"
              fadeEdges
              barColor="#a1a1a1"
            />
          </div>
        </div>
      )}

      {/* Review bar after recording stopped */}
      {isRecorded && localPreviewUrl && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <MiniPreviewPlayer url={localPreviewUrl} />
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">
              Recording ready
            </span>
            <span className="text-xs text-muted-foreground">
              Preview, re-record, or send
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Recording flow — hidden once submitted or session is beyond recording */}
        {!isCallActive &&
          !canCallAgent &&
          callState !== "calling" &&
          !showCompletedHint &&
          !hasSubmittedRecording && (
            <>
              {isRecorded ? (
                <div className="flex items-center gap-2">
                  {/* Re-record */}
                  <Button
                    onClick={onReRecord}
                    variant="ghost"
                    size="lg"
                    className="gap-2 rounded-full border border-border px-5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcwIcon className="size-4" />
                    Re-record
                  </Button>

                  {/* Send */}
                  <Button
                    onClick={onSubmitRecording}
                    disabled={isUploading}
                    size="lg"
                    className="gap-2 rounded-full border-2 border-foreground bg-foreground px-6 text-background shadow-[3px_4px_0px_theme(--color-border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_theme(--color-border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                  >
                    {isUploading ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <SendIcon className="size-4" />
                    )}
                    {isUploading ? "Sending..." : "Send Thoughts"}
                  </Button>
                </div>
              ) : isRecording ? (
                <Button
                  onClick={onStopRecording}
                  variant="destructive"
                  size="lg"
                  className="gap-2 rounded-full px-6"
                >
                  <SquareIcon className="size-4 fill-current" />
                  Stop Recording
                </Button>
              ) : (
                <Button
                  onClick={onStartRecording}
                  disabled={!hasSession}
                  size="lg"
                  className="gap-2 rounded-full border-2 border-foreground bg-foreground px-6 text-background shadow-[3px_4px_0px_theme(--color-border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_theme(--color-border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
                >
                  <MicIcon className="size-5" />
                  Record Thoughts
                </Button>
              )}
            </>
          )}

        {/* Call Agent */}
        {canCallAgent && !isCallActive && (
          <Button
            onClick={onCallAgent}
            disabled={isCalling}
            size="lg"
            className="gap-2 rounded-full border-2 border-green-500 bg-green-600 px-6 text-white shadow-[3px_4px_0px_theme(--color-border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-green-700 hover:shadow-[2px_3px_0px_theme(--color-border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <PhoneIcon className="size-5" />
            {isCalling ? "Connecting..." : "Talk with Morph"}
          </Button>
        )}

        {/* End Call */}
        {isCallActive && (
          <Button
            onClick={onEndCall}
            variant="destructive"
            size="lg"
            className="gap-2 rounded-full px-6 shadow-[3px_4px_0px_theme(--color-border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_theme(--color-border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <PhoneOffIcon className="size-5" />
            End Call
          </Button>
        )}

        {/* Completed session hint */}
        {showCompletedHint && (
          <p className="text-center text-xs text-muted-foreground">
            Session complete — start a new one from{" "}
            <span className="font-medium text-foreground">+</span> above
          </p>
        )}
      </div>
    </div>
  );
}
