"use client";

import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useConversation } from "@elevenlabs/react";
import type { CallState, ChatMessage } from "@/lib/types";

const CALL_AGENT_URL =
  "https://us-central1-morph-thinking-partner.cloudfunctions.net/onAgentCall";

export function useAgentCall() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [elevenConversationId, setElevenConversationId] = useState<
    string | null
  >(null);
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const callStateRef = useRef<CallState>("idle");

  // Auto-end when the agent disconnects
  const conversation = useConversation({
    onDisconnect: () => {
      // Only add status message if we were actually in a call
      if (callStateRef.current === "in_call" || callStateRef.current === "calling") {
        setCallState("idle");
        callStateRef.current = "idle";
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `call-ended-${Date.now()}`,
            role: "assistant",
            content: "Call has completed",
            type: "status",
          },
        ]);
      }
    },
  });

  const callAgent = useCallback(
    async (sessionId: string, userId: string) => {
      try {
        setCallState("calling");
        setAgentMessages([]);

        const response = await axios.post(CALL_AGENT_URL, {
          sessionId,
          userId,
        });

        const conversationToken = response.data?.conversationToken as string;
        const agentContext = response.data?.agentContext as string;

        // Request mic permission before starting the WebRTC session, then
        // immediately release this stream — ElevenLabs manages its own internally.
        const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permStream.getTracks().forEach((t) => t.stop());

        const startedConversationId = await conversation.startSession({
          conversationToken,
          connectionType: "webrtc",
          dynamicVariables: {
            greeting: "good morning",
            morph_context: agentContext,
            userId: userId,
            sessionId: sessionId,
          },
        });

        setElevenConversationId(startedConversationId);
        setCallState("in_call");
        callStateRef.current = "in_call";
      } catch (error) {
        console.error("Failed to call agent", error);
        setCallState("error");
      }
    },
    [conversation]
  );

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
      // onDisconnect callback will handle state cleanup
    } catch (error) {
      console.error("Failed to end call", error);
    }
  }, [conversation]);

  const resetCallState = useCallback(() => {
    setCallState("idle");
    callStateRef.current = "idle";
    setElevenConversationId(null);
    setAgentMessages([]);
  }, []);

  return {
    callState,
    elevenConversationId,
    agentMessages,
    setAgentMessages,
    callAgent,
    endCall,
    resetCallState,
    conversation,
  };
}
