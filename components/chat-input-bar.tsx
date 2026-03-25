"use client";

import { MicIcon, PhoneIcon, PhoneOffIcon, SendIcon } from "lucide-react";
import type { RecordingState, CallState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
  recordingState: RecordingState;
  callState: CallState;
  sessionDocStatus: string | null;
  hasSession: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitRecording: () => void;
  onCallAgent: () => void;
  onEndCall: () => void;
}

export function ChatInputBar({
  recordingState,
  callState,
  sessionDocStatus,
  hasSession,
  onStartRecording,
  onStopRecording,
  onSubmitRecording,
  onCallAgent,
  onEndCall,
}: ChatInputBarProps) {
  const isRecording = recordingState === "recording";
  const isRecorded = recordingState === "recorded";
  const isUploading = recordingState === "uploading";
  const isCallActive = callState === "in_call";
  const canCallAgent = sessionDocStatus === "ready_for_call";
  const isCalling = callState === "calling";

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl">
      {/* Waveform when recording */}
      {isRecording && (
        <div className="border-b border-border px-4 py-3">
          <LiveWaveform
            active={isRecording}
            height={48}
            barWidth={3}
            barGap={2}
            mode="static"
            fadeEdges
            barColor="#a1a1a1"
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Recording flow */}
        {!isCallActive && !canCallAgent && callState !== "calling" && (
          <>
            {isRecorded ? (
              <Button
                onClick={onSubmitRecording}
                disabled={isUploading}
                className="gap-2 rounded-full px-6"
              >
                <SendIcon className="size-4" />
                {isUploading ? "Uploading..." : "Submit Recording"}
              </Button>
            ) : (
              <Button
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={!hasSession}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={cn(
                  "gap-2 rounded-full px-6 transition-all",
                  isRecording && "animate-pulse"
                )}
              >
                <MicIcon className="size-5" />
                {isRecording ? "Stop Recording" : "Record Thoughts"}
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
            className="gap-2 rounded-full bg-green-600 px-6 text-white hover:bg-green-700"
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
            className="gap-2 rounded-full px-6"
          >
            <PhoneOffIcon className="size-5" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
}
