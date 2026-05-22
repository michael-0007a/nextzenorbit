/**
 * Resume Grid — Client Component
 *
 * Displays resumes as cards with actions.
 * Handles empty state, upload flow, and new resume creation.
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Upload,
  Trash2,
  Clock,
  Sparkles,
  FileBadge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

interface ResumeListItem {
  id: string;
  title: string;
  is_base: boolean;
  version: number;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ResumeGridProps {
  resumes: ResumeListItem[];
}

export function ResumeGrid({ resumes: initialResumes }: ResumeGridProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState(initialResumes);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Create blank resume ──
  const handleCreateBlank = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Resume" }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error?.message || "Failed to create resume.");
        return;
      }

      toast.success("Resume created!");
      router.push(`/resumes/${result.data.id}`);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  // ── Upload resume file ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error?.message || "Upload failed.");
        return;
      }

      if (result.data.parsedByAI) {
        toast.success("Resume parsed successfully! Review your details.");
      } else {
        toast.info("Could not auto-parse the file. Please fill in your details manually.");
      }

      router.push(`/resumes/${result.data.resume.id}`);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete resume ──
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error("Failed to delete resume.");
        return;
      }

      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume deleted.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Format date ──
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ── Empty state ──
  if (resumes.length === 0) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 py-20 px-8">
        <div className="absolute inset-0 bg-space opacity-45" />
        {/* Decorative gradient orbs */}
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />

        <div className="relative flex flex-col items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-white/5">
            <FileText className="h-12 w-12 text-text-secondary" />
            <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-foreground">
            No resumes yet
          </h2>
          <p className="mt-3 max-w-md text-center text-text-secondary">
            Create your first resume from scratch, or upload an existing one and
            let AI extract your details automatically.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleCreateBlank}
              isLoading={creating}
            >
              Start from Scratch
            </Button>
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploading}
            >
              Upload Resume
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            className="hidden"
          />

          {/* Feature hints */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3 w-full max-w-2xl">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-text-secondary">AI-powered parsing</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10">
                <FileBadge className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm text-text-secondary">Multiple versions</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                <Upload className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm text-text-secondary">PDF & DOCX support</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleCreateBlank}
          isLoading={creating}
        >
          New Resume
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => fileInputRef.current?.click()}
          isLoading={uploading}
        >
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Resume cards grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                variants={staggerItem}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
              <Card
                className={cn(
                  "group cursor-pointer transition-all duration-200 overflow-hidden",
                  "hover:border-primary hover:shadow-lg hover:shadow-primary/10",
                  deletingId === resume.id && "opacity-50 pointer-events-none"
                )}
                onClick={() => router.push(`/resumes/${resume.id}`)}
              >
                {/* Mini resume preview visualization */}
                <div className="relative bg-gradient-to-br from-muted/50 to-muted p-4">
                  <div className="aspect-[8.5/6] bg-white dark:bg-gray-900 rounded shadow-sm overflow-hidden mx-auto max-w-[180px]">
                    {/* Mini resume skeleton */}
                    <div className="p-3 space-y-2">
                      {/* Header */}
                      <div className="h-2.5 w-16 bg-primary/60 rounded mx-auto" />
                      <div className="h-1 w-24 bg-muted-foreground/20 rounded mx-auto" />
                      {/* Sections */}
                      <div className="pt-2 space-y-2">
                        <div className="h-1 w-10 bg-primary/40 rounded" />
                        <div className="space-y-1">
                          <div className="h-0.5 w-full bg-muted-foreground/10 rounded" />
                          <div className="h-0.5 w-4/5 bg-muted-foreground/10 rounded" />
                        </div>
                      </div>
                      <div className="pt-1 space-y-2">
                        <div className="h-1 w-8 bg-primary/40 rounded" />
                        <div className="space-y-1">
                          <div className="h-0.5 w-full bg-muted-foreground/10 rounded" />
                          <div className="h-0.5 w-3/4 bg-muted-foreground/10 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-primary bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full shadow">
                      Edit Resume
                    </span>
                  </div>
                </div>

                <CardHeader className="relative pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 text-base pr-8">
                      {resume.title}
                    </CardTitle>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(resume.id);
                      }}
                      className="absolute top-4 right-4 rounded-lg p-1.5 text-granite opacity-0 transition-all hover:text-error hover:bg-error/10 group-hover:opacity-100"
                      aria-label="Delete resume"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {resume.is_base && (
                      <Badge variant="primary" size="sm" className="bg-primary/10 text-primary border-primary/20">
                        <FileBadge className="mr-1 h-3 w-3" />
                        Base
                      </Badge>
                    )}
                    <Badge variant="default" size="sm">
                      v{resume.version}
                    </Badge>
                  </div>
                </CardBody>
                <CardFooter className="text-xs text-text-secondary flex items-center border-t border-border pt-3">
                  <Clock className="mr-1.5 h-3 w-3 text-granite" />
                  Updated {formatDate(resume.updated_at)}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}





