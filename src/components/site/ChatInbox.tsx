import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Side = "buyer" | "vendor";

export function ChatInbox({ side, initialId }: { side: Side; initialId?: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialId) setActiveId(initialId);
  }, [initialId]);

  const convs = useQuery({
    queryKey: ["conversations", side, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const col = side === "buyer" ? "buyer_id" : "vendor_id";
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq(col, user!.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const msgs = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`inbox-${side}-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const cid = (p.new as { conversation_id: string }).conversation_id;
        qc.invalidateQueries({ queryKey: ["messages", cid] });
        qc.invalidateQueries({ queryKey: ["conversations", side, user.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, side, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.data?.length]);

  const active = convs.data?.find((c) => c.id === activeId);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, body: body.slice(0, 2000) });
    setSending(false);
    if (error) { toast.error("Message could not be sent"); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", activeId] });
    qc.invalidateQueries({ queryKey: ["conversations", side, user.id] });
  }

  const otherName = (c: NonNullable<typeof active>) =>
    side === "buyer" ? c.vendor_name : c.buyer_name;

  return (
    <div className="grid h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[300px_1fr]">
      <aside className={cn("overflow-y-auto border-r", activeId && "hidden md:block")}>
        {convs.isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="size-5 animate-spin" /></div>
        ) : !convs.data?.length ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 size-6" />
            {side === "buyer"
              ? "No chats yet. Tap “Message vendor” on any vendor product to start."
              : "No customer messages yet. Buyers will appear here when they message you."}
          </div>
        ) : (
          convs.data.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "block w-full border-b px-4 py-3 text-left hover:bg-secondary",
                c.id === activeId && "bg-secondary",
              )}
            >
              <p className="truncate font-medium">{otherName(c)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.product_title ?? "General enquiry"} · {new Date(c.last_message_at).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </aside>

      <section className={cn("flex min-h-0 flex-col", !activeId && "hidden md:flex")}>
        {!active ? (
          <div className="m-auto text-sm text-muted-foreground">Select a conversation</div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b px-4 py-3">
              <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back">
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <p className="truncate font-semibold">{otherName(active)}</p>
                <p className="truncate text-xs text-muted-foreground">{active.product_title ?? "General enquiry"}</p>
              </div>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.data?.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {msgs.data?.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">Say hello to start the chat.</p>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                maxLength={2000}
              />
              <Button type="submit" disabled={sending || !text.trim()} aria-label="Send">
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

/** Buyer starts (or reopens) a chat with a vendor. Returns the conversation id. */
export async function openConversation(opts: {
  buyerId: string;
  buyerName: string;
  vendorId: string;
  vendorName: string;
  productId?: string | null;
  productTitle?: string | null;
}) {
  let q = supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", opts.buyerId)
    .eq("vendor_id", opts.vendorId);
  q = opts.productId ? q.eq("product_id", opts.productId) : q.is("product_id", null);
  const { data: existing } = await q.maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: opts.buyerId,
      buyer_name: opts.buyerName,
      vendor_id: opts.vendorId,
      vendor_name: opts.vendorName,
      product_id: opts.productId ?? null,
      product_title: opts.productTitle ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
