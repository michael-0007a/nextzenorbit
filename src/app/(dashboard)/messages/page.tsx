import { MessageSquare } from "lucide-react";
import { FeatureHero } from "@/components/layout/feature-hero";
import { MessageThread } from "@/components/messages/message-thread";

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FeatureHero icon={MessageSquare} title="Messages" description="Talk to the Orbit team working on your applications: preferences, companies to skip, interview news." />
      <MessageThread endpoint="/api/messages" viewer="client" />
    </div>
  );
}
