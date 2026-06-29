"use client";

import { useState, useEffect } from "react";
import { signInWithGoogle } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }
  }, []);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials");
      }
      
      // Force a full reload to apply auth state
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-text-secondary">
          Sign in to continue building your career orbit.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {showEmailForm ? (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <Input 
            label="Email"
            type="email" 
            placeholder="name@company.com" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftAddon={<Mail className="h-4 w-4" />}
            required
          />
          <Input 
            label="Password"
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            leftAddon={<Lock className="h-4 w-4" />}
            required
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full"
          >
            Sign in with Email
          </Button>
          <button 
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="w-full text-sm text-text-secondary hover:text-foreground mt-2"
          >
            &larr; Back to Google Login
          </button>
        </form>
      ) : (
        <>
          <form action={handleGoogleSignIn}>
            <Button
              type="submit"
              variant="secondary"
              isLoading={loading}
              leftIcon={
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              }
              className="group relative w-full overflow-hidden border border-border bg-white/80 text-foreground shadow-[0_14px_34px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-white hover:text-foreground hover:shadow-[0_18px_40px_rgba(255,0,61,0.28)] dark:bg-white/5 dark:hover:bg-white/10 before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
            >
              Continue with Google
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="relative w-full flex items-center py-2">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-text-secondary">or</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>
            
            <button 
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Sign in with Email (SSO only)
            </button>
          </div>
        </>
      )}
    </>
  );
}
