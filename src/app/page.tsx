import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, FileText, Target, Zap, Shield, CheckCircle2, Star, TrendingUp, Play } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function HomePage() {
  // If already logged in, go straight to dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">
            Nextzen Orbit
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-secondary/15 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-light/10 to-secondary/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Job Search Platform</span>
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            Land your dream job
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">
              10x faster
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-2xl text-lg text-text-secondary leading-relaxed">
            AI-powered resume optimization, job matching, and application tracking.
            Built for ambitious professionals who want to accelerate their career.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-8 py-4 text-base font-semibold text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Play className="h-5 w-5 text-primary" />
              See How It Works
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-stone">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-stone mt-1">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">50K+</p>
              <p className="text-sm text-stone mt-1">Resumes Created</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">85%</p>
              <p className="text-sm text-stone mt-1">Interview Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section id="features" className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary mb-6">
              <Zap className="h-4 w-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From AI-powered resume optimization to intelligent job matching, we&apos;ve got you covered.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 - Large */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-8 hover:border-primary/40 transition-all duration-300">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white mb-6 shadow-lg shadow-primary/25">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">AI Resume Parser</h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  Upload your resume in PDF or DOCX format. Our AI instantly extracts and structures every detail —
                  contact info, work experience, skills, education, and more.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">PDF Support</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">DOCX Support</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Instant Parsing</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-card border border-border p-8 hover:border-secondary/40 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary mb-6">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Job Tailoring</h3>
                <p className="text-text-secondary leading-relaxed">
                  Paste any job description. AI rewrites your resume to match keywords and boost your ATS score significantly.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-card border border-border p-8 hover:border-success/40 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-colors" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success mb-6">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Application Tracker</h3>
                <p className="text-text-secondary leading-relaxed">
                  Track every application from applied to offer. Never lose track of where you stand in your job search.
                </p>
              </div>
            </div>

            {/* Feature 4 - Large */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 border border-stone-700 p-8">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-white mb-6">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Built for Indian Professionals</h3>
                <p className="text-stone-300 leading-relaxed mb-6">
                  Seamless Razorpay and Cashfree payments, INR pricing, and resume formats that Indian recruiters expect.
                  Optimized for the Indian job market.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 border-2 border-stone-800" />
                    ))}
                  </div>
                  <span className="text-sm text-stone-400">Join 10,000+ professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial Section ── */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Star className="h-4 w-4" />
            <span>Loved by thousands</span>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-12">
            What our users say
          </h2>

          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-8xl text-primary/10 font-serif">&ldquo;</div>
            <blockquote className="relative z-10 text-2xl text-foreground font-medium leading-relaxed mb-8">
              JobSearch AI helped me land interviews at 3 top companies within 2 weeks.
              The AI-tailored resume made all the difference!
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Priya Sharma</p>
                <p className="text-sm text-stone">Software Engineer at Google</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 p-12 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to accelerate your career?
              </h2>
              <p className="text-lg text-stone-300 mb-8 max-w-xl mx-auto">
                Join thousands of professionals who&apos;ve already transformed their job search with AI.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-light px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all"
              >
                Start Your Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-4 text-sm text-stone-400">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-foreground">JobSearch AI</span>
          </div>
          <p className="text-sm text-stone">
            &copy; {new Date().getFullYear()} JobSearch AI · Built for ambitious professionals
          </p>
          <div className="flex items-center gap-6 text-sm text-stone">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
