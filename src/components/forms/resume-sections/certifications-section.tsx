/**
 * Certifications Section — Resume Editor
 */

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResumeContent } from "@/lib/validations/resume";

export function CertificationsSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ResumeContent>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications",
  });

  const addCertification = () => {
    append({
      id: `cert_${Date.now()}`,
      name: "",
      issuer: "",
      date: "",
      url: "",
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
                    <Award className="h-4 w-4 text-mint" />
                    Certification {index + 1}
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
                    label="Certification Name"
                    placeholder="AWS Solutions Architect"
                    error={errors.certifications?.[index]?.name?.message}
                    {...register(`certifications.${index}.name`)}
                  />
                  <Input
                    label="Issuing Organization"
                    placeholder="Amazon Web Services"
                    error={errors.certifications?.[index]?.issuer?.message}
                    {...register(`certifications.${index}.issuer`)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Date"
                    placeholder="Mar 2023"
                    error={errors.certifications?.[index]?.date?.message}
                    {...register(`certifications.${index}.date`)}
                  />
                  <Input
                    label="Credential URL"
                    placeholder="https://verify.aws/..."
                    error={errors.certifications?.[index]?.url?.message}
                    {...register(`certifications.${index}.url`)}
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-granite py-12">
          <Award className="h-8 w-8 text-granite" />
          <p className="mt-3 text-sm text-text-secondary">
            No certifications yet.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={addCertification}
      >
        Add Certification
      </Button>
    </div>
  );
}

