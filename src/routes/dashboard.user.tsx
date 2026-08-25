import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Repeat,
  ShieldCheck,
  Smartphone,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, products } from "@/lib/marketplace-data";
import { ProductCard } from "@/components/site/ProductCard";

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
      {
        property: "og:description",
        content: "Orders, sell requests, exchange offers, wishlist and profile in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UserDashboard,
});

const orders = [
  {
    id: "AH-24817",
    item: "iPhone 15 Pro Max 256GB",
    vendor: "Apex Apple Store",
    amount: 389000,
    step: 4,
    status: "Delivered",
  },
  {
    id: "AH-24818",
    item: "iPhone 14 128GB ×6 (bulk)",
    vendor: "CoreX Mobiles",
    amount: 1181000,
    step: 3,
    status: "Rider en route",
  },
  {
    id: "AH-24819",
    item: "Custom silicone case",
    vendor: "Lumen Accessories",
    amount: 9800,
    step: 2,
    status: "In production",
  },
];

const steps = ["Placed", "Confirmed", "Prepared", "Out for delivery", "Delivered"];

const sellRequests = [
  {
    id: "SR-411",
    device: "iPhone 12 128GB",
    ask: 132000,
    offer: 126000,
    vendor: "Apex Apple Store",
    mode: "Rider inspection at home",
    status: "Offer received",
  },
  {
    id: "SR-412",
    device: 'MacBook Pro 14" M1',
    ask: 335000,
    offer: 0,
    vendor: "Orchard Tech",
    mode: "Shop visit booked (Sat 4pm)",
    status: "Awaiting inspection",
  },
];

const exchanges = [
  {
    id: "EX-88",
    give: "iPhone 13 128GB",
    take: "iPhone 15 128GB",
    difference: 118000,
    vendor: "CoreX Mobiles",
    status: "Vendor countered",
  },
];

function UserDashboard() {
  const [wishlist, setWishlist] = useState(["p-3", "p-6"]);
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified buyer
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi, Usman</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Track orders, follow your sell requests and exchange offers, and keep your details
            up to date.
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
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{o.item}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.id} · {o.vendor} · {formatPrice(o.amount)}
                  </p>
                </div>
                <Badge variant={o.step === 5 ? "outline" : "secondary"}>{o.status}</Badge>
              </div>
              <Progress value={(o.step / steps.length) * 100} className="mt-4" />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                {steps.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.success("Vendor chat opened")}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Message vendor
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Invoice downloaded")}>
                  <Package className="mr-2 h-4 w-4" /> Invoice
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="sell" className="mt-6 space-y-4">
          {sellRequests.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Smartphone className="h-4 w-4" /> {s.device}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.id} · {s.vendor} · asking {formatPrice(s.ask)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {s.mode}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{s.status}</Badge>
                  {s.offer > 0 && (
                    <p className="mt-2 text-sm font-semibold">{formatPrice(s.offer)}</p>
                  )}
                </div>
              </div>
              {s.offer > 0 && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => toast.success("Offer accepted — payment on pickup")}>
                    Accept offer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast("Counter offer sent")}>
                    Counter
                  </Button>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="exchange" className="mt-6 space-y-4">
          {exchanges.map((e) => (
            <div key={e.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Repeat className="h-4 w-4" /> {e.give} → {e.take}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.id} · {e.vendor}
              </p>
              <p className="mt-3 text-sm">
                You pay the difference:{" "}
                <span className="font-semibold">{formatPrice(e.difference)}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => toast.success("Exchange confirmed")}>
                  Accept exchange
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/exchange">Adjust request</Link>
                </Button>
              </div>
              <Badge variant="secondary" className="mt-4">
                {e.status}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet —{" "}
              <Link to="/shop" className="underline">
                browse the shop
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((p) => (
                <div key={p.id} className="space-y-2">
                  <ProductCard product={p} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setWishlist((w) => w.filter((id) => id !== p.id))}
                  >
                    <Heart className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6 max-w-lg space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="uname">Full name</Label>
            <Input id="uname" defaultValue="Usman Kamran" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uemail">Email</Label>
            <Input id="uemail" type="email" defaultValue="usman@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uphone">Mobile</Label>
            <Input id="uphone" defaultValue="+92 300 5566778" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uaddr">Delivery address</Label>
            <Input id="uaddr" defaultValue="House 14, DHA Phase 5, Lahore" />
          </div>
          <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> Buyer rating 4.9 · 20 completed orders
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
