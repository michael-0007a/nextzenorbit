/**
 * Experience Section — Resume Editor
 *
 * Dynamic list with useFieldArray for add/remove/reorder.
 */

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResumeContent } from "@/lib/validations/resume";

export function ExperienceSection() {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext<ResumeContent>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  });

  const addExperience = () => {
    append({
      id: `exp_${Date.now()}`,
      company: "",
      position: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      bullets: [""],
    });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => {
          const isCurrent = watch(`experience.${index}.is_current`);

          return (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="h-4 w-4 text-mint" />
                      Experience {index + 1}
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-sm p-1 text-granite hover:text-error transition-colors"
                      aria-label="Remove experience"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Company"
                      placeholder="Google"
                      error={errors.experience?.[index]?.company?.message}
                      {...register(`experience.${index}.company`)}
                    />
                    <Input
                      label="Position"
                      placeholder="Senior Software Engineer"
                      error={errors.experience?.[index]?.position?.message}
                      {...register(`experience.${index}.position`)}
                    />
                  </div>
                  <Input
                    label="Location"
                    placeholder="Bengaluru, India"
                    error={errors.experience?.[index]?.location?.message}
                    {...register(`experience.${index}.location`)}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Start Date"
                      placeholder="Jan 2021"
                      error={errors.experience?.[index]?.start_date?.message}
                      {...register(`experience.${index}.start_date`)}
                    />
                    <Input
                      label="End Date"
                      placeholder={isCurrent ? "Present" : "Dec 2023"}
                      disabled={isCurrent}
                      error={errors.experience?.[index]?.end_date?.message}
                      {...register(`experience.${index}.end_date`)}
                    />
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded-sm border border-granite accent-mint"
                          {...register(`experience.${index}.is_current`)}
                        />
                        Currently here
                      </label>
                    </div>
                  </div>

                  {/* Bullet points */}
                  <BulletEditor
                    name={`experience.${index}.bullets`}
                    label="Key Achievements & Responsibilities"
                  />
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-granite py-12">
          <Briefcase className="h-8 w-8 text-granite" />
          <p className="mt-3 text-sm text-text-secondary">
            No experience entries yet. Add your work history.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={addExperience}
      >
        Add Experience
      </Button>
    </div>
  );
}

// ── Bullet Editor Sub-Component ──

function BulletEditor({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    // Use the name as-is for the field array
    name: name as `experience.${number}.bullets`,
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="flex items-start gap-2"
          >
            <span className="mt-2.5 text-granite text-sm">•</span>
            <input
              className="flex-1 h-9 rounded-sm border border-granite bg-transparent px-3 text-sm text-foreground placeholder:text-granite transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Led development of..."
              {...register(`${name}.${index}`)}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-1.5 rounded-sm p-1 text-granite hover:text-error transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => append("")}
        className="flex items-center gap-1.5 text-xs text-mint hover:text-leaf transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add bullet point
      </button>
    </div>
  );
}


