"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import { useConversation } from "@elevenlabs/react";
import type { CallState, ChatMessage } from "@/lib/types";

const CALL_AGENT_URL =
  "https://us-central1-morph-thinking-partner.cloudfunctions.net/onAgentCall";

export function useAgentCall() {
  const conversation = useConversation();
  const [callState, setCallState] = useState<CallState>("idle");
  const [elevenConversationId, setElevenConversationId] = useState<
    string | null
  >(null);
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);

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

        await navigator.mediaDevices.getUserMedia({ audio: true });

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
      setCallState("idle");
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `call-ended-${Date.now()}`,
          role: "assistant",
          content: "Call has completed",
          type: "status",
        },
      ]);
    } catch (error) {
      console.error("Failed to end call", error);
    }
  }, [conversation]);

  const resetCallState = useCallback(() => {
    setCallState("idle");
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
