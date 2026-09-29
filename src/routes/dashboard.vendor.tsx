import { AuthGate } from "@/components/site/AuthGate";
import { AddProductDialog } from "@/components/site/AddProductDialog";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gavel, Languages, MessageCircle, Pencil, Plus, ShieldCheck, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/marketplace-data";
import { VendorLanguageProvider, useVendorLang } from "@/lib/vendor-language";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { advanceVendorOrder, listVendorOrders } from "@/lib/vendor-orders.functions";

export const Route = createFileRoute("/dashboard/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Listings, Orders & Offers | AppleHub" },
      { name: "description", content: "Manage your Apple listings, stock, orders, buyer requests, auctions and chats." },
      { property: "og:title", content: "AppleHub Vendor Dashboard" },
      { property: "og:description", content: "Listings, stock, orders, buyer requests and auctions for vendors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate role="vendor" title="the vendor dashboard">
      <VendorLanguageProvider>
        <VendorDashboard />
      </VendorLanguageProvider>
    </AuthGate>
  ),
});

type Product = { id: string; title: string; storage: string | null; condition: string; price: number; stock: number; status: string };

function VendorDashboard() {
  const { t, lang, setLang, rtl } = useVendorLang();
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [offerDraft, setOfferDraft] = useState<Record<string, { amount: string; message: string }>>({});

  const profileQ = useQuery({
    queryKey: ["profile-full", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("shop_name, city, delivery_address").eq("id", uid!).maybeSingle();
      return data;
    },
  });

  const productsQ = useQuery({
    queryKey: ["my-products", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_products")
        .select("id, title, storage, condition, price, stock, status")
        .eq("vendor_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const fetchOrders = useServerFn(listVendorOrders);
  const advance = useServerFn(advanceVendorOrder);
  const ordersQ = useQuery({ queryKey: ["vendor-orders", uid], enabled: !!uid, queryFn: () => fetchOrders() });

  const requestsQ = useQuery({
    queryKey: ["vendor-open-requests"],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyer_requests")
        .select("id, title, model, storage, condition_pref, max_budget, city, notes, buyer_id")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const offersQ = useQuery({
    queryKey: ["vendor-offers", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_offers")
        .select("id, request_id, amount, message, status, created_at")
        .eq("vendor_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const auctionsQ = useQuery({
    queryKey: ["vendor-auctions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("id, title, current_price, start_price, ends_at, status")
        .eq("vendor_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const convQ = useQuery({
    queryKey: ["vendor-conversations", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, buyer_name, product_title, last_message_at")
        .eq("vendor_id", uid!)
        .order("last_message_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidateProducts = () => {
    qc.invalidateQueries({ queryKey: ["my-products"] });
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const updateProduct = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("vendor_products").update(p.patch).eq("id", p.id).eq("vendor_id", uid!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Listing updated"); invalidateProducts(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_products").delete().eq("id", id).eq("vendor_id", uid!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Listing deleted"); invalidateProducts(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceOrder = useMutation({
    mutationFn: (orderId: string) => advance({ data: { orderId } }),
    onSuccess: (r) => { toast.success(`Order marked ${r.status}`); qc.invalidateQueries({ queryKey: ["vendor-orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendOffer = useMutation({
    mutationFn: async (requestId: string) => {
      const d = offerDraft[requestId];
      const amount = Number(d?.amount);
      if (!amount || amount <= 0) throw new Error("Enter a valid offer price.");
      const { error } = await supabase.from("request_offers").insert({
        request_id: requestId,
        vendor_id: uid!,
        vendor_name: profileQ.data?.shop_name || user?.email?.split("@")[0] || "Vendor",
        amount,
        message: d?.message?.slice(0, 500) || null,
      });
      if (error) throw error;
    },
    onSuccess: (_r, id) => {
      toast.success("Offer sent to the buyer");
      setOfferDraft((s) => ({ ...s, [id]: { amount: "", message: "" } }));
      qc.invalidateQueries({ queryKey: ["vendor-offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withdrawOffer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("request_offers").delete().eq("id", id).eq("vendor_id", uid!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Offer withdrawn"); qc.invalidateQueries({ queryKey: ["vendor-offers"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = productsQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const offeredIds = new Set((offersQ.data ?? []).map((o) => o.request_id));
  const stats = [
    { label: t("totalSales"), value: formatPrice(orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.vendorTotal, 0)) },
    { label: t("activeListings"), value: String(products.filter((p) => p.status === "active" && p.stock > 0).length) },
    { label: t("pendingOrders"), value: String(orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length) },
    { label: "Units in stock", value: String(products.reduce((s, p) => s + p.stock, 0)) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir={rtl ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {t("approved")}</Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">{t("vendorDashboard")}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            {profileQ.data?.shop_name || "Your shop"}
            {profileQ.data?.city ? ` · ${profileQ.data.city}` : ""}
            <Link to="/profile/vendor" className="ml-2 underline">Edit shop profile</Link>
          </p>
        </div>
        <Button variant="outline" onClick={() => setLang(lang === "en" ? "ur" : "en")}>
          <Languages className="mr-2 h-4 w-4" /> {lang === "en" ? "اردو" : "English"}
        </Button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="products" className="mt-10">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="products">{t("products")}</TabsTrigger>
          <TabsTrigger value="orders">{t("orders")}</TabsTrigger>
          <TabsTrigger value="requests">Buyer requests</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="messages">{t("messages")}</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline"><Link to="/vendor/products"><Pencil className="mr-2 h-4 w-4" /> Edit listings</Link></Button>
            <AddProductDialog><Button><Plus className="mr-2 h-4 w-4" /> {t("addProduct")}</Button></AddProductDialog>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("stock")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQ.isLoading && <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                {!productsQ.isLoading && products.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No products yet — press Add product to publish your first listing.</TableCell></TableRow>
                )}
                {products.map((p) => {
                  const draft = stockEdits[p.id] ?? String(p.stock);
                  const live = p.status === "active" && p.stock > 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-medium">{p.title}</span>
                        <span className="block text-xs text-muted-foreground">{p.storage} · {p.condition}</span>
                      </TableCell>
                      <TableCell className="text-sm">{formatPrice(Number(p.price))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            inputMode="numeric"
                            value={draft}
                            maxLength={5}
                            onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value.replace(/\D/g, "") }))}
                            className="w-20"
                            aria-label={`Stock for ${p.title}`}
                          />
                          {draft !== String(p.stock) && draft !== "" && (
                            <Button size="sm" onClick={() => updateProduct.mutate({ id: p.id, patch: { stock: Number(draft) } }, { onSuccess: () => setStockEdits((s) => { const n = { ...s }; delete n[p.id]; return n; }) })}>
                              Save
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={live ? "outline" : "destructive"}>{p.status !== "active" ? "Hidden" : p.stock > 0 ? "Live" : "Out of stock"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateProduct.mutate({ id: p.id, patch: { status: p.status === "active" ? "hidden" : "active" } })}>
                            {p.status === "active" ? "Hide" : "Publish"}
                          </Button>
                          <Button size="icon" variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => { if (confirm(`Delete ${p.title}?`)) deleteProduct.mutate(p.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQ.isError && <TableRow><TableCell colSpan={5} className="text-sm text-destructive">{(ordersQ.error as Error).message}</TableCell></TableRow>}
              {!ordersQ.isLoading && orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No orders for your products yet.</TableCell></TableRow>}
              {orders.map((o) => (
                <TableRow key={o.orderId}>
                  <TableCell>
                    <span className="font-medium">#{o.orderId.slice(0, 8).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</span>
                  </TableCell>
                  <TableCell className="text-sm">{o.buyerName}</TableCell>
                  <TableCell className="text-sm">{formatPrice(o.vendorTotal)}</TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                    <Badge variant={o.paymentStatus === "paid" ? "outline" : "destructive"} className="capitalize">{o.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" disabled={o.status === "delivered" || advanceOrder.isPending} onClick={() => advanceOrder.mutate(o.orderId)}>
                      {o.status === "delivered" ? "Completed" : "Advance"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-4">
          {!requestsQ.isLoading && (requestsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No open buyer requests right now.</p>}
          {(requestsQ.data ?? []).map((r) => {
            const d = offerDraft[r.id] ?? { amount: "", message: "" };
            const mine = (offersQ.data ?? []).find((o) => o.request_id === r.id);
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[r.model, r.storage, r.condition_pref, r.city].filter(Boolean).join(" · ")} · budget up to {formatPrice(Number(r.max_budget))}
                </p>
                {r.notes && <p className="mt-2 text-sm">{r.notes}</p>}
                {offeredIds.has(r.id) && mine ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <Badge variant="secondary" className="capitalize">Your offer: {formatPrice(Number(mine.amount))} · {mine.status}</Badge>
                    {mine.status === "pending" && <Button size="sm" variant="outline" onClick={() => withdrawOffer.mutate(mine.id)}>Withdraw</Button>}
                  </div>
                ) : r.buyer_id === uid ? null : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                    <Input inputMode="numeric" placeholder="Your price (PKR)" maxLength={9} value={d.amount} onChange={(e) => setOfferDraft((s) => ({ ...s, [r.id]: { ...d, amount: e.target.value.replace(/\D/g, "") } }))} />
                    <Textarea rows={1} maxLength={500} placeholder="Message to buyer (optional)" value={d.message} onChange={(e) => setOfferDraft((s) => ({ ...s, [r.id]: { ...d, message: e.target.value } }))} />
                    <Button disabled={sendOffer.isPending} onClick={() => sendOffer.mutate(r.id)}>Send offer</Button>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="auctions" className="mt-6 space-y-3">
          <div className="flex justify-end"><Button asChild><Link to="/auctions"><Gavel className="mr-2 h-4 w-4" /> Go to auctions</Link></Button></div>
          {!auctionsQ.isLoading && (auctionsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">You haven't started any auctions yet.</p>}
          {(auctionsQ.data ?? []).map((a) => {
            const ended = a.status !== "live" || new Date(a.ends_at) <= new Date();
            return (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Current bid {formatPrice(Number(a.current_price))} · ends {new Date(a.ends_at).toLocaleString()}</p>
                </div>
                <Badge variant={ended ? "secondary" : "outline"}>{ended ? "Ended" : "Live"}</Badge>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="messages" className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-sm">Chat with customers who messaged your shop.</p>
            <Button asChild size="sm"><Link to="/vendor/messages"><MessageCircle className="mr-2 h-4 w-4" /> Message buyers</Link></Button>
          </div>
          {!convQ.isLoading && (convQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
          {(convQ.data ?? []).map((c) => (
            <Link key={c.id} to="/vendor/messages" className="block rounded-2xl border bg-card p-4 shadow-sm hover:bg-accent">
              <p className="font-medium">{c.buyer_name}</p>
              <p className="text-xs text-muted-foreground">{c.product_title || "General enquiry"} · {new Date(c.last_message_at).toLocaleString()}</p>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
