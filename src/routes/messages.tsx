import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/site/AuthGate";
import { ChatInbox, openConversation } from "@/components/site/ChatInbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Search = { product?: string };

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["product"] === "string" ? { product: s["product"] } : {},
  head: () => ({
    meta: [
      { title: "Message Vendors — Your Chats | AppleHub" },
      { name: "description", content: "Chat directly with verified Apple vendors about their products." },
      { property: "og:title", content: "Message vendors on AppleHub" },
      { property: "og:description", content: "Ask vendors about price, PTA status and pickup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate title="your messages">
      <BuyerMessages />
    </AuthGate>
  ),
});

function BuyerMessages() {
  const { product } = Route.useSearch();
  const { user, displayName } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!product || !user) return;
    (async () => {
      const { data: p } = await supabase
        .from("vendor_products")
        .select("id,title,vendor_id,vendor_name")
        .eq("id", product)
        .maybeSingle();
      if (!p) { toast.error("That product is no longer available"); return; }
      if (p.vendor_id === user.id) { toast.error("You can't message your own shop"); return; }
      try {
        setConvId(
          await openConversation({
            buyerId: user.id,
            buyerName: displayName || "Buyer",
            vendorId: p.vendor_id,
            vendorName: p.vendor_name,
            productId: p.id,
            productTitle: p.title,
          }),
        );
      } catch {
        toast.error("Could not start the chat");
      }
    })();
  }, [product, user, displayName]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Message vendors</h1>
      <p className="mb-5 text-sm text-muted-foreground">Your conversations with vendors.</p>
      <ChatInbox side="buyer" initialId={convId} />
    </div>
  );
}
