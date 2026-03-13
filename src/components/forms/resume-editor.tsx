/**
 * Resume Editor — Client Component
 *
 * Full-featured resume editor with tabbed sections.
 * Uses react-hook-form with Zod validation.
 * Auto-saves via debounced PATCH on every change.
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  resumeContentSchema,
  type ResumeContent,
} from "@/lib/validations/resume";
import type { ResumeRow } from "@/types/database";

// Section components
import { ContactSection } from "@/components/forms/resume-sections/contact-section";
import { SummarySection } from "@/components/forms/resume-sections/summary-section";
import { ExperienceSection } from "@/components/forms/resume-sections/experience-section";
import { EducationSection } from "@/components/forms/resume-sections/education-section";
import { SkillsSection } from "@/components/forms/resume-sections/skills-section";
import { ProjectsSection } from "@/components/forms/resume-sections/projects-section";
import { CertificationsSection } from "@/components/forms/resume-sections/certifications-section";
import { LanguagesSection } from "@/components/forms/resume-sections/languages-section";

interface ResumeEditorProps {
  resume: ResumeRow;
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

export function ResumeEditor({ resume }: ResumeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contact");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(resume.title);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Parse existing content with defaults
  const defaultContent = resumeContentSchema.parse(resume.content ?? {});

  const methods = useForm<ResumeContent>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resumeContentSchema) as any,
    defaultValues: defaultContent,
    mode: "onChange",
  });

  // ── Auto-save (debounced 2s) ──
  const saveResume = useCallback(
    async (data: ResumeContent) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/resumes/${resume.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data, title }),
        });

        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch {
        // Silent fail for auto-save — user can manually save
      } finally {
        setSaving(false);
      }
    },
    [resume.id, title]
  );

  // Watch for form changes and debounce save
  useEffect(() => {
    const subscription = methods.watch((data) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const parsed = resumeContentSchema.safeParse(data);
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
    const parsed = resumeContentSchema.safeParse(data);
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

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Title + Save bar */}
        <div className="flex items-center justify-between gap-4">
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
                <button
                  onClick={handleTitleSave}
                  className="text-mint hover:text-leaf"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="group flex items-center gap-2 text-left"
              >
                <h2 className="text-lg font-semibold text-foreground truncate max-w-md">
                  {title}
                </h2>
                <Pencil className="h-3.5 w-3.5 text-granite opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

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
                  <Check className="h-3 w-3 text-mint" />
                  Saved {lastSaved.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </>
              ) : null}
            </span>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleManualSave}
              isLoading={saving}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto border-b border-granite pb-px scrollbar-hide">
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
                    ? "text-mint"
                    : "text-granite hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-mint"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
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
  );
}







