export type RecordingState =
  | "idle"
  | "recording"
  | "recorded"
  | "uploading"
  | "submitted"
  | "error";

export type CallState = "idle" | "calling" | "in_call" | "error";

export type SessionStatus =
  | "recording_submitted"
  | "processing"
  | "ready_for_call"
  | "in_call"
  | "completed";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "audio-dump" | "status" | "text" | "vm-response";
  audioUrl?: string;
  timestamp?: Date;
};

export type SessionItem = {
  sessionId: string;
  status?: string;
  createdAt?: Date;
  dumpAudioUrl?: string;
  vmUrl?: string;
};
