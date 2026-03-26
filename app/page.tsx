"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
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
  const [credits, setCredits] = useState<number | null>(null);

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

  // Real-time credits listener
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "User", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCredits(typeof data.credits === "number" ? data.credits : 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Hooks
  const {
    sessions,
    sessionId,
    sessionDocStatus,
    audioUrl,
    vmUrl,
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
    callAgent,
    endCall,
    resetCallState,
    conversation,
  } = useAgentCall();

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
      createNewSession();
    }
    await startRecording();
  }, [sessionId, createNewSession, startRecording]);

  // Handle re-record
  const handleReRecord = useCallback(() => {
    resetRecording();
  }, [resetRecording]);

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

    const isCompleted = sessionDocStatus === "completed" || sessionDocStatus === "complete";

    if (
      recordingState === "submitted" ||
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "transcribing" ||
      sessionDocStatus === "processing" ||
      sessionDocStatus === "ready_for_call" ||
      sessionDocStatus === "in_call" ||
      sessionDocStatus === "call_in_progress" ||
      sessionDocStatus === "processing_research" ||
      sessionDocStatus === "building_vm" ||
      isCompleted ||
      audioUrl
    ) {
      msgs.push({
        id: "audio-dump",
        role: "user",
        content: "Your thoughts have been sent",
        type: "audio-dump",
        audioUrl: audioUrl ?? undefined,
      });
    }

    const intermediateStatusMessages: Record<string, string> = {
      recording_submitted: "Morph is processing your thoughts...",
      transcribing: "Morph is transcribing your thoughts...",
      processing: "Morph is thinking about what you said...",
      ready_for_call: "Ready to talk with Morph",
      in_call: "Putting your plan together...",
      call_in_progress: "Putting your plan together...",
      processing_research: "Morph is researching your plan...",
      building_vm: "Morph is building your voice memo...",
    };

    if (
      sessionDocStatus &&
      !isCompleted &&
      callState === "idle"
    ) {
      const content = intermediateStatusMessages[sessionDocStatus];
      if (content) {
        msgs.push({
          id: "status-current",
          role: "assistant",
          content,
          type: "status",
        });
      }
    }

    msgs.push(...agentMessages);

    if (isCompleted) {
      msgs.push({
        id: "status-completed",
        role: "assistant",
        content: "Call has ended",
        type: "status",
      });
    }

    if (vmUrl) {
      msgs.push({
        id: "vm-intro",
        role: "assistant",
        content:
          "I've gone through everything you shared and put together your plan for the day.",
        type: "text",
      });
      msgs.push({
        id: "vm-response",
        role: "assistant",
        content: "Here's my voice response for you",
        type: "vm-response",
        audioUrl: vmUrl,
      });
    }

    return msgs;
  }, [recordingState, sessionDocStatus, audioUrl, agentMessages, vmUrl, callState]);

  const statusText = useMemo<string | null>(() => {
    if (recordingState === "uploading") return "Sending your thoughts...";
    if (
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "transcribing"
    )
      return "Transcribing your thoughts...";
    if (sessionDocStatus === "processing")
      return "Morph is thinking about what you said...";
    if (callState === "calling") return "Connecting to Morph...";
    if (callState === "in_call" && conversation.isSpeaking)
      return "Morph is speaking...";
    if (callState === "in_call") return "Listening to you...";
    if (sessionDocStatus === "ready_for_call") return "Ready to talk!";
    if (
      (sessionDocStatus === "in_call" || sessionDocStatus === "call_in_progress") &&
      callState === "idle"
    )
      return "Putting your plan together...";
    if (sessionDocStatus === "processing_research")
      return "Researching and building your plan...";
    if (sessionDocStatus === "building_vm")
      return "Building your voice memo...";
    if (sessionDocStatus === "completed" || sessionDocStatus === "complete")
      return null;
    return null;
  }, [recordingState, sessionDocStatus, callState, conversation.isSpeaking]);

  const agentState = useMemo<AgentState>(() => {
    if (callState === "calling") return "thinking";
    if (callState === "in_call" && conversation.isSpeaking) return "talking";
    if (callState === "in_call") return "listening";
    if (
      (sessionDocStatus === "in_call" || sessionDocStatus === "call_in_progress") &&
      callState === "idle"
    )
      return "thinking";
    if (
      sessionDocStatus === "recording_submitted" ||
      sessionDocStatus === "transcribing" ||
      sessionDocStatus === "processing"
    )
      return "thinking";
    if (sessionDocStatus === "processing_research") return "thinking";
    if (sessionDocStatus === "building_vm") return "thinking";
    return null;
  }, [callState, conversation.isSpeaking, sessionDocStatus]);

  useEffect(() => {
    if (
      (sessionDocStatus === "completed" || sessionDocStatus === "complete") &&
      (callState === "in_call" || callState === "calling")
    ) {
      endCall();
    }
  }, [sessionDocStatus, callState, endCall]);

  // Auto-create session on first load
  useEffect(() => {
    if (user && !sessionId && !authLoading) {
      createNewSession();
    }
  }, [user, sessionId, authLoading, createNewSession]);

  if (authLoading) return null;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader
        user={user}
        onMenuOpen={() => setSidebarOpen(true)}
        onNewSession={handleNewSession}
        sessionStatus={sessionDocStatus}
        callState={callState}
        credits={credits}
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
        audioUrl={audioUrl}
        localPreviewUrl={localAudioPreviewUrl}
        onStartRecording={handleStartRecording}
        onStopRecording={stopRecording}
        onSubmitRecording={handleSubmitRecording}
        onReRecord={handleReRecord}
        onCallAgent={handleCallAgent}
        onEndCall={endCall}
      />

      <AppSidebar
        user={user}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        credits={credits}
      />
    </div>
  );
}
