"use client";

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for name setup
  const [step, setStep] = useState<'login' | 'name-setup'>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user doc exists in /User/{uid}
      const userRef = doc(db, 'User', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data()?.name) {
        // User exists and has a name
        router.push('/');
      } else {
        // User needs to set their name, prompt them
        setUserId(user.uid);
        setName(user.displayName || '');
        setStep('name-setup');
      }
    } catch (err: any) {
      console.error("Error logging in with Google", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || "Failed to log in with Google");
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

      const userRef = doc(db, 'User', userId);
      // Merge: true allows us to preserve other fields if the doc existed but name didn't
      await setDoc(userRef, { name: name.trim() }, { merge: true });

      // After saving, redirect
      router.push('/');
    } catch (err: any) {
      console.error("Error saving user name", err);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black selection:bg-white/30">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-black to-black" />
      <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/20 blur-[100px]" />
      
      <div className="z-10 w-full max-w-md p-6 sm:p-8">
        <div className="group relative overflow-hidden rounded-3xl bg-zinc-950/40 p-8 shadow-2xl backdrop-blur-xl border border-white/10 ring-1 ring-white/10 transition-all duration-500 hover:ring-white/20">
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="relative z-10">
            {step === 'login' && (
              <>
                <div className="mb-10 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-900 shadow-xl ring-1 ring-white/10">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                    Welcome Back
                  </h1>
                  <p className="mt-3 text-sm text-zinc-400">
                    Log in to Morph, your thinking partner.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 text-center shadow-inner backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:grayscale sm:text-base active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-zinc-900 border-t-2"></div>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                      <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                      <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                      <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <p className="mt-8 text-center text-xs text-zinc-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </>
            )}

            {step === 'name-setup' && (
              <form onSubmit={handleSaveName} className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8 text-center">
                  <h2 className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                    Just one more step
                  </h2>
                  <p className="mt-3 text-sm text-zinc-400">
                    What should we call you?
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 text-center shadow-inner backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="sr-only">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="block w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3.5 text-white placeholder-zinc-500 shadow-sm ring-1 ring-inset ring-transparent transition-all hover:bg-zinc-900 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:grayscale sm:text-base active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-zinc-900 border-t-2"></div>
                    ) : (
                      <span>Complete Profile</span>
                    )}
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
