/**
 * Contact Section — Resume Editor
 */

"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link,
  Globe,
  Code2,
} from "lucide-react";
import type { ResumeContent } from "@/lib/validations/resume";

export function ContactSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ResumeContent>();

  const contactErrors = errors.contact;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-mint" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="Arjun Sharma"
            error={contactErrors?.full_name?.message}
            leftAddon={<User className="h-4 w-4" />}
            {...register("contact.full_name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="arjun@example.com"
            error={contactErrors?.email?.message}
            leftAddon={<Mail className="h-4 w-4" />}
            {...register("contact.email")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="+91 98765 43210"
            error={contactErrors?.phone?.message}
            leftAddon={<Phone className="h-4 w-4" />}
            {...register("contact.phone")}
          />
          <Input
            label="Location"
            placeholder="Bengaluru, India"
            error={contactErrors?.location?.message}
            leftAddon={<MapPin className="h-4 w-4" />}
            {...register("contact.location")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="LinkedIn"
            placeholder="https://linkedin.com/in/..."
            error={contactErrors?.linkedin_url?.message}
            leftAddon={<Link className="h-4 w-4" />}
            {...register("contact.linkedin_url")}
          />
          <Input
            label="Portfolio"
            placeholder="https://yoursite.com"
            error={contactErrors?.portfolio_url?.message}
            leftAddon={<Globe className="h-4 w-4" />}
            {...register("contact.portfolio_url")}
          />
          <Input
            label="GitHub"
            placeholder="https://github.com/..."
            error={contactErrors?.github_url?.message}
            leftAddon={<Code2 className="h-4 w-4" />}
            {...register("contact.github_url")}
          />
        </div>
      </CardBody>
    </Card>
  );
}




