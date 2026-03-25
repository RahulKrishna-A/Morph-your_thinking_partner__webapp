"use client";

import { useCallback, useRef, useState } from "react";
import type { RecordingState } from "@/lib/types";

export function useRecording() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [localAudioPreviewUrl, setLocalAudioPreviewUrl] = useState<
    string | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const resetRecording = useCallback(() => {
    if (localAudioPreviewUrl) {
      URL.revokeObjectURL(localAudioPreviewUrl);
    }
    setRecordingBlob(null);
    setLocalAudioPreviewUrl(null);
    setRecordingState("idle");
  }, [localAudioPreviewUrl]);

  const startRecording = useCallback(async () => {
    try {
      if (localAudioPreviewUrl) {
        URL.revokeObjectURL(localAudioPreviewUrl);
      }
      setRecordingBlob(null);
      setLocalAudioPreviewUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingBlob(blob);
        setLocalAudioPreviewUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Could not start recording", error);
      setRecordingState("error");
    }
  }, [localAudioPreviewUrl]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return {
    recordingState,
    setRecordingState,
    recordingBlob,
    localAudioPreviewUrl,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
