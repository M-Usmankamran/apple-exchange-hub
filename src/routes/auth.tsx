import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Lock, Mail, ShieldCheck, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { claimAdminRole } from "@/lib/admin-access.functions";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create an Account | AppleHub" },
      {
        name: "description",
        content:
          "Sign in as a buyer or vendor to bid on Apple auctions, post buyer requests and manage your listings on AppleHub.",
      },
      { property: "og:title", content: "Sign in to AppleHub" },
      {
        property: "og:description",
        content: "Buyer and vendor accounts with secure email or Google sign-in.",
      },
    ],
  }),
  component: AuthPage,
});

type AccountType = "buyer" | "vendor" | "admin";

const PENDING_ADMIN_KEY = "applehub_pending_admin_code";

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/auctions", replace: true });
  }, [user, navigate]);

  const grantAdmin = async (code: string) => {
    try {
      await claimAdminRole({ data: { inviteCode: code } });
      sessionStorage.removeItem(PENDING_ADMIN_KEY);
      toast.success("Admin access granted.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not grant admin access.");
      return false;
    }
  };

  const handleSignIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signIn.email.trim(),
      password: signIn.password,
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const pending = sessionStorage.getItem(PENDING_ADMIN_KEY);
    if (pending) await grantAdmin(pending);
    setBusy(false);
    toast.success("Welcome back!");
    navigate({ to: "/auctions" });
  };

  const handleSignUp = async () => {
    if (signUp.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (accountType === "admin" && inviteCode.trim().length < 6) {
      toast.error("Enter the admin invite code provided by your organisation.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: signUp.email.trim(),
      password: signUp.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auctions`,
        data: {
          display_name: signUp.name.trim().slice(0, 80) || signUp.email.split("@")[0],
          account_type: accountType,
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    if (accountType === "admin") {
      const code = inviteCode.trim();
      if (data.session) {
        await grantAdmin(code);
      } else {
        sessionStorage.setItem(PENDING_ADMIN_KEY, code);
        toast.success(
          "Admin account created. Confirm your email, then sign in to activate admin access.",
        );
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    toast.success(
      accountType === "vendor"
        ? "Vendor account created — you can list auctions right away."
        : accountType === "admin"
          ? "Admin account ready."
          : "Account created. Welcome to AppleHub!",
    );
  };


  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/auctions" });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
      <section className="hidden lg:block">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure onboarding
        </Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          One account for buying, selling, bidding and exchanging.
        </h1>
        <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <User className="mt-0.5 h-4 w-4" /> Buyers bid on live auctions and post requests
            vendors bid on.
          </li>
          <li className="flex gap-3">
            <Store className="mt-0.5 h-4 w-4" /> Vendors list auctions and answer buyer
            requests with their best price.
          </li>
          <li className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4" /> Accounts and bids are stored securely with
            per-user access rules.
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

          <TabsContent value="signin" className="mt-6 space-y-4">
            <Field
              id="email"
              label="Email"
              icon={Mail}
              type="email"
              value={signIn.email}
              onChange={(v) => setSignIn((p) => ({ ...p, email: v }))}
              placeholder="you@example.com"
            />
            <Field
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              value={signIn.password}
              onChange={(v) => setSignIn((p) => ({ ...p, password: v }))}
              placeholder="••••••••"
            />
            <Button className="w-full" onClick={handleSignIn} disabled={busy}>
              Sign in
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogle}>
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="register" className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["buyer", "vendor", "admin"] as AccountType[]).map((r) => (

                <button
                  key={r}
                  type="button"
                  onClick={() => setAccountType(r)}
                  className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                    accountType === r
                      ? "border-primary bg-primary/5 font-medium"
                      : "hover:bg-accent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Field
              id="name"
              label="Full name"
              icon={User}
              value={signUp.name}
              onChange={(v) => setSignUp((p) => ({ ...p, name: v }))}
              placeholder="Your name"
            />
            <Field
              id="remail"
              label="Email"
              icon={Mail}
              type="email"
              value={signUp.email}
              onChange={(v) => setSignUp((p) => ({ ...p, email: v }))}
              placeholder="you@example.com"
            />
            <Field
              id="rpassword"
              label="Password"
              icon={Lock}
              type="password"
              value={signUp.password}
              onChange={(v) => setSignUp((p) => ({ ...p, password: v }))}
              placeholder="At least 6 characters"
            />
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
            <Button className="w-full" disabled={!agree || busy} onClick={handleSignUp}>
              Create {accountType} account
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogle}>
              Continue with Google
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
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
