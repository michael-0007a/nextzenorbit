"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptTerms } from "./actions";

export function TermsForm() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;

    setLoading(true);
    setError(null);

    const result = await acceptTerms();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-surface/30 p-4 text-left">
        <input 
          type="checkbox" 
          id="terms" 
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border bg-white/5 text-primary focus:ring-primary focus:ring-offset-background"
        />
        <label htmlFor="terms" className="text-sm text-text-secondary leading-tight cursor-pointer">
          I agree to the <a href="/terms" className="text-primary hover:underline" target="_blank">Terms of Service</a> and acknowledge the <a href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</a>.
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        isLoading={loading}
        disabled={!agreed}
        className="w-full"
      >
        Accept & Continue
      </Button>
    </form>
  );
}
