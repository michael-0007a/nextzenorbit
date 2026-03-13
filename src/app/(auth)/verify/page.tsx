import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-mint-border bg-mint-muted">
        <Mail className="h-7 w-7 text-mint" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
      <p className="text-sm text-text-secondary">
        We&apos;ve sent a verification link to your email address.
        Click the link to activate your account and start your free trial.
      </p>
      <p className="text-xs text-granite">
        Didn&apos;t receive it? Check your spam folder or{" "}
        <Link href="/register" className="text-mint hover:text-leaf transition-colors">
          try again
        </Link>
        .
      </p>
    </div>
  );
}

