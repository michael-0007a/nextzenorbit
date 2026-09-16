export const metadata = {
  title: "Terms of Service | NextZenOrbit",
  description: "Terms and conditions for using NextZenOrbit.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: September 16, 2026
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-text-secondary space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using NextZenOrbit, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
          <p>
            NextZenOrbit provides career tools to selected candidates. To apply, register, provide consent, complete your professional profile and upload a resume. Our supervisors or superadmins review your application. Registration does not guarantee acceptance. Rejected applicants cannot register again using the same email or matching phone number, including under another email. Phone numbers are supplied by applicants; SMS verification is not required.
          </p>
        </section>

        <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. No Job Guarantee</h2>
          <p>
            <strong className="text-foreground">We do not guarantee employment, interviews, or any specific outcomes from using our service.</strong> NextZenOrbit provides tools to assist in your job search, but the success of your job applications depends on various factors outside of our control, including your qualifications, the job market, and employer decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">4. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to provide accurate, current, and complete information.</li>
            <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
            <li>You are solely responsible for the content of your resumes and applications submitted through our platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Subscriptions and Payments</h2>
          <p>
            Only approved candidates can choose a plan and make payment. Approval alone does not grant access to services. Resume generation, cover letters and other career services require a confirmed payment and an active paid subscription. Payments are processed via PayU in INR. Each successful monthly purchase provides 30 days of access; another confirmed payment is required to extend access. If payment has been debited but access has not updated, use Check payment status on your plan page or contact support before paying again.
          </p>
        </section>

        <section className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. No Refunds Policy</h2>
          <p>
            <strong className="text-foreground">All purchases are final and non-refundable.</strong> Due to the nature of our digital services and the immediate costs incurred by AI processing and recruiter support, we cannot offer refunds, prorated or otherwise, for any subscription plan. Please review our <a href="/refund" className="text-primary hover:underline">Refund Policy</a> for more details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are owned by NextZenOrbit and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">8. Limitation of Liability</h2>
          <p>
            In no event shall NextZenOrbit, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">9. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
          </p>
        </section>

        <div className="mt-12 p-6 glass-card rounded-2xl border-secondary/20">
          <h3 className="text-foreground font-semibold mb-2">Questions?</h3>
          <p>If you have any questions about these Terms, please contact us at support@nextzenorbit.com.</p>
        </div>
      </div>
    </div>
  );
}
