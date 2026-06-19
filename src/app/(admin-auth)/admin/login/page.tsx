"use client";

import { useState } from "react";
import { signInWithEmail } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signInWithEmail(email.trim(), password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 border border-primary/40">
          <Shield className="h-7 w-7 text-primary-light" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Admin Portal
        </h1>
        <p className="text-sm text-text-secondary">
          Sign in with your admin credentials to continue.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="admin@nextzenorbit.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary shadow-[0_15px_35px_rgba(255,0,61,0.35)]"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-xs text-text-secondary">
        This portal is for authorized team members only.
        <br />
        Contact your administrator if you need access.
      </p>
    </>
  );
}
