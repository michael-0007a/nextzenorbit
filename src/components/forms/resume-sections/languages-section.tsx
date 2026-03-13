/**
 * Languages Section — Resume Editor
 */

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResumeContent } from "@/lib/validations/resume";

const proficiencyOptions = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "advanced", label: "Advanced" },
  { value: "intermediate", label: "Intermediate" },
  { value: "basic", label: "Basic" },
];

export function LanguagesSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ResumeContent>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "languages",
  });

  const addLanguage = () => {
    append({
      id: `lang_${Date.now()}`,
      name: "",
      proficiency: "intermediate",
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
                    <Globe className="h-4 w-4 text-mint" />
                    Language {index + 1}
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
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Language"
                    placeholder="Hindi, English, Tamil..."
                    error={errors.languages?.[index]?.name?.message}
                    {...register(`languages.${index}.name`)}
                  />
                  <div className="w-full space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Proficiency
                    </label>
                    <select
                      className="flex h-10 w-full rounded-sm border border-granite bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      {...register(`languages.${index}.proficiency`)}
                    >
                      {proficiencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-granite py-12">
          <Globe className="h-8 w-8 text-granite" />
          <p className="mt-3 text-sm text-text-secondary">
            No languages yet.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={addLanguage}
      >
        Add Language
      </Button>
    </div>
  );
}

