"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ZapIcon, XIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; message: string; xHandle?: string }) => void;
}

export function NoCreditsModal({
  open,
  onOpenChange,
  onSubmit,
}: NoCreditsModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    onSubmit({
      email: email.trim(),
      message: message.trim(),
      xHandle: xHandle.trim() || undefined,
    });
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (submitted) {
      setTimeout(() => {
        setEmail("");
        setMessage("");
        setXHandle("");
        setSubmitted(false);
      }, 300);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[6px_8px_0px_theme(--color-border)]">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-pop-rose/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-40 rounded-full bg-pop-amber/10 blur-[80px]" />

            {/* Close button */}
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
                />
              }
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div className="relative p-6">
              {!submitted ? (
                <>
                  {/* Icon badge */}
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border-2 border-border bg-pop-amber/10 shadow-[3px_4px_0px_theme(--color-border)]">
                    <ZapIcon className="size-6 text-pop-amber" />
                  </div>

                  {/* Heading */}
                  <div className="mb-6 text-center">
                    <Dialog.Title className="font-serif text-2xl font-bold tracking-tight text-foreground">
                      Credits Used Up
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                      You&apos;ve used all your free credits. Drop us a message
                      and we&apos;ll get you set up with more.
                    </Dialog.Description>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label
                        htmlFor="nc-email"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="nc-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="block w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 shadow-[2px_3px_0px_theme(--color-border)] transition-all focus:border-pop-rose focus:shadow-[2px_3px_0px_theme(--color-pop-rose)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="nc-message"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        Message
                      </label>
                      <textarea
                        id="nc-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how you're using Morph..."
                        required
                        rows={3}
                        className="block w-full resize-none rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 shadow-[2px_3px_0px_theme(--color-border)] transition-all focus:border-pop-rose focus:shadow-[2px_3px_0px_theme(--color-pop-rose)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="nc-x-handle"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        X Handle{" "}
                        <span className="text-muted-foreground/50">
                          — optional (easier to communicate)
                        </span>
                      </label>
                      <input
                        type="text"
                        id="nc-x-handle"
                        value={xHandle}
                        onChange={(e) => setXHandle(e.target.value)}
                        placeholder="@yourhandle"
                        className="block w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 shadow-[2px_3px_0px_theme(--color-border)] transition-all focus:border-pop-rose focus:shadow-[2px_3px_0px_theme(--color-pop-rose)] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!email.trim() || !message.trim()}
                      className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-[4px_5px_0px_theme(--color-border)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_3px_0px_theme(--color-border)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
                    >
                      <SendIcon className="size-4" />
                      Request More Credits
                    </button>
                  </form>
                </>
              ) : (
                /* Success state */
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border-2 border-border bg-green-500/10 shadow-[3px_4px_0px_theme(--color-border)]">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground">
                    Request Sent!
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&apos;ll get back to you shortly. Thanks for using Morph!
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-border px-5 py-2.5 text-sm font-medium text-foreground shadow-[3px_4px_0px_theme(--color-border)] transition-all hover:translate-x-px hover:translate-y-px hover:shadow-[2px_3px_0px_theme(--color-border)]"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
