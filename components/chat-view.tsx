"use client";

import { PhoneOffIcon } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { EmptyState } from "@/components/empty-state";
import { Message, MessageContent } from "@/components/ui/message";
import { Orb } from "@/components/ui/orb";
import { Response } from "@/components/ui/response";
import { Separator } from "@/components/ui/separator";
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
            <EmptyState agentState={agentState} />
          ) : (
            <>
            {messages.map((message) =>
                message.type === "status" ? (
                  <div
                    key={message.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Separator className="flex-1" />
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <PhoneOffIcon className="size-3" />
                      {message.content}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className="flex w-full flex-col gap-1"
                  >
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
                )
              )}

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
