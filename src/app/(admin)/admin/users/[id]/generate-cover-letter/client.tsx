"use client";

/**
 * Admin Cover Letter Generator Client
 *
 * Provides a UI for the admin to generate a tailored cover letter for a user.
 * It uses the Groq AI API and saves the output to the admin_cover_letters table.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Wand2,
  Loader2,
  FileSignature,
  User,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface AdminCoverLetterGeneratorClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  baseResume: {
    id: string;
    title: string;
  } | null;
}

export function AdminCoverLetterGeneratorClient({
  userId,
  userName,
  userEmail,
  baseResume,
}: AdminCoverLetterGeneratorClientProps) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [letterTitle, setLetterTitle] = useState(`Cover Letter for ${company || "New Job"}`);
  
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [content, setContent] = useState("");

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !company.trim() || !jobTitle.trim()) {
      toast.error("Please enter a job description, company, and job title.");
      return;
    }
    
    if (!baseResume) {
      toast.error("User has no base resume. A resume is required to generate a cover letter.");
      return;
    }

    setGenerating(true);
    try {
      // Use the admin-specific generation endpoint to bypass paywall
      const response = await fetch(`/api/admin/cover-letters/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          resumeId: baseResume.id,
          jobDescription,
          companyName: company,
          jobTitle: jobTitle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Cover letter generated successfully!`);
        setContent(data.data.coverLetter);
        
        // Auto-update title if we have company
        if (company && letterTitle.startsWith("Cover Letter for")) {
          setLetterTitle(`Cover Letter for ${company}`);
        }
      } else {
        throw new Error(data.error?.message || "Failed to generate");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate cover letter. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!letterTitle.trim() || !content.trim()) {
      toast.error("Please provide a title and generated content.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/cover-letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: letterTitle,
          content,
          job_title: jobTitle,
          company_name: company,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Cover letter saved successfully!");
        router.push(`/admin/users/${userId}`);
      } else {
        throw new Error(data.error?.message || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save cover letter. Please try again.");
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
              <Wand2 className="h-5 w-5 text-secondary" />
              Generate Cover Letter
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
            disabled={saving || !content.trim()}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? "Saving..." : "Save for User"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Form */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-8">
          {!baseResume && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning-foreground text-sm">
              <strong>Warning:</strong> This user does not have a base resume. Generation will not work until they create one.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-secondary" />
                Cover Letter Details
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Internal Title <span className="text-error">*</span>
                </label>
                <Input
                  value={letterTitle}
                  onChange={(e) => setLetterTitle(e.target.value)}
                  placeholder="e.g. Google - Frontend Engineer"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company <span className="text-error">*</span>
                  </label>
                  <Input
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (!letterTitle || letterTitle.startsWith("Cover Letter for")) {
                        setLetterTitle(`Cover Letter for ${e.target.value || "New Job"}`);
                      }
                    }}
                    placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Job Title <span className="text-error">*</span>
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
                <Wand2 className="h-4 w-4 text-secondary" />
                AI Generation
              </CardTitle>
              <CardDescription>
                Paste the job description to tailor the cover letter.
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
                onClick={handleGenerate}
                disabled={generating || !jobDescription.trim() || !company.trim() || !jobTitle.trim() || !baseResume}
                leftIcon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              >
                {generating ? "Generating via AI..." : "Generate Cover Letter"}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Preview / Edit */}
        <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden bg-muted/10">
          <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-granite" />
              Generated Letter
            </h3>
            <span className="text-xs text-text-secondary bg-muted px-2 py-1 rounded">
              Editable
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The generated cover letter will appear here..."
              className="flex-1 resize-none min-h-full font-serif text-base p-6 leading-relaxed bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-secondary/30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
