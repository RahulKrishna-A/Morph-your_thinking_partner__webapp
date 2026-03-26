"use client";

import {
  CheckCircle2Icon,
  LoaderIcon,
  MicIcon,
  PhoneOffIcon,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  InlineAudioPlayer,
  VmResponsePlayer,
} from "@/components/ui/audio-player";
import type { AgentState } from "@/components/ui/orb";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  messages: ChatMessage[];
  agentState: AgentState;
  isStreaming?: boolean;
  statusText?: string | null;
}

/* InlineAudioPlayer and VmResponsePlayer are imported from @/components/ui/audio-player */

/* ─── Status divider ─── */
function StatusDivider({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Separator className="flex-1" />
      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        {icon}
        {text}
      </span>
      <Separator className="flex-1" />
    </div>
  );
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
              {messages.map((message) => {
                // Status dividers
                if (message.type === "status") {
                  const isCompleted =
                    message.content === "Call has ended" ||
                    message.content === "Call has completed" ||
                    message.content === "Session completed";
                  const isProcessing =
                    message.content.toLowerCase().includes("processing") ||
                    message.content.toLowerCase().includes("thinking") ||
                    message.content.toLowerCase().includes("transcribing") ||
                    message.content.toLowerCase().includes("researching") ||
                    message.content.toLowerCase().includes("building") ||
                    message.content.toLowerCase().includes("received");

                  return (
                    <StatusDivider
                      key={message.id}
                      icon={
                        isCompleted ? (
                          <CheckCircle2Icon className="size-3 text-muted-foreground" />
                        ) : isProcessing ? (
                          <LoaderIcon className="size-3 animate-spin text-pop-amber" />
                        ) : (
                          <PhoneOffIcon className="size-3" />
                        )
                      }
                      text={message.content}
                    />
                  );
                }

                // VM Response — compact voice bubble, assistant-aligned
                if (message.type === "vm-response" && message.audioUrl) {
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-full flex-col gap-1",
                        "animate-in fade-in slide-in-from-bottom-2 duration-300"
                      )}
                    >
                      <Message from="assistant">
                        <VmResponsePlayer url={message.audioUrl} />
                        <div className="ring-border size-7 shrink-0 self-end overflow-hidden rounded-full ring-1">
                          <Orb className="size-full" agentState={null} />
                        </div>
                      </Message>
                    </div>
                  );
                }

                // Regular messages
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full flex-col gap-1",
                      "animate-in fade-in slide-in-from-bottom-2 duration-300"
                    )}
                  >
                    <Message from={message.role}>
                      <MessageContent
                        variant={
                          message.role === "assistant" ? "flat" : "contained"
                        }
                        className="max-w-full min-w-0"
                      >
                        {/* Audio dump */}
                        {message.type === "audio-dump" ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <MicIcon className="size-4 text-pop-rose" />
                              <Response className="w-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                                {message.content}
                              </Response>
                            </div>
                            {message.audioUrl && (
                              <InlineAudioPlayer
                                url={message.audioUrl}
                                label="Your voice recording"
                              />
                            )}
                          </div>
                        ) : (
                          <Response className="w-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {message.content}
                          </Response>
                        )}
                      </MessageContent>

                      {/* Assistant Orb avatar */}
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
                );
              })}

              {/* Live status indicator */}
              {statusText && (
                <div className="flex items-center gap-3 py-2 animate-in fade-in duration-500">
                  <div className="ring-border size-8 shrink-0 overflow-hidden rounded-full ring-1 shadow-sm">
                    <Orb className="size-full" agentState={agentState} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <ShimmeringText
                      text={statusText}
                      className="text-sm text-muted-foreground"
                    />
                    {agentState && (
                      <Badge
                        variant="outline"
                        className="w-fit border-border text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
                      >
                        {agentState}
                      </Badge>
                    )}
                  </div>
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
