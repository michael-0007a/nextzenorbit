/**
 * Cover Letter Generator — Client Component
 *
 * Form to generate AI-powered cover letters.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Download,
  Check,
  Building2,
  Briefcase,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Resume {
  id: string;
  title: string;
  updated_at: string;
}

interface CoverLetterGeneratorProps {
  resumes: Resume[];
}

type ExportFormat = "pdf" | "docx" | "txt";

export function CoverLetterGenerator({ resumes }: CoverLetterGeneratorProps) {
  const [selectedResume, setSelectedResume] = useState<string>(resumes[0]?.id || "");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = async () => {
    if (!selectedResume) {
      toast.error("Please select a resume");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Please enter the company name");
      return;
    }
    if (!jobTitle.trim()) {
      toast.error("Please enter the job title");
      return;
    }
    if (!jobDescription.trim() || jobDescription.length < 50) {
      toast.error("Please paste a complete job description (at least 50 characters)");
      return;
    }

    if (jobDescription.length > 10000) {
      toast.error("Job description is too long (maximum 10,000 characters)");
      return;
    }

    setGenerating(true);
    setCoverLetter("");

    try {
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResume,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          hiringManager: hiringManager.trim() || undefined,
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data.coverLetter) {
        setCoverLetter(data.data.coverLetter);
        toast.success("Cover letter generated!");
      } else {
        // Handle validation errors specifically
        if (data.error?.details?.fieldErrors) {
          const fieldErrors = data.error.details.fieldErrors;
          const firstField = Object.keys(fieldErrors)[0];
          const firstError = fieldErrors[firstField][0];
          throw new Error(`${firstField}: ${firstError}`);
        }
        throw new Error(data.error?.message || "Generation failed");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate cover letter. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: ExportFormat) => {
    if (!coverLetter) return;

    const filename = `cover_letter_${companyName.replace(/\s+/g, "_")}`;
    setExporting(true);

    try {
      if (format === "txt") {
        // Plain text download
        const blob = new Blob([coverLetter], { type: "text/plain" });
        downloadBlob(blob, `${filename}.txt`);
        toast.success("Downloaded as TXT");
      } else if (format === "docx") {
        // DOCX download via API
        const response = await fetch("/api/cover-letter/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: coverLetter,
            format: "docx",
            filename,
          }),
        });

        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        downloadBlob(blob, `${filename}.docx`);
        toast.success("Downloaded as DOCX");
      } else if (format === "pdf") {
        // PDF download via API
        const response = await fetch("/api/cover-letter/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: coverLetter,
            format: "pdf",
            filename,
          }),
        });

        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        downloadBlob(blob, `${filename}.pdf`);
        toast.success("Downloaded as PDF");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold">Generate Cover Letter</h2>
        </div>

        {/* Resume Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-secondary" />
            Select Resume
          </label>
          {resumes.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No resumes found. <Link href="/resumes" className="text-primary hover:underline">Create one first</Link>.
            </p>
          ) : (
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className={cn(
                "w-full h-10 px-3 rounded-2xl border border-border bg-white/5",
                "text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-text-secondary" />
            Company Name *
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google, Infosys, Razorpay"
          />
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-text-secondary" />
            Job Title *
          </label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        {/* Hiring Manager (optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-text-secondary" />
            Hiring Manager <span className="text-text-secondary">(optional)</span>
          </label>
          <Input
            value={hiringManager}
            onChange={(e) => setHiringManager(e.target.value)}
            placeholder="e.g., Ms. Priya Sharma"
          />
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Job Description *
          </label>
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            maxLength={10000}
          />
          <p className="text-xs text-granite">
            {jobDescription.length} characters
            {jobDescription.length < 50 && " (minimum 50)"}
            {jobDescription.length >= 10000 && " (maximum 10,000)"}
          </p>
        </div>

        {/* Generate Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || resumes.length === 0}
          leftIcon={
            generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )
          }
        >
          {generating ? "Generating..." : "Generate Cover Letter"}
        </Button>
      </Card>

      {/* Output */}
      <Card className="p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Generated Cover Letter</h2>
          {coverLetter && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              {/* Export dropdown */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={exporting}
                  leftIcon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  rightIcon={<ChevronDown className="h-3 w-3" />}
                >
                  Export
                </Button>
                <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownload("docx")}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors"
                  >
                    DOCX
                  </button>
                  <button
                    onClick={() => handleDownload("txt")}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors"
                  >
                    TXT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-[400px] rounded-lg border border-border bg-muted/30 p-4 overflow-auto">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm text-text-secondary">
                Crafting your personalized cover letter...
              </p>
            </div>
          ) : coverLetter ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {coverLetter}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="h-12 w-12 text-granite mb-3" />
              <p className="text-sm text-text-secondary">
                Your AI-generated cover letter will appear here
              </p>
              <p className="text-xs text-granite mt-1">
                Fill in the details and click Generate
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

