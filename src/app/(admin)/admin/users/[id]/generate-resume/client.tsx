"use client";

/**
 * Admin Resume Generator Client
 *
 * Provides a UI for the admin to generate a tailored resume for a user.
 * It uses the existing resume preview component and calls an AI optimization API.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Wand2,
  Loader2,
  FileText,
  Check,
  Upload,
  Eye,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResumeLengthSelector } from "@/components/resume/resume-length-selector";
import { RESUME_TEMPLATES, getTemplate } from "@/lib/resume/templates";
import { layoutResume, PAPER } from "@/lib/resume/layout";
import { cn } from "@/lib/utils";
import { ResumePreview } from "@/components/resume/resume-preview";
import { createEmptyResumeContent, type ResumeContent } from "@/lib/validations/resume";
import Link from "next/link";
import { ResumeFileUpload } from "@/components/forms/resume-file-upload";
import { hasResumeBody } from "@/lib/resume/export-content";

interface AdminResumeGeneratorClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  resumes: {
    id: string;
    title: string;
    content: ResumeContent;
    template_id: string | null;
  }[];
}

export function AdminResumeGeneratorClient({
  userId,
  userName,
  userEmail,
  resumes,
}: AdminResumeGeneratorClientProps) {
  const router = useRouter();
  const [sources, setSources] = useState(resumes);
  const [sourceId, setSourceId] = useState(resumes[0]?.id || "");
  const baseResume = sources.find(resume => resume.id === sourceId) || null;
  const [templateId, setTemplateId] = useState(resumes[0]?.template_id || "classic");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [resumeTitle, setResumeTitle] = useState(`${userName} — Resume`);
  
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showUpload, setShowUpload] = useState(resumes.length === 0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const canvasRef = useRef<HTMLDivElement>(null);
  const busy = uploading || optimizing || saving;

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver(([entry]) => setCanvasWidth(entry.contentRect.width));
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Start with base content or empty
  const [content, setContent] = useState<ResumeContent>(
    baseResume?.content || createEmptyResumeContent({
      full_name: userName,
      email: userEmail,
    })
  );

  const layout = useMemo(() => layoutResume(content, getTemplate(templateId)), [content, templateId]);
  const previewScale = zoom ?? Math.min(1, Math.max(0.25, (canvasWidth - 40) / PAPER.width));
  const sourceLabel = (source: AdminResumeGeneratorClientProps["resumes"][number], index: number) =>
    `${/^[a-f0-9-]{32,36}$/i.test(source.title) ? `${userName}'s resume` : source.title} · Source ${index + 1}`;

  async function uploadSource() {
    if (!file) return;
    setUploading(true); setUploadError(""); setUploadWarning("");
    try {
      const form = new FormData(); form.set("file", file); form.set("userId", userId);
      const response = await fetch("/api/admin/resumes/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Upload failed.");
      const resume = result.data.resume;
      setSources(previous => [resume, ...previous]); setSourceId(resume.id); setContent(resume.content); setTemplateId(resume.template_id || "classic"); setGenerated(false); setShowUpload(false); setFile(null);
      setUploadWarning(result.data.warning || "");
      toast.success(result.data.parsedByAI ? "Resume parsed and selected. Review the preview before saving." : "Resume text imported and selected. Review is required.");
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  const handleOptimize = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description.");
      return;
    }
    
    if (!baseResume) {
      toast.error("User has no base resume to optimize from. Please manually create one first.");
      return;
    }

    setOptimizing(true);
    try {
      // Use admin-specific optimize endpoint (bypasses subscription, doesn't mutate original)
      const response = await fetch(`/api/admin/resumes/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          resumeId: baseResume.id,
          jobDescription,
          embellishmentLevel: "moderate",
          targetPages: content.layout?.target_pages ?? null,
          templateId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Draft generated. Review the resume before saving.");
        setGenerated(true);
        setContent(data.data.content);

        
        // Auto-update title if we have company
        if (company && resumeTitle === `${userName} — Resume`) {
          setResumeTitle(`Resume for ${company}`);
        }
      } else {
        throw new Error(data.error?.message || "Failed to optimize");
      }
    } catch (error) {
      console.error("Optimize error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate resume. Please try again.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!resumeTitle.trim()) {
      toast.error("Please provide a title for the generated resume.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: resumeTitle,
          content,
          job_title: jobTitle,
          company,
          job_description: jobDescription,
          template_id: templateId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Resume saved successfully! The user can now view it.");
        router.push(`/admin/users/${userId}`);
      } else {
        throw new Error(data.error?.message || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href={`/admin/users/${userId}`} className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to client
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resume studio</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">{userName}</span><span className="text-text-secondary break-all">{userEmail}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => router.push(`/admin/users/${userId}`)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={busy || !baseResume || !hasResumeBody(content) || !resumeTitle.trim()}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            {saving ? "Saving…" : "Save to client"}
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <StepHeading number="01" title="Source resume" description="Start with your client's experience." />
            <label htmlFor="source-resume" className="mb-2 mt-5 block text-xs font-medium text-text-secondary">Saved resume</label>
            <select id="source-resume" className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={sourceId} disabled={busy} onChange={event => {
                const source = sources.find(item => item.id === event.target.value);
                setUploadWarning(""); setSourceId(event.target.value); setGenerated(false);
                if (source) { setContent(source.content); setTemplateId(source.template_id || "classic"); }
              }}>
              <option value="" disabled>Choose a source resume</option>
              {sources.map((source, index) => <option key={source.id} value={source.id}>{sourceLabel(source, index)}</option>)}
            </select>
            {baseResume && <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary"><Check className="h-3.5 w-3.5 text-emerald-500" /> Original stays unchanged</p>}
            <button type="button" onClick={() => setShowUpload(!showUpload)} aria-expanded={showUpload} disabled={busy}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> {showUpload ? "Close upload" : "Upload another resume"}
            </button>
            {showUpload && <div className="mt-4 space-y-3 border-t border-border pt-4">
              <ResumeFileUpload file={file} onChange={setFile} disabled={busy} error={uploadError} />
              <Button className="w-full" onClick={uploadSource} disabled={!file || busy}>
                {uploading ? "Uploading and parsing…" : "Use uploaded resume"}
              </Button>
            </div>}
            {(uploadWarning || baseResume?.content.custom_sections.some(section => section.id.startsWith("uploaded-text"))) &&
              <p role="status" className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-text-secondary">
                {uploadWarning || "This source contains extracted text. Check the details before generating."}
              </p>}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <StepHeading number="02" title="Target role" description="Give the draft a clear direction." />
            <fieldset disabled={busy} className="mt-5 space-y-4 disabled:opacity-60">
              <div><label htmlFor="resume-title" className="mb-1.5 block text-xs font-medium text-text-secondary">Resume title <span className="text-primary">*</span></label>
                <Input id="resume-title" value={resumeTitle} onChange={e => setResumeTitle(e.target.value)} placeholder="e.g. Project Manager — Acme" /></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div><label htmlFor="target-company" className="mb-1.5 block text-xs font-medium text-text-secondary">Company</label>
                  <Input id="target-company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme" /></div>
                <div><label htmlFor="target-role" className="mb-1.5 block text-xs font-medium text-text-secondary">Job title</label>
                  <Input id="target-role" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Project Manager" /></div>
              </div>
              <div><label htmlFor="job-description" className="mb-1.5 block text-xs font-medium text-text-secondary">Job description</label>
                <Textarea id="job-description" value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the role's responsibilities, requirements and preferred skills…" className="min-h-[180px] resize-y text-sm" />
                <p className="mt-2 text-xs text-text-secondary">Use the full description for a more relevant draft.</p>
              </div>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <StepHeading number="03" title="Length & style" description="Choose the shape of the final resume." />
            <fieldset disabled={busy} className="mt-5 space-y-5 disabled:opacity-60">
              <ResumeLengthSelector value={content.layout?.target_pages ?? null} onChange={pages => setContent(previous => ({ ...previous, layout: { target_pages: pages } }))} />
              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">Template</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Resume template">
                  {RESUME_TEMPLATES.map(template => <button key={template.id} type="button" aria-pressed={getTemplate(templateId).id === template.id}
                    onClick={() => setTemplateId(template.id)} className={cn("relative rounded-xl border px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                      getTemplate(templateId).id === template.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                    <span aria-hidden="true" className="mx-auto mb-2 flex h-12 w-10 flex-col justify-center gap-1 rounded border border-slate-200 bg-white px-1.5 shadow-sm">
                      <span className="text-base font-bold leading-none" style={{ color: template.colors.accent, fontFamily: template.fonts.body.startsWith("Times") ? "Georgia, serif" : "Arial, sans-serif" }}>Aa</span>
                      <span className="h-px bg-slate-300" /><span className="h-px w-4 bg-slate-200" />
                    </span>
                    <span className="text-xs font-medium">{template.id === "classic" ? "Classic" : template.id === "modern" ? "Modern" : "Creative"}</span>
                    {getTemplate(templateId).id === template.id && <Check aria-hidden="true" className="absolute right-1.5 top-1.5 h-3 w-3 text-primary" />}
                  </button>)}
                </div>
              </div>
            </fieldset>
            <Button variant="primary" className="mt-6 w-full" onClick={handleOptimize}
              disabled={busy || jobDescription.trim().length < 10 || !baseResume}
              leftIcon={optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}>
              {optimizing ? "Generating draft…" : generated ? "Regenerate draft" : "Generate draft"}
            </Button>
            <p className="mt-3 text-center text-xs text-text-secondary">Review the draft, then save it to the client.</p>
          </section>
        </div>

        <section aria-label="Resume preview" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm xl:sticky xl:top-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary"><Eye className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold">Document preview</h2><p className="mt-0.5 text-xs text-text-secondary">{baseResume ? `${layout.pages.length} ${layout.pages.length === 1 ? "page" : "pages"} · A4 · ${layout.fontSize} pt` : "No source selected"}</p></div>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", generated ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-text-secondary")}>
              {optimizing ? "Generating…" : generated ? "Generated draft" : "Source preview"}
            </span>
          </div>
          {baseResume && layout.warnings.length > 0 && <details className="border-b border-amber-500/20 bg-amber-500/5 px-5 py-3">
            <summary className="cursor-pointer text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="mr-1.5 inline h-3.5 w-3.5" />{layout.warnings.length} {layout.warnings.length === 1 ? "item" : "items"} to review before saving
            </summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-text-secondary">{layout.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
          </details>}
          <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-text-secondary">
            <span>{getTemplate(templateId).name}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Zoom out" disabled={previewScale <= 0.3} onClick={() => setZoom(Math.max(0.3, previewScale - 0.1))} className="rounded-md p-2 hover:bg-muted disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
              <span className="w-9 text-center tabular-nums">{Math.round(previewScale * 100)}%</span>
              <button type="button" aria-label="Zoom in" disabled={previewScale >= 1.5} onClick={() => setZoom(Math.min(1.5, previewScale + 0.1))} className="rounded-md p-2 hover:bg-muted disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
              <button type="button" onClick={() => setZoom(null)} className="ml-1 rounded-md border border-border px-2 py-1 hover:text-foreground">Fit</button>
            </div>
          </div>
          <div ref={canvasRef} className="max-h-[75dvh] overflow-auto bg-slate-100 dark:bg-[#0c0e14] xl:max-h-[calc(100dvh-220px)]">
            <div className="w-max min-w-full p-5">
              {baseResume ? <div className="mx-auto w-max"><ResumePreview content={content} templateId={templateId} scale={previewScale} showDetails={false} /></div> :
                <div className="flex min-h-[480px] flex-col items-center justify-center px-4 text-center">
                  <FileText className="mb-4 h-10 w-10 text-text-secondary/40" /><h3 className="text-sm font-medium">Your draft starts here</h3>
                  <p className="mt-2 max-w-60 text-xs leading-relaxed text-text-secondary">Choose a saved resume or upload a source to preview the document.</p>
                </div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex items-start gap-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-semibold tabular-nums text-text-secondary">{number}</span>
    <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p></div>
  </div>;
}
