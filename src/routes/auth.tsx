import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, Phone, ShieldCheck, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create an Account | AppleHub" },
      {
        name: "description",
        content:
          "Sign in as a buyer, vendor or admin. Vendor accounts are verified with CNIC, shop address and phone before going live.",
      },
      { property: "og:title", content: "Sign in to AppleHub" },
      {
        property: "og:description",
        content: "Buyer, vendor and admin accounts with verified onboarding.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "buyer" | "vendor" | "admin";

const roleHome: Record<Role, "/dashboard/user" | "/dashboard/vendor" | "/dashboard/admin"> = {
  buyer: "/dashboard/user",
  vendor: "/dashboard/vendor",
  admin: "/dashboard/admin",
};

function AuthPage() {
  const [role, setRole] = useState<Role>("buyer");
  const [agree, setAgree] = useState(false);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
      <section className="hidden lg:block">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure onboarding
        </Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          One account for buying, selling and exchanging.
        </h1>
        <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <User className="mt-0.5 h-4 w-4" /> Buyers get order tracking, sell requests and
            exchange offers in one place.
          </li>
          <li className="flex gap-3">
            <Store className="mt-0.5 h-4 w-4" /> Vendors are verified with CNIC, shop address and
            phone before listings go live.
          </li>
          <li className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4" /> Passwords are hashed, sessions expire and every
            admin action is audited.
          </li>
        </ul>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Register
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {(["buyer", "vendor", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                  role === r ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <Field id="email" label="Email" icon={Mail} type="email" placeholder="you@example.com" />
            <Field id="password" label="Password" icon={Lock} type="password" placeholder="••••••••" />
            <Button className="w-full" asChild>
              <Link to={roleHome[role]}>Sign in as {role}</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo mode — no credentials are stored yet.
            </p>
          </TabsContent>

          <TabsContent value="register" className="mt-6 space-y-4">
            <Field id="name" label="Full name" icon={User} placeholder="Your name" />
            <Field id="remail" label="Email" icon={Mail} type="email" placeholder="you@example.com" />
            <Field id="phone" label="Mobile number" icon={Phone} placeholder="+92 3xx xxx xxxx" />
            {role === "vendor" && (
              <>
                <Field id="shop" label="Shop name" icon={Store} placeholder="Your store name" />
                <Field id="cnic" label="CNIC number" icon={ShieldCheck} placeholder="35202-xxxxxxx-x" />
              </>
            )}
            <Field id="rpassword" label="Password" icon={Lock} type="password" placeholder="••••••••" />
            <label className="flex items-start gap-3 text-xs text-muted-foreground">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and confirm my listings will match the products I deliver.
              </span>
            </label>
            <Button
              className="w-full"
              disabled={!agree}
              onClick={() =>
                toast.success(
                  role === "vendor"
                    ? "Application submitted — admin approval usually takes 24 hours."
                    : "Account created. Welcome to AppleHub!",
                )
              }
            >
              Create {role} account
            </Button>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type={type} placeholder={placeholder} className="pl-9" />
      </div>
    </div>
  );
}
