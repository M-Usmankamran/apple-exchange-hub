import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bike,
  Boxes,
  Languages,
  MessageCircle,
  Plus,
  Repeat,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, products } from "@/lib/marketplace-data";
import { VendorLanguageProvider, useVendorLang } from "@/lib/vendor-language";

export const Route = createFileRoute("/dashboard/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Listings, Orders & Offers | AppleHub" },
      {
        name: "description",
        content:
          "Manage your Apple listings, orders, sell requests, exchange offers and bulk enquiries in English or Urdu.",
      },
      { property: "og:title", content: "AppleHub Vendor Dashboard" },
      {
        property: "og:description",
        content: "Listings, orders, sell requests, exchanges and bulk orders with Urdu support.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorDashboardPage,
});

const myProducts = products.filter((p) => p.vendorId === "v-apex" || p.vendorId === "v-corex");

const vendorOrders = [
  { id: "AH-24817", customer: "Hamza Sheikh", item: "iPhone 15 Pro Max", amount: 389000, status: "Delivered" },
  { id: "AH-24818", customer: "Maryam Iqbal", item: "iPhone 14 ×6", amount: 1181000, status: "Rider en route" },
  { id: "AH-24821", customer: "Ali Nawaz", item: "Watch Series 9", amount: 118000, status: "Awaiting pickup" },
];

const sellRequests = [
  { id: "SR-411", device: "iPhone 12 128GB", ask: 132000, battery: 89, city: "Lahore" },
  { id: "SR-415", device: "iPhone 11 64GB", ask: 96000, battery: 82, city: "Lahore" },
];

const exchangeOffers = [
  { id: "EX-88", give: "iPhone 13 128GB", take: "iPhone 15 128GB", difference: 118000 },
];

const bulkEnquiries = [
  { id: "BK-32", buyer: "Zephyr Solutions", item: "iPhone 14 128GB", qty: 12, note: "Corporate rollout" },
  { id: "BK-33", buyer: "Nova Traders", item: "AirPods Pro 2", qty: 25, note: "Retail resale" },
];

function VendorDashboardPage() {
  return (
    <VendorLanguageProvider>
      <VendorDashboard />
    </VendorLanguageProvider>
  );
}

function VendorDashboard() {
  const { t, lang, setLang, rtl } = useVendorLang();
  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(myProducts.map((p) => [p.id, p.stock])),
  );

  const stats = [
    { label: t("totalSales"), value: formatPrice(4820000) },
    { label: t("activeListings"), value: String(myProducts.length) },
    { label: t("pendingOrders"), value: "2" },
    { label: t("rating"), value: "4.9" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir={rtl ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("approved")}
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">{t("vendorDashboard")}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" /> Apex Apple Store · Gulberg III, Lahore
          </p>
        </div>
        <Button variant="outline" onClick={() => setLang(lang === "en" ? "ur" : "en")}>
          <Languages className="mr-2 h-4 w-4" /> {lang === "en" ? "اردو" : "English"}
        </Button>
      </header>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
        {t("quality")}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="products" className="mt-10">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="products">{t("products")}</TabsTrigger>
          <TabsTrigger value="orders">{t("orders")}</TabsTrigger>
          <TabsTrigger value="sell">{t("sellRequests")}</TabsTrigger>
          <TabsTrigger value="exchanges">{t("exchanges")}</TabsTrigger>
          <TabsTrigger value="bulk">{t("bulk")}</TabsTrigger>
          <TabsTrigger value="messages">{t("messages")}</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="flex justify-end">
            <Button onClick={() => toast.success("Listing draft created — add images to publish")}>
              <Plus className="mr-2 h-4 w-4" /> {t("addProduct")}
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("stock")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-medium">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.storage} · {p.condition}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(p.price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={stock[p.id] ?? 0}
                        onChange={(e) =>
                          setStock((s) => ({ ...s, [p.id]: Number(e.target.value) }))
                        }
                        className="w-20"
                        aria-label={`Stock for ${p.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={(stock[p.id] ?? 0) > 0 ? "outline" : "destructive"}>
                        {(stock[p.id] ?? 0) > 0 ? "Live" : "Out of stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
              {vendorOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <span className="font-medium">{o.id}</span>
                    <span className="block text-xs text-muted-foreground">{o.item}</span>
                  </TableCell>
                  <TableCell className="text-sm">{o.customer}</TableCell>
                  <TableCell className="text-sm">{formatPrice(o.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`${o.id} updated`)}>
                      Advance
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="sell" className="mt-6 space-y-4">
          {sellRequests.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{s.device}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.id} · {s.city} · battery {s.battery}% · asking {formatPrice(s.ask)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast.success(t("accept"))}>
                    {t("accept")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast(t("counter"))}>
                    {t("counter")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.error(t("reject"))}>
                    {t("reject")}
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => toast.success(t("sendRider"))}>
                  <Bike className="mr-2 h-4 w-4" /> {t("sendRider")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toast.success(t("storeVisit"))}>
                  <Store className="mr-2 h-4 w-4" /> {t("storeVisit")}
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="exchanges" className="mt-6 space-y-4">
          {exchangeOffers.map((e) => (
            <div key={e.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Repeat className="h-4 w-4" /> {e.give} → {e.take}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Buyer pays difference: {formatPrice(e.difference)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => toast.success(t("accept"))}>
                  {t("accept")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast(t("counter"))}>
                  {t("counter")}
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="bulk" className="mt-6 space-y-4">
          {bulkEnquiries.map((b) => (
            <div key={b.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Boxes className="h-4 w-4" /> {b.item} × {b.qty}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.id} · {b.buyer} · {b.note}
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`q-${b.id}`} className="text-xs">
                    Unit price
                  </Label>
                  <Input id={`q-${b.id}`} className="w-32" defaultValue="205000" />
                </div>
                <Button size="sm" onClick={() => toast.success("Bulk quote sent")}>
                  Send quote
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="messages" className="mt-6 space-y-3">
          {["Hamza Sheikh", "Maryam Iqbal", "Nova Traders"].map((name) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  Is the unit PTA approved and does it include the box?
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success(t("chat"))}>
                <MessageCircle className="mr-2 h-4 w-4" /> {t("chat")}
              </Button>
            </div>
          ))}
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> Reply within 2 hours to keep your response badge.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
