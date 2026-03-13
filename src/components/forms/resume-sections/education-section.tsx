/**
 * Education Section — Resume Editor
 */

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResumeContent } from "@/lib/validations/resume";

export function EducationSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ResumeContent>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  const addEducation = () => {
    append({
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "",
      field_of_study: "",
      location: "",
      start_date: "",
      end_date: "",
      gpa: "",
      bullets: [],
    });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => (
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
                    <GraduationCap className="h-4 w-4 text-mint" />
                    Education {index + 1}
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-sm p-1 text-granite hover:text-error transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Institution"
                    placeholder="Indian Institute of Technology, Delhi"
                    error={errors.education?.[index]?.institution?.message}
                    {...register(`education.${index}.institution`)}
                  />
                  <Input
                    label="Degree"
                    placeholder="B.Tech"
                    error={errors.education?.[index]?.degree?.message}
                    {...register(`education.${index}.degree`)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Field of Study"
                    placeholder="Computer Science & Engineering"
                    error={errors.education?.[index]?.field_of_study?.message}
                    {...register(`education.${index}.field_of_study`)}
                  />
                  <Input
                    label="Location"
                    placeholder="New Delhi, India"
                    error={errors.education?.[index]?.location?.message}
                    {...register(`education.${index}.location`)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Start Date"
                    placeholder="2017"
                    {...register(`education.${index}.start_date`)}
                  />
                  <Input
                    label="End Date"
                    placeholder="2021"
                    {...register(`education.${index}.end_date`)}
                  />
                  <Input
                    label="GPA / Percentage"
                    placeholder="9.2 / 10"
                    {...register(`education.${index}.gpa`)}
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-granite py-12">
          <GraduationCap className="h-8 w-8 text-granite" />
          <p className="mt-3 text-sm text-text-secondary">
            No education entries yet.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={addEducation}
      >
        Add Education
      </Button>
    </div>
  );
}

