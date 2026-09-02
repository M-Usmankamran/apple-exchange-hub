import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  MapPin,
  Palette,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/site/ProductCard";
import {
  categories,
  formatPrice,
  products,
  reviews,
  vendors,
} from "@/lib/marketplace-data";
import heroImage from "@/assets/hero-apple.jpg";
import customizeImage from "@/assets/customize-case.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AppleHub — Buy, Sell, Exchange & Customize Apple Products" },
      {
        name: "description",
        content:
          "Shop verified iPhones, iPads and MacBooks from local vendors, sell or exchange your device, and design custom cases in the live studio.",
      },
      {
        property: "og:title",
        content: "AppleHub — Apple products marketplace",
      },
      {
        property: "og:description",
        content:
          "Buy, sell, exchange and customize Apple products with CNIC-verified vendors near you.",
      },
    ],
  }),
  component: Home,
});

const actions = [
  {
    to: "/shop",
    icon: ShoppingBag,
    title: "Buy",
    text: "Compare verified listings from vendors near you.",
    cta: "Shop now",
  },
  {
    to: "/sell",
    icon: Wallet,
    title: "Sell",
    text: "Get offers from nearby vendors within hours.",
    cta: "Sell your phone",
  },
  {
    to: "/auctions",
    icon: Gavel,
    title: "Bid",
    text: "Bid live on iPhone, iPad, MacBook and AirPods auctions.",
    cta: "Join live bidding",
  },
  {
    to: "/requests",
    icon: HandCoins,
    title: "Request",
    text: "Post what you want and let vendors bid their best price.",
    cta: "Post a request",
  },
  {
    to: "/exchange",
    icon: RefreshCw,
    title: "Exchange",
    text: "Trade up and pay only the difference.",
    cta: "Exchange now",
  },

  {
    to: "/customize",
    icon: Palette,
    title: "Customize",
    text: "Design your case with a live 3D-style preview.",
    cta: "Customize your product",
  },
] as const;

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge variant="secondary" className="mb-5 rounded-full">
              CNIC-verified vendors &middot; PTA approved stock
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              Everything Apple.
              <br />
              <span className="text-gradient">One trusted marketplace.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Buy, sell, exchange and customize Apple products with verified local vendors
              — inspection at your door or at their shop.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop">
                  Shop now <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/vendors">
                  <MapPin className="size-4" /> Find nearby vendors
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-sm grid-cols-3 gap-4 text-sm">
              {[
                ["1,500+", "Live listings"],
                ["240+", "Verified vendors"],
                ["4.8★", "Buyer rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-lg font-semibold">{value}</dt>
                  <dd className="text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="iPhone, MacBook, Apple Watch and AirPods on a light background"
              width={1600}
              height={1104}
              className="w-full rounded-3xl shadow-lift"
            />
          </div>
        </div>
      </section>

      {/* Four actions */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="lift group rounded-2xl border bg-card p-6 shadow-soft"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <a.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{a.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {a.cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary"
            >
              {c.name} <span className="text-muted-foreground">{c.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured Apple products</h2>
            <p className="text-sm text-muted-foreground">
              Hand-checked listings with inspection reports.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Nearby / popular vendors */}
      <section className="surface-tint border-y">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Vendors near you</h2>
              <p className="text-sm text-muted-foreground">
                Share your location to sort stores by distance.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/vendors">
                <MapPin className="size-4" /> Open map
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {vendors.map((v) => (
              <Link
                key={v.id}
                to="/vendors"
                className="lift rounded-2xl border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{v.name}</h3>
                  {v.verified && <ShieldCheck className="size-4 text-success" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.area}, {v.city} &middot; {v.distanceKm} km away
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{v.tagline}</p>
                <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-warning text-warning" /> {v.rating} (
                  {v.reviews}) &middot; {v.products} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk purchase */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl border bg-card p-8 shadow-soft md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Badge className="rounded-full">
              <Boxes className="size-3.5" /> Bulk offers
            </Badge>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Buying 6 phones or more? Prices drop automatically.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Order 6+ units of the same model from one vendor and an 8% bulk discount is
              applied at checkout — or request a custom quotation. Pay online, or reserve
              and pay at the vendor&rsquo;s store when you collect.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/shop">Start a bulk order</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/vendors">Request quotation</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl surface-tint p-6">
            <p className="text-sm font-medium">Example: iPhone 14 128GB</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">1 unit</span>
                <span>{formatPrice(214000)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">6 units</span>
                <span className="font-semibold text-success">
                  {formatPrice(214000 * 6 * 0.92)}
                </span>
              </li>
              <li className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">You save</span>
                <span className="font-semibold">{formatPrice(214000 * 6 * 0.08)}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Customization showcase */}
      <section className="surface-tint border-y">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <img
            src={customizeImage}
            alt="Blank custom iPhone case ready to be personalised"
            loading="lazy"
            width={1024}
            height={1024}
            className="w-full max-w-sm justify-self-center rounded-3xl shadow-lift"
          />
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Design it yourself, see it instantly
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Pick a case style, colour and pattern, add your name or upload a photo — the
              live preview updates as you go, and you can rotate the case before you order.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link to="/customize">
                <Palette className="size-4" /> Open the studio
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">Why choose AppleHub</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "4-step vendor verification",
              text: "Mobile, email, shop address and CNIC checked before any shop goes live.",
            },
            {
              icon: Truck,
              title: "Home inspection or shop visit",
              text: "An authorised rider inspects and pays at your door, or visit the store.",
            },
            {
              icon: Boxes,
              title: "Authentic listings only",
              text: "Edited or misleading product images are rejected by admin review.",
            },
            {
              icon: Wallet,
              title: "Pay online or in store",
              text: "Encrypted online payments, or inspect and pay on collection.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-bold">What customers say</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-warning text-warning" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm">{r.text}</blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                {r.name} &middot; {r.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Secure payment + newsletter */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-8 shadow-soft">
            <ShieldCheck className="size-6 text-success" />
            <h2 className="mt-3 text-xl font-bold">Secure payments</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Card and wallet payments run through encrypted gateways with fraud
              monitoring. CNIC documents are encrypted and visible only to authorised
              admin reviewers.
            </p>
            <Link to="/terms" className="mt-4 inline-block text-sm font-medium text-primary">
              Read the Terms &amp; Conditions
            </Link>
          </div>
          <div className="rounded-3xl border gradient-primary p-8 text-primary-foreground shadow-glow">
            <h2 className="text-xl font-bold">Get new listings first</h2>
            <p className="mt-2 text-sm opacity-90">
              Weekly drops, bulk deals and customization ideas. No spam.
            </p>
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                className="bg-card text-foreground"
              />
              <Button type="submit" variant="secondary">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
