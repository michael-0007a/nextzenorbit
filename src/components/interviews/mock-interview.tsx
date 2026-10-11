"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronRight, Lightbulb, Mic, Play, RotateCcw, Sparkles, ThumbsUp, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonList } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MockInterviewRow } from "@/types/database";

type Summary = Pick<MockInterviewRow, "id" | "role" | "overall" | "created_at" | "completed_at">;

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message || "Something went wrong.");
  return result.data;
}

const tone = (score: number, outOf: number) => {
  const pct = score / outOf;
  return pct >= 0.8 ? "primary" : pct >= 0.6 ? "warning" : "error";
};
const TONE = {
  primary: { text: "text-primary", tile: "bg-primary/10 border-primary/30", bar: "bg-primary", top: "from-primary via-primary-light to-primary" },
  warning: { text: "text-warning", tile: "bg-warning/10 border-warning/30", bar: "bg-warning", top: "from-warning via-warning/70 to-warning" },
  error: { text: "text-error", tile: "bg-error/10 border-error/30", bar: "bg-error", top: "from-error via-error/70 to-error" },
};

function Stepper({ interview, current }: { interview: MockInterviewRow; current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label="Interview progress">
      {interview.questions.map((_, i) => {
        const answer = interview.answers[i];
        return (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 flex-none items-center justify-center rounded-full border text-xs font-bold transition-colors",
                answer ? cn(TONE[tone(answer.score, 5)].tile, TONE[tone(answer.score, 5)].text) : i === current ? "border-primary bg-primary text-white" : "border-border bg-white/5 text-text-secondary",
              )}
              aria-current={i === current ? "step" : undefined}
            >
              {answer ? answer.score : i + 1}
            </div>
            {i < interview.questions.length - 1 && <div className={cn("h-0.5 flex-1 rounded-full", answer ? "bg-primary/40" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}

function Feedback({ index, question, answer }: { index: number; question: string; answer: NonNullable<MockInterviewRow["answers"][number]> }) {
  const t = TONE[tone(answer.score, 5)];
  return (
    <Card>
      <CardBody className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl border", t.tile, t.text)}>
            <span className="text-lg font-bold leading-none">{answer.score}</span>
            <span className="text-[10px] opacity-80">/ 5</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">Question {index + 1}</p>
            <p className="text-sm font-semibold text-foreground">{question}</p>
          </div>
        </div>
        <p className="rounded-xl border border-border bg-white/5 p-3 text-sm text-text-secondary whitespace-pre-wrap">{answer.answer}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {answer.strengths.length > 0 && (
            <div className="rounded-xl border border-success/20 bg-success/5 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-success"><ThumbsUp className="h-3.5 w-3.5" /> What worked</p>
              <ul className="space-y-1 text-sm text-foreground">{answer.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {answer.gaps.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning"><TrendingUp className="h-3.5 w-3.5" /> To improve</p>
              <ul className="space-y-1 text-sm text-foreground">{answer.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
        </div>
        <details className="group rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-primary">
            <Lightbulb className="h-4 w-4" /> See a stronger answer
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{answer.improved_answer}</p>
        </details>
      </CardBody>
    </Card>
  );
}

export function MockInterview() {
  const [sessions, setSessions] = useState<Summary[] | null>(null);
  const [active, setActive] = useState<MockInterviewRow | null>(null);
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSessions = useCallback(() => {
    call<Summary[]>("/api/mock-interviews").then(setSessions).catch(() => setSessions([]));
  }, []);
  useEffect(loadSessions, [loadSessions]);

  const start = async (event: React.FormEvent) => {
    event.preventDefault();
    if (role.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      setActive(await call<MockInterviewRow>("/api/mock-interviews", { method: "POST", body: JSON.stringify({ role: role.trim(), jobDescription: jobDescription.trim() || undefined }) }));
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start the interview.");
    } finally {
      setBusy(false);
    }
  };

  const open = async (id: string) => {
    try { setActive(await call<MockInterviewRow>(`/api/mock-interviews/${id}`)); setDraft(""); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open the interview."); }
  };

  if (!active) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Mic className="h-4 w-4 text-primary" /></div>
              Start a practice round
            </CardTitle>
            <CardDescription>Five questions, one at a time. Each answer is scored out of 5 with tips and a stronger sample answer.</CardDescription>
          </CardHeader>
          <CardBody>
            <form onSubmit={start} className="space-y-4">
              <Input label="Role you are practising for" placeholder="e.g. Product Analyst" maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} />
              <Textarea label="Job description (optional)" helperText="Paste it for questions tailored to this job." rows={5} maxLength={8000} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
              <Button type="submit" isLoading={busy} disabled={role.trim().length < 2} leftIcon={<Play className="h-4 w-4" />}>
                {busy ? "Preparing questions..." : "Start interview"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Past interviews</CardTitle>
          </CardHeader>
          <CardBody className="p-3">
            {sessions === null && <div className="p-3"><SkeletonList count={2} /></div>}
            {sessions?.length === 0 && <p className="p-3 text-sm text-text-secondary">No interviews yet. Your scores will show up here so you can track progress.</p>}
            <div className="space-y-1">
              {sessions?.map((s) => (
                <button key={s.id} type="button" onClick={() => open(s.id)} className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5">
                  <div className={cn("flex h-10 w-10 flex-none items-center justify-center rounded-xl border text-sm font-bold", s.completed_at && s.overall !== null ? cn(TONE[tone(s.overall, 100)].tile, TONE[tone(s.overall, 100)].text) : "border-border bg-white/5 text-text-secondary")}>
                    {s.completed_at && s.overall !== null ? s.overall : <Mic className="h-4 w-4" />}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{s.role}</span>
                    <span className="block text-xs text-text-secondary">{format(new Date(s.created_at), "MMM d, yyyy")} · {s.completed_at ? "Completed" : "In progress"}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-secondary transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const current = active.questions.findIndex((_, i) => !active.answers[i]);
  const answered = active.answers.filter(Boolean).length;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || busy || current < 0) return;
    setBusy(true);
    try {
      setActive(await call<MockInterviewRow>(`/api/mock-interviews/${active.id}/answer`, { method: "POST", body: JSON.stringify({ index: current, answer: draft.trim() }) }));
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to score your answer.");
    } finally {
      setBusy(false);
    }
  };
  const overall = active.completed_at && active.overall !== null ? active.overall : null;
  const t = overall !== null ? TONE[tone(overall, 100)] : null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => { setActive(null); loadSessions(); }} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> All interviews
      </button>

      <Card>
        <CardBody className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">{active.role}</h2>
            <span className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-medium text-text-secondary">{answered} of {active.questions.length} answered</span>
          </div>
          <Stepper interview={active} current={current} />
        </CardBody>
      </Card>

      {overall !== null && t && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", t.top)} />
            <CardBody className="p-6">
              <div className="flex items-center gap-6">
                <div className={cn("flex h-24 w-24 flex-none items-center justify-center rounded-2xl border-2 text-4xl font-bold", t.tile, t.text)}>{overall}</div>
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-xl font-bold text-foreground"><CheckCircle2 className="h-5 w-5 text-success" /> Interview complete</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {overall >= 80 ? "Strong round. You're ready for the real thing." : overall >= 60 ? "Solid base. Work on the gaps below and try again." : "Keep practising. Use the stronger answers below as a guide."}
                  </p>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${overall}%` }} transition={{ duration: 1, ease: "easeOut" }} className={cn("h-full rounded-full", t.bar)} />
                  </div>
                </div>
              </div>
              <Button type="button" variant="secondary" className="mt-5" onClick={() => { setActive(null); setRole(active.role); loadSessions(); }} leftIcon={<RotateCcw className="h-4 w-4" />}>
                Practise this role again
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {current >= 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary" />
          <CardBody className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Question {current + 1} of {active.questions.length}</p>
              <p className="text-lg font-semibold leading-snug text-foreground">{active.questions[current]}</p>
              <Textarea
                aria-label="Your answer"
                rows={7}
                maxLength={4000}
                placeholder="Answer as you would in the interview. For behavioural questions use Situation, Task, Action, Result."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                helperText={`${draft.length} / 4000`}
              />
              <Button type="submit" isLoading={busy} disabled={!draft.trim()} leftIcon={<Sparkles className="h-4 w-4" />}>
                {busy ? "Scoring your answer..." : "Submit answer"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {active.questions.map((question, i) => {
        const answer = active.answers[i];
        return answer ? <Feedback key={i} index={i} question={question} answer={answer} /> : null;
      }).reverse()}
    </div>
  );
}
