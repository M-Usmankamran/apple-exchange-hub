import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

const groups = [
  {
    title: "Marketplace",
    links: [
      { to: "/shop", label: "Buy Apple products" },
      { to: "/sell", label: "Sell your device" },
      { to: "/exchange", label: "Exchange" },
      { to: "/customize", label: "Customization Studio" },
    ],
  },
  {
    title: "Vendors",
    links: [
      { to: "/vendors", label: "Nearby vendors" },
      { to: "/auth", label: "Become a vendor" },
      { to: "/dashboard/vendor", label: "Vendor dashboard" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/dashboard/user", label: "My dashboard" },
      { to: "/dashboard/admin", label: "Admin panel" },
      { to: "/terms", label: "Terms & Conditions" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg gradient-primary text-primary-foreground text-sm">
                
              </span>
              AppleHub
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Pakistan&rsquo;s verified multi-vendor marketplace to buy, sell, exchange and
              customize Apple products.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              Encrypted payments &middot; CNIC-verified vendors
            </p>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} AppleHub Marketplace. Not affiliated with Apple Inc.</p>
          <Link to="/terms" className="hover:text-foreground">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
