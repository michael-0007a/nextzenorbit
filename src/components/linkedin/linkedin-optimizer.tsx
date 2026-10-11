"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Linkedin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LINKEDIN_LIMITS, type LinkedinProfile } from "@/lib/ai/prompts/linkedin";

export interface LinkedinOptimizerProps {
  resumes: { id: string; title: string }[];
}

function Section({ title, text, limit }: { title: string; text: string; limit?: number }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${title} copied`);
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  };
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3">
          {limit && (
            <span className={cn("text-xs", text.length > limit ? "text-error" : "text-text-secondary")}>
              {text.length} / {limit}
            </span>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={copy} aria-label={`Copy ${title}`}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

export function LinkedinOptimizer({ resumes }: LinkedinOptimizerProps) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<LinkedinProfile | null>(null);

  const generate = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!resumeId || targetRole.trim().length < 2 || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, targetRole: targetRole.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to generate your profile.");
      setProfile(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate your profile.");
    } finally {
      setLoading(false);
    }
  };

  if (resumes.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-sm text-text-secondary">
        You need a resume first. <Link href="/resumes" className="text-primary hover:underline">Create or upload one</Link>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="glass-card rounded-2xl p-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-1.5">
          <label htmlFor="linkedin-resume" className="text-sm font-medium text-foreground">Resume</label>
          <select
            id="linkedin-resume"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full h-10 px-3 rounded-2xl border border-border bg-white/5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
          </select>
        </div>
        <Input label="Target role" placeholder="e.g. Senior Data Analyst" maxLength={120} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
        <Button type="submit" isLoading={loading} disabled={targetRole.trim().length < 2}>
          {profile ? <RefreshCw className="h-4 w-4" /> : <Linkedin className="h-4 w-4" />}
          {profile ? "Regenerate" : "Optimize"}
        </Button>
      </form>

      {profile && (
        <div className="space-y-4">
          <Section title="Headline" text={profile.headline} limit={LINKEDIN_LIMITS.headline} />
          <Section title="About" text={profile.about} limit={LINKEDIN_LIMITS.about} />
          <Section title="Top skills" text={profile.skills.join(", ")} />
          {profile.experience.map((role, index) => (
            <Section key={`${role.company}-${index}`} title={`${role.position} · ${role.company}`} text={role.bullets.map((b) => `• ${b}`).join("\n")} />
          ))}
          <p className="text-xs text-text-secondary">Generated only from your resume. Review every line before pasting it into LinkedIn.</p>
        </div>
      )}
    </div>
  );
}
