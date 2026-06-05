"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { SectionHeader } from "@/components/career/section-header";
import { useUser } from "@/hooks/use-user";
import { useAiNotes } from "@/hooks/use-ai-notes";

export interface AiNotesPanelProps {
  roleLabel: string;
}

export function AiNotesPanel({ roleLabel }: AiNotesPanelProps) {
  const { user, loading: userLoading } = useUser();
  const { notes, loading, error, refetch } = useAiNotes(roleLabel, !!user);
  
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setGenerateError("");
    
    try {
      const response = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, career_id: roleLabel }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate notes");
      }
      
      setTopic("");
      await refetch();
    } catch (err: any) {
      setGenerateError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="ai-notes" className="space-y-6">
      <SectionHeader
        title="AI notes"
        description="Generate concise, interview-ready notes using AI."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border border-border/60 bg-surface/40">
          <CardBody className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Generate notes</h3>
              <p className="text-sm text-text-secondary">
                Enter a topic to scaffold notes and get a comprehensive study guide.
              </p>
            </div>
            
            <div className="space-y-2">
              <Input 
                label="Topic" 
                placeholder="e.g. React Hooks, System Design, Agile" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isGenerating && user) {
                    handleGenerate();
                  }
                }}
              />
              {generateError && (
                <p className="text-xs text-red-500">{generateError}</p>
              )}
              {!user && (
                <p className="text-xs text-primary/80">You must be signed in to generate notes.</p>
              )}
            </div>
            
            <Button 
              disabled={!topic.trim() || isGenerating || !user} 
              onClick={handleGenerate}
              rightIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </CardBody>
        </Card>

        <Card className="border border-border/60 bg-surface/40">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Saved notes</h3>
                <p className="text-sm text-text-secondary">
                  {user ? "Your latest saved notes." : "Sign in to see saved notes."}
                </p>
              </div>
              {user && (
                <button
                  onClick={() => void refetch()}
                  className="text-xs font-semibold text-primary"
                  type="button"
                >
                  Refresh
                </button>
              )}
            </div>

            {userLoading || loading ? (
              <div className="space-y-3">
                <Skeleton shape="text" />
                <Skeleton shape="text" />
                <Skeleton shape="text" width="w-2/3" />
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-white/5 p-6 text-center">
                <p className="text-sm text-text-secondary">
                  Sign in to store and review your AI notes.
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex text-sm font-semibold text-primary"
                >
                  Sign in
                </Link>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-white/5 p-6 text-center text-sm text-text-secondary">
                {error}
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-white/5 p-6 text-center text-sm text-text-secondary">
                No notes yet for {roleLabel}. Enter a topic to generate your first study note.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-border/60 bg-white/5 p-6"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-primary mb-4 border-b border-border/50 pb-2">
                      {note.topic}
                    </p>
                    <div className="prose prose-sm dark:prose-invert prose-stone max-w-none prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-secondary">
                      <ReactMarkdown>{note.generated_content || ""}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
