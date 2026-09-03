import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, MessageCircle, ShieldCheck, Star, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { products } from "@/lib/marketplace-data";
import { useVendorDirectory } from "@/lib/vendor-directory";

import { ProductCard } from "@/components/site/ProductCard";
import storeImage from "@/assets/vendor-store.jpg";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Nearby Apple Vendors — Verified Stores Near You | AppleHub" },
      {
        name: "description",
        content:
          "Discover CNIC-verified Apple vendors near you, compare ratings and stock, and choose home pickup or a store visit.",
      },
      { property: "og:title", content: "Find verified Apple vendors near you" },
      {
        property: "og:description",
        content: "Location-based vendor discovery with ratings, distance and stock counts.",
      },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const [radius, setRadius] = useState(10);
  const [shared, setShared] = useState(false);
  const [selected, setSelected] = useState(vendors[0]?.id ?? "");

  const nearby = vendors
    .filter((v) => v.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  const vendor = vendors.find((v) => v.id === selected);
  const vendorProducts = products.filter((p) => p.vendorId === selected);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Vendors near you</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Every store passes mobile, email, shop address and CNIC verification before it goes
          live. Share your location to sort by distance.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button
          variant={shared ? "secondary" : "default"}
          onClick={() => {
            setShared(true);
            toast.success("Showing vendors closest to you");
          }}
        >
          <MapPin className="size-4" />
          {shared ? "Location shared" : "Use my live location"}
        </Button>
        <div className="w-56">
          <Slider
            value={[radius]}
            min={2}
            max={50}
            step={1}
            onValueChange={(v) => setRadius(v[0] ?? 10)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Within {radius} km</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-3">
          {nearby.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`w-full rounded-2xl border bg-card p-5 text-left shadow-soft transition-colors ${v.id === selected ? "border-primary bg-accent" : "hover:bg-secondary"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{v.name}</p>
                {v.verified && <ShieldCheck className="size-4 text-success" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.area}, {v.city} &middot; {v.distanceKm} km
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-warning text-warning" /> {v.rating} ({v.reviews})
                &middot; {v.products} products
              </p>
            </button>
          ))}
          {nearby.length === 0 && (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              No vendors within {radius} km. Try widening the radius.
            </p>
          )}
        </div>

        <div>
          <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
            <img
              src={storeImage}
              alt="Bright modern Apple product store interior"
              loading="lazy"
              width={1024}
              height={700}
              className="h-52 w-full object-cover"
            />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <Store className="size-5" /> {vendor?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {vendor?.area}, {vendor?.city} &middot; on AppleHub since {vendor?.since}
                  </p>
                  <p className="mt-3 text-sm">{vendor?.tagline}</p>
                </div>
                <Badge variant="outline" className="text-success">
                  <ShieldCheck className="size-3.5" /> 4-step verified
                </Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => toast.success("Chat opened with the vendor")}>
                  <MessageCircle className="size-4" /> Message vendor
                </Button>
                {vendor?.pickup && (
                  <Badge variant="secondary">Store pickup available</Badge>
                )}
                {vendor?.riderPickup && <Badge variant="secondary">Rider inspection</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between">
              <h3 className="text-lg font-semibold">Listings from this store</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/shop" search={{}}>
                  Browse all
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {vendorProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {vendorProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  This vendor has no live listings right now.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
