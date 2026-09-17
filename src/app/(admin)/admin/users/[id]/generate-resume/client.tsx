"use client";

/**
 * Admin Resume Generator Client
 *
 * Provides a UI for the admin to generate a tailored resume for a user.
 * It uses the existing resume preview component and calls an AI optimization API.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Wand2,
  Loader2,
  FileText,
  User,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResumeLengthSelector } from "@/components/resume/resume-length-selector";
import { TemplateSelector } from "@/components/resume/template-selector";
import { ResumePreview } from "@/components/resume/resume-preview";
import { createEmptyResumeContent, type ResumeContent } from "@/lib/validations/resume";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [resumeTitle, setResumeTitle] = useState(`Resume for ${company || "New Job"}`);
  
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Start with base content or empty
  const [content, setContent] = useState<ResumeContent>(
    baseResume?.content || createEmptyResumeContent({
      full_name: userName,
      email: userEmail,
    })
  );

  async function uploadSource() {
    if (!file) return;
    setUploading(true); setUploadError(""); setUploadWarning("");
    try {
      const form = new FormData(); form.set("file", file); form.set("userId", userId);
      const response = await fetch("/api/admin/resumes/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Upload failed.");
      const resume = result.data.resume;
      setSources(previous => [resume, ...previous]); setSourceId(resume.id); setContent(resume.content); setFile(null);
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
        toast.success(`Resume optimized! Match score: ${data.data.matchScore}%`);
        setContent(data.data.content);
        if (data.data.layoutWarnings?.length) toast.info(data.data.layoutWarnings.join(" "));
        
        // Auto-update title if we have company
        if (company) {
          setResumeTitle(`Resume for ${company}`);
        }
      } else {
        throw new Error(data.error?.message || "Failed to optimize");
      }
    } catch (error) {
      console.error("Optimize error:", error);
      toast.error("Failed to optimize resume. Please try again.");
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/users/${userId}`}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-text-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Generate Resume
            </h1>
            <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
              <User className="h-3.5 w-3.5" />
              {userName} ({userEmail})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/users/${userId}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || optimizing || uploading || !baseResume || !hasResumeBody(content)}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? "Saving..." : "Save Resume for User"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Left Column: Form */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-8">
          <Card>
            <CardHeader><CardTitle>1. Choose a base resume</CardTitle><CardDescription>Select a saved resume or upload a new source for this client.</CardDescription></CardHeader>
            <CardBody className="space-y-4">
              <label className="block text-sm font-medium">Saved resumes
                <select className="mt-2 w-full rounded-lg border border-border bg-background p-3" value={sourceId} disabled={uploading || optimizing || saving} onChange={event => {
                  const source = sources.find(item => item.id === event.target.value);
                  setUploadWarning(""); setSourceId(event.target.value); if (source) setContent(source.content);
                }}>
                  <option value="" disabled>Choose a resume</option>
                  {sources.map(source => <option key={source.id} value={source.id}>{source.title}</option>)}
                </select>
              </label>
              {!sources.length && <p className="text-sm text-text-secondary">No parsed resume is available yet. Upload a source below.</p>}
              {(uploadWarning || baseResume?.content.custom_sections.some(section => section.id.startsWith("uploaded-text"))) && <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{uploadWarning || "This source contains extracted resume text. Review the preview before generating a final resume."}</p>}
              <ResumeFileUpload file={file} onChange={setFile} disabled={uploading || optimizing || saving} error={uploadError} />
              <Button className="w-full" onClick={uploadSource} disabled={!file || uploading || optimizing || saving}>{uploading ? "Uploading and parsing…" : "Upload and parse resume"}</Button>
              <p className="text-xs text-text-secondary">Changing the source resets the preview. Optimizing creates a separate draft and preserves the source.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resume Metadata
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Resume Title <span className="text-error">*</span>
                </label>
                <Input
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="e.g. Frontend Dev - Google"
                />
                <p className="text-xs text-text-secondary mt-1">
                  This title will be visible to the user.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Target Company
                  </label>
                  <Input
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (!resumeTitle || resumeTitle.startsWith("Resume for")) {
                        setResumeTitle(`Resume for ${e.target.value || "New Job"}`);
                      }
                    }}
                    placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Job Title
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                AI Optimization
              </CardTitle>
              <CardDescription>
                Paste the job description to tailor the user&apos;s base resume.
              </CardDescription>
            </CardHeader>
            <CardBody className="flex-1 flex flex-col min-h-0 space-y-4">
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="flex-1 resize-none min-h-[200px]"
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleOptimize}
                disabled={optimizing || saving || uploading || !jobDescription.trim() || !baseResume}
                leftIcon={optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              >
                {optimizing ? "Optimizing via AI..." : "Optimize Base Resume"}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden bg-muted/20">
          <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-granite" />
              Preview: {resumeTitle}
            </h3>
            <span className="text-xs text-text-secondary bg-muted px-2 py-1 rounded">
              Read-only preview
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center">
            <ResumeLengthSelector value={content.layout?.target_pages ?? null} onChange={pages => setContent(previous => ({ ...previous, layout: { target_pages: pages } }))} />
            <TemplateSelector selectedId={templateId} onSelect={template => setTemplateId(template.id)} className="mb-4" />
            {baseResume ? <ResumePreview
              content={content}
              templateId={templateId}
              scale={0.7}
            /> : <p className="py-24 text-center text-text-secondary">Choose or upload a base resume to see the preview.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
