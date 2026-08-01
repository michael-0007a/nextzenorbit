export const metadata = {
  title: "Compliance & Legal Disclosures | NextZenOrbit",
  description: "Important compliance information and legal disclosures.",
};

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Compliance & Legal Disclosures
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-text-secondary space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Regulatory Compliance</h2>
          <p>
            NextZenOrbit is committed to complying with all applicable local, national, and international laws regarding data protection and user privacy, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
          </p>
        </section>

        <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Disclosure of No Job Guarantee</h2>
          <p>
            <strong className="text-foreground">NextZenOrbit is a technology platform, not an employment agency.</strong> We provide AI-driven software tools designed to assist in the creation of resumes and the automation of job applications. We do not act as a recruiter on your behalf, and we do not guarantee employment, job interviews, or any specific career outcomes. The "assigned recruiter support" feature provides strategic guidance and feedback but does not promise job placement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Usage & AI Processing</h2>
          <p>
            By using our resume parsing and generation tools, you consent to your data being processed by our AI partners (including but not limited to Groq and OpenAI). We ensure that our partners adhere to strict data security standards. Your data is used solely for the purpose of providing the service and is not sold to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Payment Processing Compliance</h2>
          <p>
            All payment transactions are processed securely through PayU. NextZenOrbit does not store your full credit card information on our servers. We comply with Payment Card Industry Data Security Standards (PCI DSS) through our payment partners.
          </p>
        </section>

        <div className="mt-12 p-6 glass-card rounded-2xl border-secondary/20">
          <h3 className="text-foreground font-semibold mb-2">Legal Inquiries</h3>
          <p>For any compliance or legal inquiries, please contact our legal team at legal@nextzenorbit.com.</p>
        </div>
      </div>
    </div>
  );
}
