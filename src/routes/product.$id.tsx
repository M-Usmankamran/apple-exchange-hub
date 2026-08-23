import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Boxes,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import {
  BULK_MIN_QTY,
  bulkPrice,
  formatPrice,
  productById,
  products,
  vendorById,
} from "@/lib/marketplace-data";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = productById(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Listing unavailable — AppleHub" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} ${product.storage} — ${formatPrice(product.price)} | AppleHub`;
    const description = `${product.condition} ${product.name} (${product.storage}, ${product.color}) from a verified vendor in ${product.city}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Listing not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This product may have been sold or removed by admin review.
      </p>
      <Button asChild className="mt-6">
        <Link to="/shop">Back to shop</Link>
      </Button>
    </div>
  ),
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const vendor = vendorById(product.vendorId);
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  const unit = bulkPrice(product.price, qty);
  const total = unit * qty;
  const isBulk = qty >= BULK_MIN_QTY;

  const addToCart = () => {
    add(
      {
        id: product.id,
        name: `${product.name} ${product.storage}`,
        vendorId: product.vendorId,
        price: product.price,
        meta: `${product.condition} · ${product.color}`,
        image: product.images[0],
      },
      qty,
    );
    toast.success(`${qty} × ${product.name} added to cart`);
  };

  const related = products.filter((p) => p.id !== product.id && p.category === product.category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        / <span>{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border surface-tint shadow-soft">
          <img
            src={product.images[0]}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.condition}</Badge>
            {product.pta && (
              <Badge variant="outline" className="text-success">
                <BadgeCheck className="size-3.5" /> PTA approved
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.model} &middot; {product.storage} &middot; {product.color}
            {product.batteryHealth ? ` · Battery ${product.batteryHealth}%` : ""}
          </p>

          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-bold">{formatPrice(unit)}</p>
            {product.originalPrice && (
              <p className="pb-1 text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
          {isBulk && (
            <p className="mt-1 text-sm font-medium text-success">
              Bulk price applied — 8% off for {qty} units
            </p>
          )}

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-success" /> {h}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border">
              <button
                className="px-3 py-2 text-sm"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                className="px-3 py-2 text-sm"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" onClick={addToCart}>
              Add to cart &middot; {formatPrice(total)}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                addToCart();
                navigate({ to: "/checkout" });
              }}
            >
              Buy now
            </Button>
          </div>

          {qty >= BULK_MIN_QTY && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Boxes className="size-4" /> Need a custom quotation? Message the vendor for
              tiered pricing or store collection.
            </p>
          )}

          <Separator className="my-8" />

          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <Store className="size-4" /> {vendor?.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vendor?.area}, {vendor?.city}
                </p>
                <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="size-3 fill-warning text-warning" /> {vendor?.rating} (
                    {vendor?.reviews})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {product.distanceKm} km
                  </span>
                </p>
              </div>
              {vendor?.verified && (
                <Badge variant="outline" className="text-success">
                  Verified
                </Badge>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => toast.success("Chat request sent to the vendor")}>
                <MessageCircle className="size-4" /> Message vendor
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/vendors">View store</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Vendors must deliver exactly the product shown here — images, model, condition,
          storage, colour and accessories. Report any mismatch to Admin Support.
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">Similar listings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
