export const metadata = {
  title: "Refund Policy | NextZenOrbit",
  description: "Refund policy and terms for NextZenOrbit subscriptions.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-text-secondary space-y-8">
        <section className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. No Refunds</h2>
          <p>
            <strong className="text-foreground">All purchases and subscription payments are final and non-refundable.</strong>
          </p>
          <p className="mt-2">
            Due to the nature of our digital services, which include instant access to AI processing resources, automated application queues, and immediate recruiter support allocation, we incur upfront costs as soon as a subscription is activated. As a result, we cannot offer refunds, prorated or otherwise, for any subscription plan under any circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Subscription Cancellations</h2>
          <p>
            You may cancel your subscription at any time. If you cancel, your subscription will remain active until the end of your current billing cycle. You will not be charged for the subsequent billing cycle. Canceling your subscription does not entitle you to a refund for the period you have already paid for.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Failed Payments & Account Access</h2>
          <p>
            If a payment fails or is disputed, your access to premium features (Plan 1, Plan 2, Plan 3) will be immediately suspended. We reserve the right to suspend or terminate accounts that initiate fraudulent chargebacks or payment disputes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Plan Changes</h2>
          <p>
            If you upgrade your plan, the change is effective immediately and you will be billed for the new plan rate. Upgrades are non-refundable. If you downgrade, the downgrade will take effect at the end of your current billing cycle. No prorated refunds will be issued for downgrades.
          </p>
        </section>

        <div className="mt-12 p-6 glass-card rounded-2xl border-secondary/20">
          <h3 className="text-foreground font-semibold mb-2">Questions?</h3>
          <p>If you have any questions about this policy, please contact our billing support at support@nextzenorbit.com.</p>
        </div>
      </div>
    </div>
  );
}
