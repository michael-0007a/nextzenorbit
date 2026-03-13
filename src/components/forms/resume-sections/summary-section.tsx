/**
 * Summary Section — Resume Editor
 */

"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { ResumeContent } from "@/lib/validations/resume";

export function SummarySection() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<ResumeContent>();

  const summaryText = watch("summary.text") ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-mint" />
          Professional Summary
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-2">
        <Textarea
          placeholder="Experienced software engineer with 5+ years of expertise in building scalable web applications..."
          rows={6}
          error={errors.summary?.text?.message}
          {...register("summary.text")}
        />
        <p className="text-xs text-text-secondary text-right">
          {summaryText.length}/2000 characters
        </p>
      </CardBody>
    </Card>
  );
}

