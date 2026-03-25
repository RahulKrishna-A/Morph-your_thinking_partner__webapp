"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/firebase";
import type { ChatMessage } from "@/lib/types";
import { useSessions } from "@/hooks/use-sessions";
import { useRecording } from "@/hooks/use-recording";
import { useAgentCall } from "@/hooks/use-agent-call";
import { ChatHeader } from "@/components/chat-header";
import { ChatView } from "@/components/chat-view";
import { ChatInputBar } from "@/components/chat-input-bar";
import { AppSidebar } from "@/components/app-sidebar";
import type { AgentState } from "@/components/ui/orb";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        router.replace("/login");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Hooks
  const {
    sessions,
    sessionId,
    sessionDocStatus,
    audioUrl,
    createNewSession,
    selectSession,
    submitRecording,
  } = useSessions(user);

  const {
    recordingState,
    setRecordingState,
    recordingBlob,
    localAudioPreviewUrl,
    startRecording,
    stopRecording,
    resetRecording,
  } = useRecording();

  const {
    callState,
    agentMessages,
    setAgentMessages,
    callAgent,
    endCall,
    resetCallState,
    conversation,
  } = useAgentCall();

  // Listen to conversation messages from ElevenLabs
  useEffect(() => {
    // The useConversation hook manages messages internally
    // We subscribe to conversation status changes
    if (callState === "in_call" && conversation.status === "connected") {
      // Agent is active
    }
  }, [callState, conversation.status]);

  // Handle new session
  const handleNewSession = useCallback(() => {
    createNewSession();
    resetRecording();
    resetCallState();
  }, [createNewSession, resetRecording, resetCallState]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (id: string) => {
      selectSession(id);
      resetRecording();
      resetCallState();
    },
    [selectSession, resetRecording, resetCallState]
  );

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    if (!sessionId) {
      // Auto-create session if none
      createNewSession();
    }
    await startRecording();
  }, [sessionId, createNewSession, startRecording]);

  // Handle submit recording
  const handleSubmitRecording = useCallback(async () => {
    if (!recordingBlob) return;
    try {
      setRecordingState("uploading");
      await submitRecording(recordingBlob);
      setRecordingState("submitted");
    } catch (error) {
      console.error("Submit failed", error);
      setRecordingState("error");
    }
  }, [recordingBlob, setRecordingState, submitRecording]);

  // Handle call agent
  const handleCallAgent = useCallback(async () => {
    if (!user || !sessionId) return;
    await callAgent(sessionId, user.uid);
  }, [user, sessionId, callAgent]);

  // Build chat messages from current state
  const chatMessages = useMemo<ChatMessage[]>(() => {
    const msgs: ChatMessage[] = [];

    // Show audio dump as user message
    if (
      recordingState === "submitted" ||
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "processing" ||
      sessionDocStatus === "ready_for_call" ||
      sessionDocStatus === "in_call" ||
      sessionDocStatus === "completed" ||
      audioUrl
    ) {
      msgs.push({
        id: "audio-dump",
        role: "user",
        content: "🎤 Audio dump submitted",
        type: "audio-dump",
        audioUrl: audioUrl ?? undefined,
      });
    }

    // Show agent messages from the conversation
    msgs.push(...agentMessages);

    return msgs;
  }, [recordingState, sessionDocStatus, audioUrl, agentMessages]);

  // Determine status text for shimmer
  const statusText = useMemo<string | null>(() => {
    if (recordingState === "uploading") return "Uploading your thoughts...";
    if (
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "processing"
    )
      return "Processing your thoughts...";
    if (callState === "calling") return "Connecting to Morph...";
    if (callState === "in_call" && conversation.isSpeaking)
      return "Morph is speaking...";
    if (callState === "in_call") return "Listening...";
    if (sessionDocStatus === "ready_for_call") return "Ready to talk!";
    return null;
  }, [recordingState, sessionDocStatus, callState, conversation.isSpeaking]);

  // Determine orb agent state
  const agentState = useMemo<AgentState>(() => {
    if (callState === "calling") return "thinking";
    if (callState === "in_call" && conversation.isSpeaking) return "talking";
    if (callState === "in_call") return "listening";
    if (
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "processing"
    )
      return "thinking";
    return null;
  }, [callState, conversation.isSpeaking, sessionDocStatus]);

  // Auto-create session on first load if none
  useEffect(() => {
    if (user && !sessionId && !authLoading) {
      createNewSession();
    }
  }, [user, sessionId, authLoading, createNewSession]);

  if (authLoading) return null;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader
        onMenuOpen={() => setSidebarOpen(true)}
        onNewSession={handleNewSession}
      />

      <ChatView
        messages={chatMessages}
        agentState={agentState}
        isStreaming={callState === "in_call" && conversation.isSpeaking}
        statusText={statusText}
      />

      <ChatInputBar
        recordingState={recordingState}
        callState={callState}
        sessionDocStatus={sessionDocStatus}
        hasSession={!!sessionId}
        onStartRecording={handleStartRecording}
        onStopRecording={stopRecording}
        onSubmitRecording={handleSubmitRecording}
        onCallAgent={handleCallAgent}
        onEndCall={endCall}
      />

      <AppSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
      />
    </div>
  );
}
