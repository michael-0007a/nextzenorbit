/**
 * AI Enhance Button — Client Component
 *
 * Triggers AI enhancement for bullet points or summary generation.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIEnhanceButtonProps {
  resumeId: string;
  bullets: string[];
  context?: {
    jobTitle?: string;
    company?: string;
    targetRole?: string;
  };
  onEnhanced: (newBullets: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function AIEnhanceBullets({
  resumeId,
  bullets,
  context,
  onEnhanced,
  disabled,
  className,
}: AIEnhanceButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleEnhance = async () => {
    if (bullets.length === 0 || bullets.every(b => !b.trim())) {
      toast.error("Add some bullet points first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_bullets",
          bullets: bullets.filter(b => b.trim()),
          context,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.bullets) {
        onEnhanced(data.data.bullets);
        toast.success("Bullets enhanced with AI!");
      } else {
        throw new Error(data.error?.message || "Enhancement failed");
      }
    } catch (error) {
      console.error("AI enhance error:", error);
      toast.error("Failed to enhance bullets. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleEnhance}
      disabled={disabled || loading}
      className={className}
      leftIcon={
        loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )
      }
    >
      {loading ? "Enhancing..." : "AI Enhance"}
    </Button>
  );
}

interface AIGenerateSummaryProps {
  resumeId: string;
  experience?: Array<{ position: string; company: string; bullets: string[] }>;
  skills?: Array<{ category?: string; items: string[] }>;
  education?: Array<{ degree: string; institution: string }>;
  targetRole?: string;
  onGenerated: (summary: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AIGenerateSummary({
  resumeId,
  experience,
  skills,
  education,
  targetRole,
  onGenerated,
  disabled,
  className,
}: AIGenerateSummaryProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_summary",
          experience,
          skills,
          education,
          targetRole,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.summary) {
        onGenerated(data.data.summary);
        toast.success("Summary generated!");
      } else {
        throw new Error(data.error?.message || "Generation failed");
      }
    } catch (error) {
      console.error("AI generate error:", error);
      toast.error("Failed to generate summary. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled || loading}
      className={className}
      leftIcon={
        loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wand2 className="h-3.5 w-3.5" />
        )
      }
    >
      {loading ? "Generating..." : "AI Generate"}
    </Button>
  );
}

