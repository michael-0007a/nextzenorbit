/**
 * Template Selector — Client Component
 *
 * Displays available LaTeX resume templates with preview cards.
 * Allows selection and shows Pro badge for premium templates.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { LATEX_TEMPLATES, type LaTeXTemplate } from "@/lib/resume/latex-templates";
import type { ResumeTemplate } from "@/lib/resume/templates";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (template: ResumeTemplate | LaTeXTemplate) => void;
  className?: string;
}

// Preview colors for LaTeX templates
const LATEX_TEMPLATE_COLORS: Record<string, { primary: string; accent: string; bg: string }> = {
  "classic-professional": { primary: "#1a1a2e", accent: "#0f4c75", bg: "#ffffff" },
  "modern-tech": { primary: "#111827", accent: "#3b82f6", bg: "#ffffff" },
  "deedy-resume": { primary: "#2d3748", accent: "#4f46e5", bg: "#fafafa" },
  "academic-cv": { primary: "#1e293b", accent: "#0ea5e9", bg: "#ffffff" },
  "jake-resume": { primary: "#1f2937", accent: "#10b981", bg: "#ffffff" },
  "software-engineer": { primary: "#0f172a", accent: "#8b5cf6", bg: "#ffffff" },
};

export function TemplateSelector({
  selectedId,
  onSelect,
  className,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const renderTemplateCard = (template: LaTeXTemplate) => {
    const isSelected = selectedId === template.id;
    const isHovered = hoveredId === template.id;
    const colors = LATEX_TEMPLATE_COLORS[template.id] || LATEX_TEMPLATE_COLORS["classic-professional"];

    return (
      <motion.button
        key={template.id}
        onClick={() => onSelect(template as unknown as ResumeTemplate)}
        onMouseEnter={() => setHoveredId(template.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={cn(
          "relative group text-left rounded-xl border-2 p-4 transition-all duration-200",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Template Preview */}
        <div
          className="relative aspect-[8.5/11] rounded-lg mb-3 overflow-hidden border border-border/50"
          style={{ backgroundColor: colors.bg }}
        >
          {/* Mini preview representation */}
          <div className="absolute inset-2 flex flex-col gap-1">
            {/* Header */}
            <div
              className="h-4 rounded"
              style={{ backgroundColor: colors.primary, opacity: 0.8 }}
            />
            <div
              className="h-1.5 w-2/3 rounded"
              style={{ backgroundColor: colors.primary, opacity: 0.3 }}
            />
            {/* Sections */}
            <div className="mt-2 space-y-2">
              <div
                className="h-1.5 w-1/3 rounded"
                style={{ backgroundColor: colors.accent }}
              />
              <div className="space-y-0.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 rounded"
                    style={{
                      backgroundColor: colors.primary,
                      opacity: 0.2,
                      width: `${100 - i * 15}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2 space-y-2">
              <div
                className="h-1.5 w-1/3 rounded"
                style={{ backgroundColor: colors.accent }}
              />
              <div className="space-y-0.5">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1 rounded"
                    style={{
                      backgroundColor: colors.primary,
                      opacity: 0.2,
                      width: `${90 - i * 20}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* LaTeX badge */}
          <div className="absolute top-1 right-1">
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/90 text-white text-[8px] font-bold">
              <FileText className="h-2 w-2" />
              LaTeX
            </span>
          </div>

          {/* Selected overlay */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-primary/20 flex items-center justify-center"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Template info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">
              {template.name}
            </span>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Hover effect */}
        {isHovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-xl border-2 border-primary/30 pointer-events-none"
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* All templates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Choose a Template
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          All templates use professional LaTeX typesetting for high-quality PDF output.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LATEX_TEMPLATES.map(renderTemplateCard)}
        </div>
      </div>
    </div>
  );
}

