/**
 * Resume Editor with Preview — Client Component
 *
 * Split-pane layout with editor on left and live preview on right.
 * Includes export, template selection, and version history.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderOpen,
  Award,
  Globe,
  Pencil,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  resumeContentFormSchema,
  createEmptyResumeContent,
  type ResumeContent,
} from "@/lib/validations/resume";
import type { ResumeRow } from "@/types/database";

// Common template interface for both LaTeX and React-PDF templates
interface BaseTemplate {
  id: string;
  name: string;
}

// Section components
import { ContactSection } from "@/components/forms/resume-sections/contact-section";
import { SummarySection } from "@/components/forms/resume-sections/summary-section";
import { ExperienceSection } from "@/components/forms/resume-sections/experience-section";
import { EducationSection } from "@/components/forms/resume-sections/education-section";
import { SkillsSection } from "@/components/forms/resume-sections/skills-section";
import { ProjectsSection } from "@/components/forms/resume-sections/projects-section";
import { CertificationsSection } from "@/components/forms/resume-sections/certifications-section";
import { LanguagesSection } from "@/components/forms/resume-sections/languages-section";

// New components
import { ResumeActions } from "@/components/resume/resume-actions";
import { ResumePreview } from "@/components/resume/resume-preview";

interface ResumeEditorWithPreviewProps {
  resume: ResumeRow;
  isPro?: boolean;
}

const TABS = [
  { id: "contact", label: "Contact", icon: User },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "certifications", label: "Certs", icon: Award },
  { id: "languages", label: "Languages", icon: Globe },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResumeEditorWithPreview({ resume, isPro = false }: ResumeEditorWithPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contact");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(resume.title);
  const [templateId, setTemplateId] = useState(resume.template_id || "classic");
  const [showPreview, setShowPreview] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Parse existing content with defaults - use safeParse to handle invalid data
  const parseResult = resumeContentFormSchema.safeParse(resume.content ?? {});
  const defaultContent = parseResult.success
    ? parseResult.data
    : createEmptyResumeContent();

  const methods = useForm<ResumeContent>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resumeContentFormSchema) as any,
    defaultValues: defaultContent,
    mode: "onChange",
  });

  const watchedContent = methods.watch();

  // ── Auto-save (debounced 2s) ──
  const saveResume = useCallback(
    async (data: ResumeContent) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/resumes/${resume.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data, title, template_id: templateId }),
        });

        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch {
        // Silent fail for auto-save
      } finally {
        setSaving(false);
      }
    },
    [resume.id, title, templateId]
  );

  // Watch for form changes and debounce save
  useEffect(() => {
    const subscription = methods.watch((data) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        // Use lenient form schema to allow saving incomplete data
        const parsed = resumeContentFormSchema.safeParse(data);
        if (parsed.success) {
          saveResume(parsed.data);
        }
      }, 2000);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [methods, saveResume]);

  // ── Manual save ──
  const handleManualSave = async () => {
    const data = methods.getValues();
    const parsed = resumeContentFormSchema.safeParse(data);
    if (!parsed.success) {
      toast.error("Please fix validation errors before saving.");
      return;
    }
    await saveResume(parsed.data);
    toast.success("Resume saved.");
  };

  // ── Title edit ──
  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (title === resume.title) return;
    try {
      await fetch(`/api/resumes/${resume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      toast.success("Title updated.");
    } catch {
      toast.error("Failed to update title.");
    }
  };

  // ── Template change ──
  const handleTemplateChange = async (template: BaseTemplate) => {
    setTemplateId(template.id);
    try {
      await fetch(`/api/resumes/${resume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: template.id }),
      });
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border mb-4">
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                onBlur={handleTitleSave}
                className="text-lg font-semibold h-9 w-64"
                autoFocus
              />
              <button onClick={handleTitleSave} className="text-primary hover:text-primary/80">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-2 text-left"
            >
              <h1 className="text-xl font-bold text-foreground truncate max-w-md">
                {title}
              </h1>
              <Pencil className="h-3.5 w-3.5 text-granite opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save status */}
          <span className="text-xs text-text-secondary flex items-center gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-primary" />
                Saved
              </>
            ) : null}
          </span>

          {/* Toggle preview */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            leftIcon={showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          >
            {showPreview ? "Hide" : "Show"} Preview
          </Button>

          {/* Manual save */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleManualSave}
            isLoading={saving}
          >
            Save
          </Button>

          {/* Export, Template, History */}
          <ResumeActions
            resumeId={resume.id}
            currentTemplateId={templateId}
            onTemplateChange={handleTemplateChange}
            isPro={isPro}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Editor Panel */}
        <div className={cn(
          "flex flex-col min-w-0 overflow-hidden transition-all duration-300",
          showPreview ? "flex-1" : "w-full"
        )}>
          <FormProvider {...methods}>
            {/* Tab navigation */}
            <div className="flex gap-1 overflow-x-auto border-b border-border pb-px mb-4 scrollbar-hide shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap",
                      "transition-colors duration-150",
                      isActive
                        ? "text-primary"
                        : "text-granite hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator-preview"
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === "contact" && <ContactSection />}
                  {activeTab === "summary" && <SummarySection />}
                  {activeTab === "experience" && <ExperienceSection />}
                  {activeTab === "education" && <EducationSection />}
                  {activeTab === "skills" && <SkillsSection />}
                  {activeTab === "projects" && <ProjectsSection />}
                  {activeTab === "certifications" && <CertificationsSection />}
                  {activeTab === "languages" && <LanguagesSection />}
                </motion.div>
              </AnimatePresence>
            </div>
          </FormProvider>
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-l border-border pl-6 overflow-hidden"
            >
              <div className="sticky top-0">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-granite" />
                  Live Preview
                </h3>
                <div className="overflow-auto max-h-[calc(100vh-14rem)] rounded-lg border border-border">
                  <ResumePreview
                    key={`preview-${templateId}`}
                    content={watchedContent as ResumeContent}
                    templateId={templateId}
                    scale={0.55}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


