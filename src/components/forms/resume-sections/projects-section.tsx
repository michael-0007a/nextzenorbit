/**
 * Projects Section — Resume Editor
 */

"use client";

import { useState } from "react";
import { useFormContext, useFieldArray, type UseFormWatch, type UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FolderOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResumeContent } from "@/lib/validations/resume";

export function ProjectsSection() {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ResumeContent>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  });

  const addProject = () => {
    append({
      id: `proj_${Date.now()}`,
      name: "",
      description: "",
      url: "",
      technologies: [],
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
                    <FolderOpen className="h-4 w-4 text-mint" />
                    Project {index + 1}
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
                    label="Project Name"
                    placeholder="AI Resume Builder"
                    error={errors.projects?.[index]?.name?.message}
                    {...register(`projects.${index}.name`)}
                  />
                  <Input
                    label="URL"
                    placeholder="https://github.com/..."
                    error={errors.projects?.[index]?.url?.message}
                    {...register(`projects.${index}.url`)}
                  />
                </div>
                <Textarea
                  label="Description"
                  placeholder="Brief description of the project..."
                  rows={3}
                  error={errors.projects?.[index]?.description?.message}
                  {...register(`projects.${index}.description`)}
                />

                {/* Technologies tags */}
                <TechTagInput
                  name={`projects.${index}.technologies`}
                  watch={watch}
                  setValue={setValue}
                />
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-granite py-12">
          <FolderOpen className="h-8 w-8 text-granite" />
          <p className="mt-3 text-sm text-text-secondary">
            No projects yet. Showcase your best work.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={addProject}
      >
        Add Project
      </Button>
    </div>
  );
}

// ── Tech Tag Input ──
function TechTagInput({
  name,
  watch,
  setValue,
}: {
  name: `projects.${number}.technologies`;
  watch: UseFormWatch<ResumeContent>;
  setValue: UseFormSetValue<ResumeContent>;
}) {
  const [input, setInput] = useState("");
  const items: string[] = watch(name) || [];

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setValue(name, [...items, trimmed], { shouldDirty: true });
    setInput("");
  };

  const removeItem = (idx: number) => {
    setValue(
      name,
      items.filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Technologies Used
      </label>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.span
              key={`${item}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 rounded-sm border border-mint-border bg-mint-muted px-2 py-1 text-xs font-medium text-mint"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-mint/60 hover:text-mint"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="React, Node.js, PostgreSQL..."
          className="flex-1 h-9 rounded-sm border border-granite bg-transparent px-3 text-sm text-foreground placeholder:text-granite transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          Add
        </Button>
      </div>
    </div>
  );
}



