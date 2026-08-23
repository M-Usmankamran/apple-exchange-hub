import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bike, MapPin, MessageCircle, Store, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conditions, formatPrice, storageOptions, vendors } from "@/lib/marketplace-data";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Apple Device — Offers From Nearby Vendors | AppleHub" },
      {
        name: "description",
        content:
          "List your iPhone, iPad or MacBook and receive offers from verified vendors within your chosen radius. Home inspection by rider or sell at the shop.",
      },
      { property: "og:title", content: "Sell your Apple device on AppleHub" },
      {
        property: "og:description",
        content:
          "Get offers from verified vendors near you, then choose home pickup or a shop visit.",
      },
    ],
  }),
  component: SellPage,
});

const sellSchema = z.object({
  model: z.string().trim().min(2, "Enter your device model").max(80),
  storage: z.string().min(2, "Select storage"),
  condition: z.string().min(2, "Select condition"),
  battery: z.coerce.number().min(1).max(100),
  price: z.coerce.number().min(1000, "Enter a realistic asking price").max(2000000),
  details: z.string().trim().max(600).optional(),
});

function SellPage() {
  const [radius, setRadius] = useState(10);
  const [locationShared, setLocationShared] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    model: "",
    storage: "",
    condition: "",
    battery: "90",
    price: "",
    details: "",
  });

  const nearby = vendors.filter((v) => v.distanceKm <= radius);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = sellSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    setSubmitted(true);
    toast.success(`Offer sent to ${nearby.length} vendors near you`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <Badge variant="secondary" className="rounded-full">
          💰 Sell
        </Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Sell your Apple device</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Post your device once — verified vendors inside your radius can see it, chat with
          you, and either send a rider to inspect and pay at your home, or invite you to
          their shop.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Device details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  className="mt-1.5"
                  maxLength={80}
                  placeholder="iPhone 13 Pro"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
              <div>
                <Label>Storage</Label>
                <Select
                  value={form.storage}
                  onValueChange={(v) => setForm({ ...form, storage: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => setForm({ ...form, condition: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="battery">Battery health (%)</Label>
                <Input
                  id="battery"
                  className="mt-1.5"
                  inputMode="numeric"
                  maxLength={3}
                  value={form.battery}
                  onChange={(e) => setForm({ ...form, battery: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Asking price (PKR)</Label>
                <Input
                  id="price"
                  className="mt-1.5"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="185000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="details">Additional details</Label>
                <Textarea
                  id="details"
                  className="mt-1.5"
                  maxLength={600}
                  placeholder="Box, charger, repairs, warranty, PTA status…"
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Photos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload clear, unedited photos of the front, back, sides and battery health
              screen. Edited or misleading images are rejected during review.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-secondary">
              <Upload className="size-5" />
              Click to upload up to 6 images (JPG or PNG, max 5MB each)
              <input type="file" accept="image/png,image/jpeg" multiple className="hidden" />
            </label>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Vendor radius</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your exact address is never shown — only your area and distance.
            </p>
            <Button
              type="button"
              variant={locationShared ? "secondary" : "outline"}
              size="sm"
              className="mt-4"
              onClick={() => {
                setLocationShared(true);
                toast.success("Using your approximate location");
              }}
            >
              <MapPin className="size-4" />
              {locationShared ? "Location shared" : "Use my live location"}
            </Button>
            <div className="mt-6">
              <Slider
                value={[radius]}
                min={2}
                max={50}
                step={1}
                onValueChange={(v) => setRadius(v[0] ?? 10)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Within {radius} km &middot; {nearby.length} verified vendors
              </p>
            </div>
          </section>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              I confirm I am the legal owner, the device is not stolen, iCloud-locked or PTA
              blocked, and I accept the Terms &amp; Conditions.
            </span>
          </label>

          <Button type="submit" size="lg">
            Get vendor offers
          </Button>
        </form>

        <aside className="space-y-4">
          {submitted && (
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="font-semibold">Offers coming in</h2>
              <ul className="mt-4 space-y-4 text-sm">
                {nearby.slice(0, 3).map((v, i) => (
                  <li key={v.id} className="rounded-xl surface-tint p-4">
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.area} &middot; {v.distanceKm} km
                    </p>
                    <p className="mt-2 font-semibold text-success">
                      {formatPrice(Math.max(1000, Number(form.price || 0) - i * 4000))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary">
                        <MessageCircle className="size-3.5" /> Chat
                      </Button>
                      {v.riderPickup && (
                        <Button size="sm" variant="outline">
                          <Bike className="size-3.5" /> Home pickup
                        </Button>
                      )}
                      {v.pickup && (
                        <Button size="sm" variant="outline">
                          <Store className="size-3.5" /> Shop visit
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5 text-sm shadow-soft">
            <h2 className="font-semibold">How the deal closes</h2>
            <ol className="mt-3 space-y-3 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. Chat securely</span> — agree
                a price inside AppleHub messaging.
              </li>
              <li>
                <span className="font-medium text-foreground">2. Inspection</span> — an
                authorised rider visits your home, or you visit the shop.
              </li>
              <li>
                <span className="font-medium text-foreground">3. Payment</span> — the final
                price is confirmed after inspection and paid on the spot.
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Back up your data, sign out of iCloud, disable Find My and factory reset before
              handover.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
