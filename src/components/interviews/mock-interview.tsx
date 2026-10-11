"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Mic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MockInterviewRow } from "@/types/database";

type Summary = Pick<MockInterviewRow, "id" | "role" | "overall" | "created_at" | "completed_at">;

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message || "Something went wrong.");
  return result.data;
}

function Feedback({ index, question, answer }: { index: number; question: string; answer: NonNullable<MockInterviewRow["answers"][number]> }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Q{index + 1}. {question}</p>
        <span className={cn("flex-none rounded-full px-2.5 py-0.5 text-xs font-bold", answer.score >= 4 ? "bg-success/15 text-success" : answer.score >= 3 ? "bg-warning/15 text-warning" : "bg-error/15 text-error")}>
          {answer.score}/5
        </span>
      </div>
      <p className="text-sm text-text-secondary whitespace-pre-wrap"><span className="font-medium text-foreground">Your answer: </span>{answer.answer}</p>
      {answer.strengths.length > 0 && (
        <ul className="text-sm text-foreground list-disc pl-5 space-y-0.5">{answer.strengths.map((s, i) => <li key={i}><span className="text-success">Strength:</span> {s}</li>)}</ul>
      )}
      {answer.gaps.length > 0 && (
        <ul className="text-sm text-foreground list-disc pl-5 space-y-0.5">{answer.gaps.map((g, i) => <li key={i}><span className="text-warning">Improve:</span> {g}</li>)}</ul>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-primary">See a stronger answer</summary>
        <p className="mt-2 whitespace-pre-wrap text-foreground">{answer.improved_answer}</p>
      </details>
    </div>
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
        <form onSubmit={start} className="glass-card rounded-2xl p-6 space-y-4">
          <Input label="Role you are practising for" placeholder="e.g. Product Analyst" maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} />
          <Textarea label="Job description (optional)" helperText="Paste it for questions tailored to this job." rows={5} maxLength={8000} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
          <Button type="submit" isLoading={busy} disabled={role.trim().length < 2}><Play className="h-4 w-4" /> Start 5-question interview</Button>
        </form>
        <div className="glass-card rounded-2xl divide-y divide-border/60">
          <p className="p-4 text-sm font-semibold text-foreground">Past interviews</p>
          {sessions === null && <p className="p-4 text-sm text-text-secondary">Loading…</p>}
          {sessions?.length === 0 && <p className="p-4 text-sm text-text-secondary">No interviews yet.</p>}
          {sessions?.map((s) => (
            <button key={s.id} type="button" onClick={() => open(s.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
              <Mic className="h-4 w-4 text-primary" />
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{s.role}</span>
                <span className="block text-xs text-text-secondary">{format(new Date(s.created_at), "MMM d, yyyy")}</span>
              </span>
              <span className="text-sm font-semibold text-foreground">{s.completed_at ? `${s.overall}/100` : "In progress"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = active.questions.findIndex((_, i) => !active.answers[i]);
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

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => { setActive(null); loadSessions(); }} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All interviews
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{active.role}</h2>
        <span className="text-sm text-text-secondary">{active.answers.filter(Boolean).length} of {active.questions.length} answered</span>
      </div>

      {active.completed_at && (
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div>
            <p className="text-2xl font-bold text-foreground">{active.overall}/100</p>
            <p className="text-sm text-text-secondary">Review the feedback below, then start another round to practise the weak spots.</p>
          </div>
        </div>
      )}

      {active.questions.map((question, i) => {
        const answer = active.answers[i];
        return answer ? <Feedback key={i} index={i} question={question} answer={answer} /> : null;
      })}

      {current >= 0 && (
        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">Question {current + 1} of {active.questions.length}</p>
          <p className="text-base font-semibold text-foreground">{active.questions[current]}</p>
          <Textarea aria-label="Your answer" rows={7} maxLength={4000} placeholder="Answer as you would in the interview. For behavioural questions use Situation, Task, Action, Result." value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Button type="submit" isLoading={busy} disabled={!draft.trim()}>Submit answer</Button>
        </form>
      )}
    </div>
  );
}
