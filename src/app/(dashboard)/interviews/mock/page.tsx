import { Mic } from "lucide-react";
import { FeatureHero } from "@/components/layout/feature-hero";
import { MockInterview } from "@/components/interviews/mock-interview";

export default function MockInterviewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FeatureHero icon={Mic} title="Mock Interview" description="Practise five questions for your target role and get scored feedback with a stronger sample answer for each." ai />
      <MockInterview />
    </div>
  );
}
