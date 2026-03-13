/**
 * Resume Actions Bar — Client Component
 *
 * Export PDF/Word/LaTeX, select template, and version history controls.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileText,
  Palette,
  History,
  Loader2,
  RotateCcw,
  X,
  Sparkles,
  ChevronDown,
  FileType,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TemplateSelector } from "./template-selector";
import { cn } from "@/lib/utils";

// Common template interface for both LaTeX and React-PDF templates
interface BaseTemplate {
  id: string;
  name: string;
}

interface ResumeVersion {
  id: string;
  version_number: number;
  title: string;
  change_summary: string | null;
  created_at: string;
}

interface ResumeActionsProps {
  resumeId: string;
  currentTemplateId: string;
  onTemplateChange: (template: BaseTemplate) => void;
  isPro?: boolean;
  className?: string;
}

export function ResumeActions({
  resumeId,
  currentTemplateId,
  onTemplateChange,
  isPro = false,
  className,
}: ResumeActionsProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "latex" | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Export with format - use LaTeX for PDF generation by default for better quality
  const handleExport = async (format: "pdf" | "docx" | "latex", useLatex = true) => {
    setExporting(true);
    setExportFormat(format);
    setShowExportMenu(false);
    try {
      // Use LaTeX for PDF by default for professional quality
      const latexParam = format === "pdf" && useLatex ? "&latex=true" : "";
      const response = await fetch(
        `/api/resumes/${resumeId}/export?format=${format}&template=${currentTemplateId}${latexParam}`
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extensions = { pdf: "pdf", docx: "docx", latex: "tex" };
      a.download = `resume_${Date.now()}.${extensions[format]}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const formatNames = { pdf: "PDF", docx: "Word document", latex: "LaTeX source" };
      toast.success(`${formatNames[format]} downloaded successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export. Please try again.");
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  // Fetch versions
  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`);
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch {
      toast.error("Failed to load version history.");
    } finally {
      setLoadingVersions(false);
    }
  };

  // Save current version
  const handleSaveVersion = async () => {
    setSavingVersion(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary: "Manual snapshot" }),
      });

      if (response.ok) {
        toast.success("Version saved!");
        fetchVersions();
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast.error("Failed to save version.");
    } finally {
      setSavingVersion(false);
    }
  };

  // Restore version
  const handleRestoreVersion = async (versionId: string) => {
    setRestoringVersion(versionId);
    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}/restore`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Version restored! Refreshing...");
        setTimeout(() => window.location.reload(), 500);
      } else {
        throw new Error("Failed to restore");
      }
    } catch {
      toast.error("Failed to restore version.");
    } finally {
      setRestoringVersion(null);
    }
  };

  // Open versions panel
  const openVersions = () => {
    setShowVersions(true);
    fetchVersions();
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            rightIcon={<ChevronDown className="h-3 w-3" />}
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting}
          >
            {exporting ? `Exporting ${exportFormat?.toUpperCase()}...` : "Download"}
          </Button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50"
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => handleExport("pdf", true)}
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  <div className="flex flex-col items-start">
                    <span>PDF (Professional)</span>
                    <span className="text-xs text-muted-foreground">LaTeX typeset, best quality</span>
                  </div>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => handleExport("docx")}
                >
                  <FileType className="h-4 w-4 text-blue-500" />
                  <span>Word Document (.docx)</span>
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => handleExport("latex")}
                >
                  <FileCode className="h-4 w-4 text-green-500" />
                  <span>LaTeX Source (.tex)</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-muted transition-colors"
                  onClick={() => handleExport("pdf", false)}
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-xs">PDF (Basic fallback)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Template selector */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Palette className="h-4 w-4" />}
          onClick={() => setShowTemplates(true)}
        >
          Template
        </Button>

        {/* Version history */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<History className="h-4 w-4" />}
          onClick={openVersions}
        >
          History
        </Button>
      </div>

      {/* Template Modal */}
      <Modal
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Choose Template"
        size="lg"
      >
        <TemplateSelector
          selectedId={currentTemplateId}
          onSelect={(template) => {
            onTemplateChange(template);
            setShowTemplates(false);
            toast.success(`Template changed to ${template.name}`);
          }}
        />
      </Modal>

      {/* Version History Drawer */}
      <AnimatePresence>
        {showVersions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowVersions(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Version History</h2>
                </div>
                <button
                  onClick={() => setShowVersions(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Save current version */}
              <div className="p-4 border-b border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={savingVersion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  onClick={handleSaveVersion}
                  disabled={savingVersion}
                >
                  {savingVersion ? "Saving..." : "Save Current Version"}
                </Button>
              </div>

              {/* Versions list */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-granite mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">No versions saved yet</p>
                    <p className="text-xs text-granite mt-1">
                      Save a version to track your changes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              Version {version.version_number}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {version.change_summary || version.title}
                            </p>
                            <p className="text-xs text-granite mt-1">
                              {new Date(version.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={
                              restoringVersion === version.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )
                            }
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={restoringVersion !== null}
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

