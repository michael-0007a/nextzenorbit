import { PageHeader } from "@/components/layout/page-header";
import { MockInterview } from "@/components/interviews/mock-interview";

export default function MockInterviewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mock Interview" description="Practise five questions for your target role and get scored feedback on every answer." />
      <MockInterview />
    </div>
  );
}
