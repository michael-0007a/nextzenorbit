import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Network,
  CheckCircle2,
  Play,
  FileText,
  Target,
  Briefcase,
  Search,
  PenTool,
} from "lucide-react";
import { PricingSection } from "@/components/marketing/pricing-section";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error;
  const errorCode = resolvedParams.error_code;
  const errorDescription = resolvedParams.error_description;

  if (error) {
    let message = "Authentication failed. Please try signing in again.";
    if (errorCode === "flow_state_already_used") {
      message = "Your login link or session has already been used or expired. Please try signing in again.";
    } else if (errorDescription && typeof errorDescription === "string") {
      message = errorDescription;
    }
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const features = [
    {
      title: "AI Resume Builder",
      description:
        "Craft premium resumes with guided structure, ATS-ready formatting, and instant clarity scoring.",
      icon: FileText,
    },
    {
      title: "Job Analyzer",
      description:
        "Paste any job description to get match scores, keyword gaps, and tailored improvements.",
      icon: Target,
    },
    {
      title: "Application Tracker",
      description:
        "Manage every opportunity from applied to offer with a visual pipeline and smart follow-ups.",
      icon: Briefcase,
    },
    {
      title: "Cover Letter Studio",
      description:
        "Generate refined cover letters that mirror your resume and the role in seconds.",
      icon: PenTool,
    },
    {
      title: "Job Search Radar",
      description:
        "Discover opportunities faster with AI-assisted search and auto-apply queueing.",
      icon: Search,
    },
    {
      title: "Career Intelligence",
      description:
        "Track momentum, interview rates, and next-best actions from a unified dashboard.",
      icon: BarChart3,
    },
  ];

  const platformSteps = [
    "Upload your resume. ORBIT extracts every signal instantly.",
    "Analyze job descriptions and get precision match scores.",
    "Tailor resumes and cover letters in one click.",
    "Track applications and optimize each follow-up.",
  ];

  const integrations = [
    {
      name: "ATS Ready",
      description: "Formatting tuned for ATS parsing and clean exports.",
      src: "/file.svg",
      invert: true,
    },
    {
      name: "Global Boards",
      description: "Apply confidently across top job boards and portals.",
      src: "/globe.svg",
      invert: true,
    },
    {
      name: "Smart Workflows",
      description: "Auto-apply queue and follow-ups in one flow.",
      src: "/window.svg",
      invert: true,
    },
    {
      name: "NEXTZEN",
      description: "Powered by the NEXTZEN orbit engine.",
      src: "/only%20logo.png",
      invert: false,
    },
  ];



  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/Nextzen%20Orbit%20white.png"
              alt="NEXTZEN ORBIT"
              width={170}
              height={26}
              className="h-5 w-auto"
            />
          </Link>

          <div className="hidden items-center gap-8 text-sm text-text-secondary lg:flex">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#platform" className="hover:text-foreground transition-colors">AI Platform</Link>
            <Link href="#analytics" className="hover:text-foreground transition-colors">Analytics</Link>
            <Link href="#integrations" className="hover:text-foreground transition-colors">Integrations</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(255,0,61,0.35)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden pb-24 pt-4 sm:pt-6">
          <div className="absolute inset-0 hidden bg-space opacity-70 dark:block" />
          <div className="pointer-events-none absolute -left-28 top-12 hidden h-80 w-80 rounded-full bg-primary/20 blur-3xl dark:block" />
          <div className="pointer-events-none absolute -right-24 top-16 hidden h-96 w-96 rounded-full bg-secondary/20 blur-3xl dark:block" />

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.4em] text-text-secondary">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Made for job seekers
                </div>

                <h1 className="font-display mt-7 text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  Find your next role,
                  <span className="block gradient-text">without the chaos.</span>
                </h1>

                <p className="mt-5 max-w-xl text-lg text-text-secondary">
                  See your fit fast, tailor your resume, and track every application in one calm place.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-light px-8 py-4 text-base font-semibold text-white shadow-[0_20px_45px_rgba(255,0,61,0.35)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-border bg-white/5 px-8 py-4 text-base font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-white"
                  >
                    See plans
                    <Play className="h-5 w-5 text-primary" />
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Free to start
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Resume export ready
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Simple tracking
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <Image
                  src="/hero-clean.png"
                  alt="Job search illustration"
                  width={720}
                  height={900}
                  className="h-auto w-full max-w-[520px] drop-shadow-none dark:drop-shadow-[0_35px_90px_rgba(0,0,0,0.5)]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-text-secondary">
                <Zap className="h-4 w-4 text-primary" />
                Premium Features
              </div>
              <h2 className="font-display mt-6 text-4xl font-semibold text-foreground sm:text-5xl">
                Everything you need to win your next role
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Build resumes, analyze roles, and track every application with premium tools designed for ambitious
                professionals.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="glass-card group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-300 group-hover:opacity-80" />
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary shadow-[0_0_24px_rgba(255,0,61,0.3)]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="platform" className="relative py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="relative overflow-hidden rounded-[40px] border border-border bg-surface/80 p-10 md:p-14">
              <div className="absolute inset-0 bg-space opacity-50" />
              <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-text-secondary">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Platform
                  </div>
                  <h2 className="font-display mt-6 text-4xl font-semibold text-foreground">
                    The intelligence layer for job search excellence
                  </h2>
                  <p className="mt-4 text-lg text-text-secondary">
                    NEXTZEN ORBIT unifies resume intelligence, job analysis, and application tracking so you can move at
                    orbital speed without losing precision.
                  </p>
                  <div className="mt-6 space-y-4">
                    {platformSteps.map((step) => (
                      <div key={step} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                        <p className="text-sm text-text-secondary">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Resume intelligence
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-secondary" />
                      AI job analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      Pipeline tracking
                    </div>
                  </div>
                </div>

                <div className="glass-card relative rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Orbit Modules</p>
                    <div className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-text-secondary">
                      6 Modules
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      { name: "Resume Studio", detail: "Build premium templates" },
                      { name: "Job Analyzer", detail: "Match score and insights" },
                      { name: "Cover Letters", detail: "Personalized in seconds" },
                      { name: "Application Tracker", detail: "Pipeline clarity" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-2xl border border-border bg-white/5 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-text-secondary">{item.detail}</p>
                        </div>
                        <div className="h-2 w-16 rounded-full bg-gradient-to-r from-primary/60 to-accent/60" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-border bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Automation coverage</span>
                      <span className="text-foreground">91%</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-white/5">
                      <div className="h-2 w-[91%] rounded-full bg-gradient-to-r from-primary to-primary-light" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="analytics" className="relative py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-text-secondary">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Analytics
                </div>
                <h2 className="font-display mt-6 text-4xl font-semibold text-foreground">
                  Command your job search momentum
                </h2>
                <p className="mt-4 text-lg text-text-secondary">
                  Track match scores, interview rates, and pipeline velocity with cinematic clarity.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Live match score monitoring across roles.",
                    "Application pipeline health with follow-up alerts.",
                    "Outcome analytics to optimize every resume iteration.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm text-text-secondary">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card relative rounded-[32px] p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Orbit Analytics</p>
                    <p className="text-lg font-semibold text-foreground">Interview Momentum</p>
                  </div>
                  <div className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-text-secondary">
                    Live
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-border bg-white/5 p-6">
                  <svg viewBox="0 0 320 120" className="h-32 w-full">
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FF003D" />
                        <stop offset="60%" stopColor="#FF2B6A" />
                        <stop offset="100%" stopColor="#00D1FF" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M5 95 C40 70, 70 35, 110 40 C150 45, 170 85, 210 75 C250 65, 270 30, 315 25"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 95 C40 70, 70 35, 110 40 C150 45, 170 85, 210 75 C250 65, 270 30, 315 25"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                    <span>Week 5</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { label: "Interview rate", value: "+41%" },
                    { label: "Response time", value: "3.2d" },
                    { label: "Active roles", value: "18" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-border bg-white/5 p-4">
                      <p className="text-xs text-text-secondary">{metric.label}</p>
                      <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="relative py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-text-secondary">
                  <Network className="h-4 w-4 text-primary" />
                  Integrations
                </div>
                <h2 className="font-display mt-6 text-4xl font-semibold text-foreground">Connected to every workflow</h2>
                <p className="mt-4 text-lg text-text-secondary">
                  Export-ready resumes, ATS-friendly formatting, and seamless compatibility across your stack.
                </p>
                <div className="mt-6 space-y-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    PDF and DOCX exports that stay clean across platforms.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                    ATS parsing that keeps your formatting intact.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Auto-apply and follow-up flows in one place.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="glass-card flex flex-col items-start gap-3 rounded-2xl px-5 py-5"
                  >
                    <Image
                      src={integration.src}
                      alt={integration.name}
                      width={80}
                      height={32}
                      className={`h-7 w-auto opacity-80 ${integration.invert ? "invert" : ""}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="relative py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-text-secondary">
                <Shield className="h-4 w-4 text-primary" />
                Pricing
              </div>
              <h2 className="font-display mt-6 text-4xl font-semibold text-foreground">Plans for every career orbit</h2>
              <p className="mt-4 text-lg text-text-secondary">
                Choose the tier that matches your ambition. Upgrade anytime.
              </p>
            </div>

            <PricingSection />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20">
              <Image src="/only%20logo.png" alt="NEXTZEN ORBIT" width={22} height={22} />
            </div>
            <div>
              <Image
                src="/Nextzen%20Orbit%20white.png"
                alt="NEXTZEN ORBIT"
                width={160}
                height={24}
                className="h-4 w-auto"
              />
              <p className="text-xs text-text-secondary">Build Beyond Limits.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#platform" className="hover:text-foreground transition-colors">AI Platform</Link>
            <Link href="#analytics" className="hover:text-foreground transition-colors">Analytics</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
          </div>

          <p className="text-xs text-text-secondary">
            {new Date().getFullYear()} NEXTZEN ORBIT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}