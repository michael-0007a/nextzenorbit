"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}

/**
 * Avatar component with image and fallback initials.
 *
 * @example
 * <Avatar src="/avatar.jpg" name="John Doe" size="md" />
 * <Avatar name="Priya Sharma" size="lg" /> // Shows "PS"
 */
export function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-primary/30 to-primary/10 text-primary",
        "font-semibold select-none",
        avatarSizes[size],
        className
      )}
      role="img"
      aria-label={alt || name || "User avatar"}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt || name || "Avatar"}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          sizes={
            size === "xl"
              ? "80px"
              : size === "lg"
              ? "56px"
              : size === "md"
              ? "40px"
              : "32px"
          }
        />
      ) : (
        <span aria-hidden="true">{initials || "?"}</span>
      )}
    </div>
  );
}
