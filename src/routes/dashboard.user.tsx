import { AuthGate } from "@/components/site/AuthGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Package, Repeat, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/marketplace-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfileForm } from "@/hooks/use-profile-form";
import { MAX_PHONE_LENGTH, formatPhone } from "@/lib/form-options";

export const Route = createFileRoute("/dashboard/user")({
  head: () => ({
    meta: [
      { title: "My Account — Orders, Sell Requests & Exchanges | AppleHub" },
      {
        name: "description",
        content:
          "Track your Apple orders, follow sell requests and exchange offers, manage your wishlist and update your profile.",
      },
      { property: "og:title", content: "Your AppleHub account" },
      { property: "og:description", content: "Orders, sell requests, exchanges, wishlist and profile in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate title="your dashboard">
      <UserDashboard />
    </AuthGate>
  ),
});

const steps = ["pending", "confirmed", "shipped", "delivered"];
const date = (s: string) => new Date(s).toLocaleDateString();

function Empty({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      {text}{" "}
      <Link to={to} className="underline">
        {cta}
      </Link>
    </p>
  );
}

function UserDashboard() {
  const { user, displayName } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ["my-orders", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_amount,status,payment_status,created_at,order_items(product_name,qty,vendor_name)")
        .eq("buyer_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const sells = useQuery({
    queryKey: ["my-sell", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("sell_requests").select("*").eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const exchanges = useQuery({
    queryKey: ["my-exchange", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("exchange_requests").select("*").eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const wishlist = useQuery({
    queryKey: ["my-wishlist", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("*").eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const complaints = useQuery({
    queryKey: ["my-complaints", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const run = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await fn();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Saved");
      for (const k of ["my-sell", "my-exchange", "my-wishlist", "my-complaints"]) qc.invalidateQueries({ queryKey: [k] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [complaint, setComplaint] = useState({ topic: "", against: "", detail: "" });
  const fileComplaint = () => {
    if (complaint.topic.trim().length < 3 || complaint.detail.trim().length < 10) {
      toast.error("Add a topic and at least 10 characters of detail");
      return;
    }
    run.mutate(() =>
      supabase.from("complaints").insert({
        user_id: uid!,
        from_name: displayName || "Customer",
        topic: complaint.topic.trim().slice(0, 120),
        against: complaint.against.trim().slice(0, 120) || "—",
        detail: complaint.detail.trim().slice(0, 1000),
        status: "open",
      }),
    );
    setComplaint({ topic: "", against: "", detail: "" });
  };

  const { form, set, save, loadingProfile } = useProfileForm();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Buyer account
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi, {displayName || "there"}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Track orders, follow your sell and exchange requests, and keep your details up to date.
          </p>
        </div>
        <Button asChild>
          <Link to="/shop">Continue shopping</Link>
        </Button>
      </header>

      <Tabs defaultValue="orders" className="mt-10">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="sell">Sell requests</TabsTrigger>
          <TabsTrigger value="exchange">Exchanges</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {orders.data?.length === 0 && <Empty text="No orders yet." to="/shop" cta="Browse the shop" />}
          {orders.data?.map((o) => {
            const step = Math.max(0, steps.indexOf(o.status)) + 1;
            return (
              <div key={o.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {o.order_items.map((i) => `${i.product_name} ×${i.qty}`).join(", ") || "Order"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)} · {date(o.created_at)} · {formatPrice(Number(o.total_amount))} · {o.payment_status}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                </div>
                {o.status !== "cancelled" && o.status !== "refunded" && (
                  <>
                    <Progress value={(step / steps.length) * 100} className="mt-4" />
                    <div className="mt-2 flex justify-between text-[11px] capitalize text-muted-foreground">
                      {steps.map((s) => <span key={s}>{s}</span>)}
                    </div>
                  </>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/order/$id" params={{ id: o.id }}>
                      <Package className="mr-2 h-4 w-4" /> View order
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/messages">
                      <MessageCircle className="mr-2 h-4 w-4" /> Message vendor
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="sell" className="mt-6 space-y-4">
          {sells.data?.length === 0 && <Empty text="No sell requests yet." to="/sell" cta="Sell a device" />}
          {sells.data?.map((s) => (
            <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4" /> {s.model} {s.storage}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.condition} · battery {s.battery}% · asking {formatPrice(Number(s.asking_price))} · {s.radius_km} km · {date(s.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                {s.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => run.mutate(() => supabase.from("sell_requests").update({ status: "cancelled" }).eq("id", s.id))}>
                    Cancel
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => run.mutate(() => supabase.from("sell_requests").delete().eq("id", s.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="exchange" className="mt-6 space-y-4">
          {exchanges.data?.length === 0 && <Empty text="No exchange requests yet." to="/exchange" cta="Start an exchange" />}
          {exchanges.data?.map((e) => (
            <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Repeat className="h-4 w-4" /> {e.give_model} {e.give_storage} → {e.target_name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your value {formatPrice(Number(e.give_value))} · you pay {formatPrice(Math.max(0, Number(e.difference)))} · {date(e.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{e.status}</Badge>
                {e.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => run.mutate(() => supabase.from("exchange_requests").update({ status: "cancelled" }).eq("id", e.id))}>
                    Cancel
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => run.mutate(() => supabase.from("exchange_requests").delete().eq("id", e.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {wishlist.data?.length === 0 && <Empty text="Nothing saved yet — press Save on any product." to="/shop" cta="Browse the shop" />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.data?.map((w) => (
              <div key={w.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                {w.image_url && <img src={w.image_url} alt={w.product_name} className="mb-3 aspect-square w-full rounded-xl object-cover" />}
                <Link to="/product/$id" params={{ id: w.product_id }} className="font-semibold hover:underline">
                  {w.product_name}
                </Link>
                <p className="text-sm text-muted-foreground">{formatPrice(Number(w.price))}</p>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => run.mutate(() => supabase.from("wishlist_items").delete().eq("id", w.id))}>
                  <Heart className="mr-2 h-4 w-4" /> Remove
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="complaints" className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">File a complaint</h3>
            <div className="space-y-2">
              <Label htmlFor="ctopic">Topic</Label>
              <Input id="ctopic" maxLength={120} value={complaint.topic} onChange={(e) => setComplaint({ ...complaint, topic: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cagainst">Vendor or order (optional)</Label>
              <Input id="cagainst" maxLength={120} value={complaint.against} onChange={(e) => setComplaint({ ...complaint, against: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdetail">What happened?</Label>
              <Textarea id="cdetail" maxLength={1000} rows={4} value={complaint.detail} onChange={(e) => setComplaint({ ...complaint, detail: e.target.value })} />
            </div>
            <Button onClick={fileComplaint} disabled={run.isPending}>Submit complaint</Button>
          </div>
          <div className="space-y-3">
            {complaints.data?.length === 0 && <p className="text-sm text-muted-foreground">You haven't filed any complaints.</p>}
            {complaints.data?.map((c) => (
              <div key={c.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold">{c.topic}</h4>
                  <Badge variant="secondary" className="capitalize">{c.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.against} · {date(c.created_at)}</p>
                <p className="mt-2 text-sm">{c.detail}</p>
                {c.resolution && <p className="mt-2 text-sm text-muted-foreground">Admin reply: {c.resolution}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6 max-w-lg space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="uname">Full name</Label>
            <Input id="uname" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} disabled={loadingProfile} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uemail">Email</Label>
            <Input id="uemail" value={user?.email ?? ""} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uphone">Mobile</Label>
            <Input id="uphone" inputMode="numeric" maxLength={MAX_PHONE_LENGTH} value={form.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uaddr">Delivery address</Label>
            <Input id="uaddr" value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} />
          </div>
          <Button onClick={() => save.mutate(undefined as never)} disabled={save.isPending}>Save changes</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
