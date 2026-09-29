import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/site/AuthGate";
import { ChatInbox } from "@/components/site/ChatInbox";

export const Route = createFileRoute("/vendor/messages")({
  head: () => ({
    meta: [
      { title: "Message Buyers — Vendor Inbox | AppleHub" },
      { name: "description", content: "Reply to customers asking about your Apple products." },
      { property: "og:title", content: "AppleHub vendor inbox" },
      { property: "og:description", content: "Chat with your buyers in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate role="vendor" title="your customer messages">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Message buyers</h1>
        <p className="mb-5 text-sm text-muted-foreground">Customers who contacted your shop.</p>
        <ChatInbox side="vendor" />
      </div>
    </AuthGate>
  ),
});
