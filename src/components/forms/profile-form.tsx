/**
 * Profile Form — Client Component
 *
 * Edit profile fields with react-hook-form + Zod validation.
 * Includes Job Preferences section for the Auto-Apply system.
 * Auto-saves are not used here — explicit save button.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Phone,
  Link,
  Briefcase,
  Camera,
  Target,
  IndianRupee,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile";
import type { ProfileRow } from "@/types/database";

interface ProfileFormProps {
  profile: ProfileRow;
  userEmail: string;
}

const WORK_TYPES = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const PORTAL_OPTIONS = [
  { value: "indeed", label: "Indeed" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "naukri", label: "Naukri" },
  { value: "internshala", label: "Internshala" },
  { value: "glassdoor", label: "Glassdoor" },
] as const;

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedPortals, setSelectedPortals] = useState<string[]>(
    profile.preferred_portals || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateProfileSchema) as any,
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      headline: profile.headline || "",
      location: profile.location || "",
      linkedin_url: profile.linkedin_url || "",
      preferred_role: profile.preferred_role || "",
      preferred_location: profile.preferred_location || "",
      preferred_salary_min: profile.preferred_salary_min ?? undefined,
      preferred_salary_max: profile.preferred_salary_max ?? undefined,
      preferred_work_type: profile.preferred_work_type || "any",
      years_of_experience: profile.years_of_experience ?? undefined,
      preferred_portals: profile.preferred_portals || [],
    },
  });

  const togglePortal = (portal: string) => {
    const updated = selectedPortals.includes(portal)
      ? selectedPortals.filter((p) => p !== portal)
      : [...selectedPortals, portal];
    setSelectedPortals(updated);
    setValue("preferred_portals", updated, { shouldDirty: true });
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error?.message || "Failed to update profile.");
        return;
      }

      toast.success("Profile updated successfully.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/10" />
        <CardBody className="flex items-center gap-6 -mt-12 pb-6">
          <div className="relative">
            <Avatar
              src={profile.avatar_url || undefined}
              name={profile.full_name || userEmail}
              size="xl"
              className="ring-4 ring-card border-0"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border text-text-secondary hover:text-primary hover:border-primary transition-colors shadow-sm"
              title="Change avatar (coming soon)"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="pt-4">
            <h2 className="text-lg font-semibold text-foreground">
              {profile.full_name || "Your Name"}
            </h2>
            <p className="text-sm text-text-secondary">{userEmail}</p>
            {profile.headline && (
              <p className="text-sm text-primary mt-1">{profile.headline}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Arjun Sharma"
            error={errors.full_name?.message}
            leftAddon={<User className="h-4 w-4" />}
            {...register("full_name")}
          />

          {/* Email — read only */}
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <div className="flex h-10 w-full items-center rounded-2xl border border-border bg-white/5 px-3 text-sm text-text-secondary">
              {userEmail}
            </div>
            <p className="text-xs text-text-secondary">
              Email is managed by your Google account.
            </p>
          </div>

          <Input
            label="Headline"
            placeholder="Senior Software Engineer | React & Node.js"
            error={errors.headline?.message}
            leftAddon={<Briefcase className="h-4 w-4" />}
            helperText="A brief tagline that appears on your profile."
            {...register("headline")}
          />
        </CardBody>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" />
            Contact & Location
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Phone"
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            leftAddon={<Phone className="h-4 w-4" />}
            {...register("phone")}
          />

          <Input
            label="Location"
            placeholder="Bengaluru, Karnataka"
            error={errors.location?.message}
            leftAddon={<MapPin className="h-4 w-4" />}
            {...register("location")}
          />

          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/yourprofile"
            error={errors.linkedin_url?.message}
            leftAddon={<Link className="h-4 w-4" />}
            {...register("linkedin_url")}
          />
        </CardBody>
      </Card>

      {/* Job Preferences — Auto Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Job Preferences
          </CardTitle>
          <p className="text-sm text-text-secondary mt-1">
            Used by the Auto-Apply engine to find and apply to matching jobs.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Preferred Role"
            placeholder="React Developer, Full Stack Engineer"
            error={errors.preferred_role?.message}
            leftAddon={<Briefcase className="h-4 w-4" />}
            helperText="Job title or role you're looking for."
            {...register("preferred_role")}
          />

          <Input
            label="Preferred Location"
            placeholder="Bangalore, Remote, Mumbai"
            error={errors.preferred_location?.message}
            leftAddon={<MapPin className="h-4 w-4" />}
            helperText="Where you want to work."
            {...register("preferred_location")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Salary (₹/month)"
              placeholder="30000"
              type="number"
              error={errors.preferred_salary_min?.message}
              leftAddon={<IndianRupee className="h-4 w-4" />}
              {...register("preferred_salary_min", { valueAsNumber: true })}
            />

            <Input
              label="Max Salary (₹/month)"
              placeholder="80000"
              type="number"
              error={errors.preferred_salary_max?.message}
              leftAddon={<IndianRupee className="h-4 w-4" />}
              {...register("preferred_salary_max", { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Years of Experience"
            placeholder="3"
            type="number"
            error={errors.years_of_experience?.message}
            leftAddon={<Clock className="h-4 w-4" />}
            {...register("years_of_experience", { valueAsNumber: true })}
          />

          {/* Work Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Work Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WORK_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white/5 px-3 py-2 text-sm cursor-pointer transition-all hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="radio"
                    value={type.value}
                    className="sr-only"
                    {...register("preferred_work_type")}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Portals */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="h-4 w-4 text-text-secondary" />
              Preferred Job Portals
            </label>
            <div className="flex flex-wrap gap-2">
              {PORTAL_OPTIONS.map((portal) => (
                <button
                  key={portal.value}
                  type="button"
                  onClick={() => togglePortal(portal.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${selectedPortals.includes(portal.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-secondary hover:border-primary/40 hover:text-foreground"
                    }`}
                >
                  {portal.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary">
              Select portals where Auto-Apply should look for jobs.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          disabled={!isDirty}
          className={isDirty ? "shadow-[0_0_20px_rgba(255,0,61,0.25)]" : ""}
        >
          Save Profile
        </Button>
      </div>
    </form>
  );
}

