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
import { ResumePreview } from "@/components/resume/resume-preview";
import type { ResumeContent } from "@/lib/validations/resume";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface AdminResumeGeneratorClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  baseResume: {
    id: string;
    title: string;
    content: any;
    template_id: string;
  } | null;
}

export function AdminResumeGeneratorClient({
  userId,
  userName,
  userEmail,
  baseResume,
}: AdminResumeGeneratorClientProps) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [resumeTitle, setResumeTitle] = useState(`Resume for ${company || "New Job"}`);
  
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Start with base content or empty
  const [content, setContent] = useState<ResumeContent>(
    baseResume?.content || {
      contact: { full_name: userName, email: userEmail, phone: "", location: "" },
      summary: { text: "" },
      experience: [],
      education: [],
      skills: [],
      projects: [],
    }
  );

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
      // We use the existing user resume optimize endpoint
      const response = await fetch(`/api/resumes/${baseResume.id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          embellishmentLevel: "moderate", // Admins use moderate by default
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Resume optimized! Match score: ${data.data.matchScore}%`);
        setContent(data.data.content);
        
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
          template_id: baseResume?.template_id || "classic",
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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
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
            disabled={saving}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? "Saving..." : "Save Resume for User"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Form */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-8">
          {!baseResume && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning-foreground text-sm">
              <strong>Warning:</strong> This user does not have a base resume. Optimization will not work until they create one.
            </div>
          )}

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
                Paste the job description to tailor the user's base resume.
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
                disabled={optimizing || !jobDescription.trim() || !baseResume}
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
            <ResumePreview
              content={content}
              templateId={baseResume?.template_id || "classic"}
              scale={0.7}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
