import { Shield, Lock, Eye } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | NextZenOrbit",
  description: "Learn how we protect your data and privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-text-secondary">
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-xl mb-4 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Data Protection</h3>
            <p className="text-sm">Your data is encrypted at rest and in transit.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="p-3 bg-secondary/10 rounded-xl mb-4 text-secondary">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Secure Storage</h3>
            <p className="text-sm">We use Supabase for industry-standard secure hosting.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="p-3 bg-accent/10 rounded-xl mb-4 text-accent">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Full Transparency</h3>
            <p className="text-sm">You own your data and can delete it at any time.</p>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">1. Information We Collect</h2>
          <p>
            When you use NextZenOrbit, we collect the following types of information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, and profile picture (via Google OAuth).</li>
            <li><strong>Professional Data:</strong> Resumes, cover letters, and professional preferences you upload or generate.</li>
            <li><strong>Usage Data:</strong> Information about your job search queries and applications processed through our platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process your job applications automatically as requested.</li>
            <li>Generate tailored cover letters and interview notes.</li>
            <li>Communicate with you regarding service updates or account issues.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">3. Data Sharing and Third Parties</h2>
          <p>
            We do not sell your personal data. We only share information with third parties in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> We use third-party services (like OpenAI for generation, and Adzuna for job search) to provide our core features.</li>
            <li><strong>Employers:</strong> When you use our auto-apply feature, your resume and details are shared with the respective employers.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">4. Data Retention and Deletion</h2>
          <p>
            We retain your data as long as your account is active. You can request deletion of your account and all associated data at any time by contacting our support team or using the delete option in your account settings.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">5. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <div className="mt-12 p-6 glass-card rounded-2xl border-primary/20">
            <h3 className="text-foreground font-semibold mb-2">Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@nextzenorbit.com.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
