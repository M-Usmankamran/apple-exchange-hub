import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/site/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { pkCities, storageSizes } from "@/lib/form-options";
import { formatPrice } from "@/lib/marketplace-data";

export const Route = createFileRoute("/vendor/products")({
  head: () => ({
    meta: [
      { title: "My Products — Add & Manage Listings | AppleHub" },
      { name: "description", content: "Vendors add and manage their Apple product listings." },
      { property: "og:title", content: "Manage your AppleHub products" },
      { property: "og:description", content: "Add iPhones, MacBooks, iPads and more to your shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate role="vendor" title="your products">
      <VendorProducts />
    </AuthGate>
  ),
});

const cats = [
  ["iphone", "iPhone"],
  ["ipad", "iPad"],
  ["macbook", "MacBook"],
  ["watch", "Apple Watch"],
  ["airpods", "AirPods"],
  ["ipod", "iPod"],
] as const;
const conds = ["New", "Like New", "Excellent", "Good", "Fair"];

const empty = { title: "", category: "iphone", model: "", storage: "128GB", condition: "New", city: "Lahore", price: "", stock: "1", image_url: "", description: "" };

function VendorProducts() {
  const { user, displayName } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const list = useQuery({
    queryKey: ["my-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_products").select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const price = Number(f.price);
    if (!f.title.trim() || !(price > 0)) return toast.error("Add a product name and a valid price");
    setSaving(true);
    const { data: prof } = await supabase.from("profiles").select("shop_name").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("vendor_products").insert({
      vendor_id: user.id,
      vendor_name: prof?.shop_name || displayName || "AppleHub Vendor",
      title: f.title.trim().slice(0, 120),
      category: f.category,
      model: f.model.trim() || null,
      storage: f.storage,
      condition: f.condition,
      city: f.city,
      price,
      stock: Math.max(0, parseInt(f.stock) || 0),
      image_url: /^https:\/\//.test(f.image_url) ? f.image_url : null,
      description: f.description.trim().slice(0, 1000) || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Product added to your shop");
    setF(empty);
    qc.invalidateQueries({ queryKey: ["my-products"] });
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("vendor_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-products"] });
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  }

  const sel = (k: keyof typeof empty, opts: readonly (readonly [string, string])[] | string[]) => (
    <Select value={f[k]} onValueChange={set(k)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {opts.map((o) => {
          const [v, l] = typeof o === "string" ? [o, o] : o;
          return <SelectItem key={v} value={v}>{l}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">My products</h1>
      <p className="mb-5 text-sm text-muted-foreground">Add products to your shop. Buyers can message you about them.</p>

      <form onSubmit={add} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Product name</Label><Input value={f.title} maxLength={120} onChange={(e) => set("title")(e.target.value)} placeholder="iPhone 15 Pro Max 256GB" /></div>
        <div><Label>Category</Label>{sel("category", cats)}</div>
        <div><Label>Model</Label><Input value={f.model} maxLength={60} onChange={(e) => set("model")(e.target.value)} /></div>
        <div><Label>Storage</Label>{sel("storage", storageSizes)}</div>
        <div><Label>Condition</Label>{sel("condition", conds)}</div>
        <div><Label>City</Label>{sel("city", pkCities)}</div>
        <div><Label>Price (PKR)</Label><Input inputMode="numeric" value={f.price} onChange={(e) => set("price")(e.target.value.replace(/\D/g, "").slice(0, 9))} /></div>
        <div><Label>Stock</Label><Input inputMode="numeric" value={f.stock} onChange={(e) => set("stock")(e.target.value.replace(/\D/g, "").slice(0, 4))} /></div>
        <div><Label>Image link (optional)</Label><Input value={f.image_url} onChange={(e) => set("image_url")(e.target.value)} placeholder="https://…" /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea value={f.description} maxLength={1000} onChange={(e) => set("description")(e.target.value)} /></div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add product
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {list.data?.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{[p.storage, p.condition, p.city].filter(Boolean).join(" · ")} · Stock {p.stock}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatPrice(Number(p.price))}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 className="size-4" /></Button>
            </div>
          </div>
        ))}
        {list.data?.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}
