/**
 * Profile Form — Client Component
 *
 * Edit profile fields with react-hook-form + Zod validation.
 * Auto-saves are not used here — explicit save button.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, MapPin, Phone, Link, Briefcase, Camera } from "lucide-react";
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

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
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
    },
  });

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
        <div className="h-20 bg-gradient-to-r from-mint/20 via-leaf/10 to-shadow/10" />
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
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border text-text-secondary hover:text-mint hover:border-mint transition-colors shadow-sm"
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
              <p className="text-sm text-mint mt-1">{profile.headline}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-mint" />
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
            <div className="flex h-10 w-full items-center rounded-sm border border-granite bg-muted px-3 text-sm text-text-secondary">
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
            <MapPin className="h-5 w-5 text-leaf" />
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

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          disabled={!isDirty}
          className={isDirty ? "shadow-[0_0_15px_rgba(86,227,159,0.2)]" : ""}
        >
          Save Profile
        </Button>
      </div>
    </form>
  );
}
