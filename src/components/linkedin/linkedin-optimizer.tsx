"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertCircle, Briefcase, Check, Copy, Linkedin, RefreshCw, Sparkles, Tags, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LINKEDIN_LIMITS, type LinkedinProfile } from "@/lib/ai/prompts/linkedin";
import { AiProgress } from "@/components/ui/ai-progress";
import { AI_PLANS } from "@/lib/ai/progress";

export interface LinkedinOptimizerProps {
  resumes: { id: string; title: string }[];
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  };
  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy} aria-label={`Copy ${label}`} leftIcon={copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function Counter({ length, limit }: { length: number; limit: number }) {
  const over = length > limit;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", over ? "bg-error" : "bg-primary")} style={{ width: `${Math.min(100, (length / limit) * 100)}%` }} />
      </div>
      <span className={cn("text-xs tabular-nums", over ? "text-error" : "text-text-secondary")}>{length} / {limit}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, copyText, extra, children }: { icon: typeof Tags; title: string; copyText: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="h-4 w-4 text-primary" /> {title}
          </h3>
          <div className="flex items-center gap-3">{extra}<CopyButton label={title} text={copyText} /></div>
        </div>
        {children}
      </CardBody>
    </Card>
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
      toast.success("Your LinkedIn profile is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate your profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Linkedin className="h-4 w-4 text-primary" />
            </div>
            Build your profile
          </CardTitle>
          <CardDescription>Pick the resume to work from and the role you want recruiters to find you for.</CardDescription>
        </CardHeader>
        <CardBody>
          {resumes.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm text-foreground">
                You haven&apos;t created any resumes yet.{" "}
                <Link href="/resumes" className="text-primary hover:underline font-medium">Create one first</Link> to use the optimizer.
              </p>
            </div>
          ) : (
            <form onSubmit={generate} className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="linkedin-resume" className="block text-sm font-medium text-foreground mb-1.5">Resume</label>
                <select
                  id="linkedin-resume"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
                </select>
              </div>
              <Input label="Target role" placeholder="e.g. Senior Data Analyst" maxLength={120} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={targetRole.trim().length < 2}
                  leftIcon={profile ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                >
                  {loading ? "Writing your profile..." : profile ? "Regenerate" : "Optimize my LinkedIn"}
                </Button>
                {loading && <AiProgress className="mt-4" plan={AI_PLANS.linkedin} />}
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {loading && !profile && (
        <Card>
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton shape="avatar" />
              <div className="flex-1 space-y-2"><Skeleton width="w-1/3" /><Skeleton width="w-3/4" /></div>
            </div>
            <Skeleton /><Skeleton /><Skeleton width="w-2/3" />
          </CardBody>
        </Card>
      )}

      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("space-y-4", loading && "opacity-60 transition-opacity")}>
          {/* Headline shown the way it appears on a LinkedIn profile card */}
          <Card className="relative overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary/30 via-secondary/25 to-accent/20" />
            <CardBody className="p-5 pt-0">
              <div className="-mt-9 mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-surface bg-surface-elevated">
                <UserRound className="h-8 w-8 text-text-secondary" />
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-1">Headline</p>
                  <p className="text-base font-semibold leading-snug text-foreground">{profile.headline}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Counter length={profile.headline.length} limit={LINKEDIN_LIMITS.headline} />
                  <CopyButton label="Headline" text={profile.headline} />
                </div>
              </div>
            </CardBody>
          </Card>

          <SectionCard icon={UserRound} title="About" copyText={profile.about} extra={<Counter length={profile.about.length} limit={LINKEDIN_LIMITS.about} />}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{profile.about}</p>
          </SectionCard>

          <SectionCard icon={Tags} title="Top skills" copyText={profile.skills.join(", ")}>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{skill}</span>
              ))}
            </div>
          </SectionCard>

          {profile.experience.map((role, index) => (
            <SectionCard key={`${role.company}-${index}`} icon={Briefcase} title={`${role.position} · ${role.company}`} copyText={role.bullets.map((b) => `• ${b}`).join("\n")}>
              <ul className="space-y-2">
                {role.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />{bullet}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}

          <p className="flex items-center gap-2 text-xs text-text-secondary">
            <AlertCircle className="h-3.5 w-3.5" /> Written only from your resume. Review every line before pasting it into LinkedIn.
          </p>
        </motion.div>
      )}
    </div>
  );
}
