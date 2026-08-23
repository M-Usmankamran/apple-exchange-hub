import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/site/ProductCard";
import {
  categories,
  conditions,
  products,
  storageOptions,
  vendors,
  type Condition,
} from "@/lib/marketplace-data";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search["category"] === "string" ? { category: search["category"] } : {},
  head: () => ({
    meta: [
      { title: "Buy Apple Products — Verified Vendor Listings | AppleHub" },
      {
        name: "description",
        content:
          "Browse iPhones, iPads, MacBooks, Apple Watch and AirPods from CNIC-verified vendors. Filter by model, storage, condition, price, city and vendor.",
      },
      { property: "og:title", content: "Buy Apple products on AppleHub" },
      {
        property: "og:description",
        content:
          "Compare verified Apple listings by model, storage, condition, price and distance.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>(category ?? "all");
  const [maxPrice, setMaxPrice] = useState(450000);
  const [cond, setCond] = useState<Condition[]>([]);
  const [storage, setStorage] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [vendor, setVendor] = useState<string>("all");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const cities = useMemo(() => [...new Set(vendors.map((v) => v.city))], []);

  const results = useMemo(() => {
    const list = products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (query && !`${p.name} ${p.model} ${p.color}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (p.price > maxPrice) return false;
      if (cond.length && !cond.includes(p.condition)) return false;
      if (storage !== "all" && p.storage !== storage) return false;
      if (city !== "all" && p.city !== city) return false;
      if (vendor !== "all" && p.vendorId !== vendor) return false;
      return true;
    });
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "distance") return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "rating") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [cat, query, maxPrice, cond, storage, city, vendor, sort]);

  const toggleCond = (c: Condition) =>
    setCond((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">Buy Apple products</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {results.length} listings from verified vendors. Bulk pricing unlocks at 6+ units
          of the same model.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search iPhone 15 Pro, MacBook Air…"
          aria-label="Search products"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="distance">Nearest vendor</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" /> Filters
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside
          className={`${showFilters ? "block" : "hidden"} h-fit rounded-2xl border bg-card p-5 shadow-soft lg:block`}
        >
          <div className="space-y-6 text-sm">
            <div>
              <Label className="mb-2 block">Product type</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Storage</Label>
              <Select value={storage} onValueChange={setStorage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any storage</SelectItem>
                  {storageOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-3 block">Max price</Label>
              <Slider
                value={[maxPrice]}
                min={4000}
                max={500000}
                step={5000}
                onValueChange={(v) => setMaxPrice(v[0] ?? 500000)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Up to PKR {maxPrice.toLocaleString()}
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Condition</Label>
              <div className="space-y-2">
                {conditions.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={cond.includes(c)}
                      onCheckedChange={() => toggleCond(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Location</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No listings match these filters yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
