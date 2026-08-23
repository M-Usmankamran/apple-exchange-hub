import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice, vendorById } from "@/lib/marketplace-data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — AppleHub" },
      {
        name: "description",
        content:
          "Review your Apple product cart, apply bulk pricing for 6+ units and continue to secure checkout.",
      },
      { property: "og:title", content: "Your AppleHub cart" },
      { property: "og:description", content: "Review items and continue to checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, bulkSavings, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse verified Apple listings from vendors near you.
        </p>
        <Button asChild className="mt-6">
          <Link to="/shop">Shop now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-2xl border bg-card p-4 shadow-soft"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-xl object-cover surface-tint"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.meta}</p>
                <p className="text-xs text-muted-foreground">
                  {vendorById(item.vendorId)?.name ?? "AppleHub Studio"}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border">
                    <button
                      className="px-2.5 py-1 text-sm"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button
                      className="px-2.5 py-1 text-sm"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {item.qty >= 6 && (
                    <span className="text-xs font-medium text-success">Bulk 8% off</span>
                  )}
                  <button
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bulk discount</dt>
              <dd className="text-success">−{formatPrice(bulkSavings)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/checkout">Continue to checkout</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Pay online securely, or reserve and pay at the vendor&rsquo;s store on
            collection.
          </p>
        </aside>
      </div>
    </div>
  );
}
