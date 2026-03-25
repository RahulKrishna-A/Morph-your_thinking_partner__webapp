"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Orb } from "@/components/ui/orb";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<"login" | "name-setup">("login");
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "User", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data()?.name) {
        router.push("/");
      } else {
        setUserId(user.uid);
        setName(user.displayName || "");
        setStep("name-setup");
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      console.error("Error logging in with Google", err);
      if (firebaseErr.code !== "auth/popup-closed-by-user") {
        setError(firebaseErr.message || "Failed to log in with Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const userRef = doc(db, "User", userId);
      await setDoc(userRef, { name: name.trim() }, { merge: true });
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Error saving user name", err);
      setError(
        firebaseErr.message ||
          "Failed to save your profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 selection:bg-pop-rose/30">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-1/4 -left-20 size-[400px] rounded-full bg-pop-rose/8 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 size-[500px] rounded-full bg-pop-amber/6 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-[80px]" />

      {/* Floating emojis */}
      <span
        className="pointer-events-none absolute top-[15%] left-[10%] animate-float text-3xl opacity-60 select-none sm:text-4xl"
        aria-hidden="true"
      >
        🧠
      </span>
      <span
        className="pointer-events-none absolute top-[20%] right-[12%] animate-float-delayed text-2xl opacity-50 select-none sm:text-3xl"
        aria-hidden="true"
      >
        🪴
      </span>
      <span
        className="pointer-events-none absolute bottom-[18%] left-[15%] animate-float-slow text-2xl opacity-50 select-none sm:text-3xl"
        aria-hidden="true"
      >
        ☕️
      </span>
      <span
        className="pointer-events-none absolute right-[18%] bottom-[25%] animate-float text-xl opacity-40 select-none sm:text-2xl"
        aria-hidden="true"
        style={{ animationDelay: "2s" }}
      >
        ✨
      </span>

      {/* Sparkle decorations */}
      <Sparkle className="pointer-events-none absolute top-[30%] right-[25%] size-4 animate-float text-pop-rose/40" />
      <Sparkle className="pointer-events-none absolute bottom-[35%] left-[20%] size-3 animate-float-delayed text-pop-amber/50" />

      {/* Orb mascot */}
      <div className="relative mb-8">
        <div className="relative -rotate-1 rounded-[28px] border-2 border-border bg-card p-4 shadow-[6px_8px_0px_theme(--color-border)]">
          {/* Antenna */}
          <div className="absolute -top-4 left-8 flex flex-col items-center">
            <div className="size-2 rounded-full border-2 border-card bg-pop-rose shadow-sm" />
            <div className="h-3 w-1 rounded-t-full bg-border" />
          </div>

          {/* LCD screen with Orb */}
          <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-xl border-[3px] border-foreground/20 bg-lcd-bg shadow-[inset_2px_3px_8px_rgba(0,0,0,0.3)] sm:size-32">
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.06))",
                backgroundSize: "100% 4px",
              }}
            />
            <div className="pointer-events-none absolute -top-8 -right-8 z-10 h-32 w-16 rotate-45 bg-white/10" />
            <div className="relative z-0 size-20 overflow-hidden rounded-full sm:size-22">
              <Orb className="size-full" agentState={null} />
            </div>
          </div>

          {/* Device dots */}
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-border" />
              <div className="size-2 rounded-full bg-pop-rose" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="h-0.5 w-8 rounded-full bg-border" />
              <div className="h-0.5 w-8 rounded-full bg-border" />
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute -bottom-5 -right-2 z-10 flex rotate-[6deg] flex-col items-center rounded-lg border-2 border-foreground bg-card px-3 py-1.5 shadow-[2px_3px_0px_theme(--color-foreground)]">
          <span className="font-serif text-[11px] leading-none italic text-muted-foreground">
            your
          </span>
          <span className="text-lg font-bold leading-none tracking-wider text-foreground">
            MORPH
          </span>
          <Sparkle className="absolute -top-2 -left-2 size-3.5 -rotate-12 text-pop-amber" />
        </div>
      </div>

      {/* Content card */}
      <div className="z-10 w-full max-w-sm">
        <div className="relative z-10">
          {step === "login" && (
            <>
              {/* Heading */}
              <div className="mb-8 text-center">
                <h1 className="font-serif text-[38px] leading-[0.95] font-bold tracking-tight text-foreground sm:text-[44px]">
                  Hey there
                  <br />
                  <span className="font-serif text-[32px] italic text-muted-foreground sm:text-[36px]">
                    welcome in
                  </span>
                </h1>
                <p className="-rotate-1 font-script text-[24px] text-pop-rose sm:text-[28px]">
                  let&apos;s get thinking together
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Google sign-in */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-foreground px-5 py-4 text-base font-semibold text-background shadow-[4px_5px_0px_theme(--color-border)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_3px_0px_theme(--color-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pop-rose focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </>
          )}

          {step === "name-setup" && (
            <form onSubmit={handleSaveName}>
              <div className="mb-8 text-center">
                <h2 className="font-serif text-[32px] leading-[0.95] font-bold tracking-tight text-foreground sm:text-[38px]">
                  Almost there
                  <br />
                  <span className="font-serif text-[26px] italic text-muted-foreground sm:text-[30px]">
                    one more thing
                  </span>
                </h2>
                <p className="-rotate-1 font-script text-[22px] text-pop-rose sm:text-[26px]">
                  what should we call you?
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="sr-only">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="block w-full rounded-2xl border-2 border-border bg-card px-4 py-3.5 text-foreground placeholder-muted-foreground shadow-[3px_4px_0px_theme(--color-border)] transition-all focus:border-pop-rose focus:shadow-[3px_4px_0px_theme(--color-pop-rose)] focus:outline-none sm:text-base"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-foreground px-5 py-4 text-base font-semibold text-background shadow-[4px_5px_0px_theme(--color-border)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_3px_0px_theme(--color-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pop-rose focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="size-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <span>Let&apos;s go! →</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom home indicator */}
      <div className="fixed bottom-3 left-1/2 z-50 h-[5px] w-[120px] -translate-x-1/2 rounded-full bg-foreground/20" />
    </div>
  );
}
