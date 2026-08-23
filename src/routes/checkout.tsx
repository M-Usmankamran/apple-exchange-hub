import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Lock, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/marketplace-data";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — AppleHub" },
      {
        name: "description",
        content:
          "Pay online through an encrypted gateway or reserve your order and pay at the vendor's store on collection.",
      },
      { property: "og:title", content: "Secure checkout on AppleHub" },
      {
        property: "og:description",
        content: "Encrypted online payment or in-store payment on collection.",
      },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, total, clear } = useCart();
  const [method, setMethod] = useState<"online" | "store">("online");
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order <span className="font-medium">#AH-48219</span> is confirmed. Track it from
          your dashboard.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard/user">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">Shop now</Link>
        </Button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept the Terms & Conditions to continue");
      return;
    }
    clear();
    setPlaced(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Contact & delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required maxLength={100} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input
                  id="phone"
                  required
                  inputMode="tel"
                  placeholder="03XX-XXXXXXX"
                  maxLength={20}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required maxLength={255} className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Delivery address</Label>
                <Textarea id="address" required maxLength={300} className="mt-1.5" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("online")}
                className={`rounded-2xl border p-4 text-left transition-colors ${method === "online" ? "border-primary bg-accent" : "hover:bg-secondary"}`}
              >
                <CreditCard className="size-5 text-primary" />
                <p className="mt-2 text-sm font-medium">Pay online</p>
                <p className="text-xs text-muted-foreground">
                  Encrypted card or wallet payment.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMethod("store")}
                className={`rounded-2xl border p-4 text-left transition-colors ${method === "store" ? "border-primary bg-accent" : "hover:bg-secondary"}`}
              >
                <Store className="size-5 text-primary" />
                <p className="mt-2 text-sm font-medium">Pay at store</p>
                <p className="text-xs text-muted-foreground">
                  Inspect, pay and collect at the vendor&rsquo;s shop.
                </p>
              </button>
            </div>

            {method === "online" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="card">Card number</Label>
                  <Input
                    id="card"
                    required
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="exp">Expiry</Label>
                  <Input id="exp" required placeholder="MM/YY" maxLength={5} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" required inputMode="numeric" maxLength={4} className="mt-1.5" />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Online payments are processed by an encrypted gateway. Verify the vendor
                  and order details before paying — see the Terms &amp; Conditions for the
                  online payment disclaimer.
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Your order will be reserved for 48 hours. Visit the vendor&rsquo;s store,
                inspect the product, then pay and collect.
              </p>
            )}
          </section>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              I have read, understood, and agree to the{" "}
              <Link to="/terms" className="font-medium text-primary">
                Terms &amp; Conditions
              </Link>
              .
            </span>
          </label>
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.qty} × {i.name}
                </span>
                <span>{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full">
            <Lock className="size-4" />
            {method === "online" ? "Pay securely" : "Reserve order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
