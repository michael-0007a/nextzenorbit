import { PageHeader } from "@/components/layout/page-header";
import { MessageThread } from "@/components/messages/message-thread";

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Messages" description="Talk to the Orbit team working on your applications." />
      <MessageThread endpoint="/api/messages" viewer="client" />
    </div>
  );
}
