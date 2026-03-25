"use client";

import type { ChatMessage } from "@/lib/types";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Orb } from "@/components/ui/orb";
import { Response } from "@/components/ui/response";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import type { AgentState } from "@/components/ui/orb";

interface ChatViewProps {
  messages: ChatMessage[];
  agentState: AgentState;
  isStreaming?: boolean;
  statusText?: string | null;
}

export function ChatView({
  messages,
  agentState,
  isStreaming,
  statusText,
}: ChatViewProps) {
  const hasMessages = messages.length > 0 || !!statusText;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Conversation className="h-full">
        <ConversationContent className="flex min-w-0 flex-col gap-3 p-4 pb-2">
          {!hasMessages ? (
            <ConversationEmptyState
              icon={
                <div className="size-20 overflow-hidden rounded-full">
                  <Orb className="size-full" agentState={null} />
                </div>
              }
              title="What's on your mind?"
              description="Record your thoughts, then talk with Morph"
            />
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="flex w-full flex-col gap-1">
                  <Message from={message.role}>
                    <MessageContent
                      variant={
                        message.role === "assistant" ? "flat" : "contained"
                      }
                      className="max-w-full min-w-0"
                    >
                      <Response className="w-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {message.content}
                      </Response>
                    </MessageContent>
                    {message.role === "assistant" && (
                      <div className="ring-border size-7 shrink-0 self-end overflow-hidden rounded-full ring-1">
                        <Orb
                          className="size-full"
                          agentState={
                            isStreaming &&
                            message.id === messages[messages.length - 1]?.id
                              ? "talking"
                              : null
                          }
                        />
                      </div>
                    )}
                  </Message>
                </div>
              ))}

              {/* Live status indicator */}
              {statusText && (
                <div className="flex items-center gap-3 py-2">
                  <div className="ring-border size-7 shrink-0 overflow-hidden rounded-full ring-1">
                    <Orb className="size-full" agentState={agentState} />
                  </div>
                  <ShimmeringText
                    text={statusText}
                    className="text-sm text-muted-foreground"
                  />
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}
