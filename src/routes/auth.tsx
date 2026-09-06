import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, homePathForRoles, type AppRole } from "@/hooks/use-auth";
import { claimAdminRole } from "@/lib/admin-access.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search['redirect'] === "string" ? (search['redirect'] as string) : "";
    // Only ever return people to a path inside this site.
    const redirect = raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
    return { redirect };
  },
  head: () => ({
    meta: [
      { title: "Sign in or Create an Account | AppleHub" },
      {
        name: "description",
        content:
          "Sign in as a buyer, vendor or admin to bid on Apple auctions, post buyer requests and manage your listings on AppleHub.",
      },
      { property: "og:title", content: "Sign in to AppleHub" },
      {
        property: "og:description",
        content: "Buyer, vendor and admin accounts with secure email or Google sign-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type AccountType = "buyer" | "vendor" | "admin";

const PENDING_ADMIN_KEY = "applehub_pending_admin_code";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(255, "Email is too long.");

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long.")
      .regex(/[A-Za-z]/, "Password must include a letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

function firstError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Please check your details.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, roles, loading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "", confirm: "" });
  const [inviteCode, setInviteCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const goAfterAuth = (roleList: AppRole[]) => {
    const to = redirect ?? homePathForRoles(roleList);
    navigate({ to, replace: true });
  };

  const redirectForUser = async (userId: string) => {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    goAfterAuth(((roleRows ?? []).map((r) => r.role) as AppRole[]) ?? []);
  };

  // Already signed in? Never leave someone stuck on the sign-in page.
  useEffect(() => {
    if (!loading && user) goAfterAuth(roles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, roles]);

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
    try {
      emailSchema.parse(signIn.email);
      if (!signIn.password) throw new Error("Enter your password.");
    } catch (error) {
      toast.error(firstError(error));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signIn.email.trim(),
      password: signIn.password,
    });
    if (error) {
      setBusy(false);
      const message = /invalid login credentials/i.test(error.message)
        ? "That email and password don’t match an account. Check them, or use “Forgot password”."
        : /email not confirmed/i.test(error.message)
          ? "Please confirm your email address first — check your inbox for the verification link."
          : error.message;
      toast.error(message);
      return;
    }
    const pending = sessionStorage.getItem(PENDING_ADMIN_KEY);
    if (pending) await grantAdmin(pending);
    setBusy(false);
    toast.success("Welcome back!");
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (userId) await redirectForUser(userId);
  };

  const handleSignUp = async () => {
    let values: z.infer<typeof registerSchema>;
    try {
      values = registerSchema.parse(signUp);
    } catch (error) {
      toast.error(firstError(error));
      return;
    }
    if (accountType === "admin" && inviteCode.trim().length < 6) {
      toast.error("Enter the admin invite code provided by your organisation.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          display_name: values.name.slice(0, 80),
          account_type: accountType,
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(
        /already registered|already been registered|user already/i.test(error.message)
          ? "An account with this email already exists — sign in instead, or reset your password."
          : error.message,
      );
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setBusy(false);
      toast.error("An account with this email already exists — please sign in instead.");
      return;
    }

    let session = data.session;
    if (!session) {
      const { data: signedIn } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      session = signedIn.session ?? null;
    }

    if (accountType === "admin") {
      const code = inviteCode.trim();
      if (session) {
        const ok = await grantAdmin(code);
        if (!ok) {
          setBusy(false);
          return;
        }
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
        ? "Vendor account created — your store goes live once an admin approves it."
        : accountType === "admin"
          ? "Admin account ready."
          : "Account created. Welcome to AppleHub!",
    );

    if (session) {
      if (accountType === "admin") {
        navigate({ to: redirect ?? "/dashboard/admin", replace: true });
      } else if (accountType === "vendor") {
        navigate({ to: redirect ?? "/dashboard/vendor", replace: true });
      } else {
        await redirectForUser(session.user.id);
      }
    } else {
      toast("Check your inbox to verify your email, then sign in.");
    }
  };

  const handleForgot = async () => {
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      toast.error(firstError(error));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("If that email has an account, a reset link is on its way.");
    setMode("signin");
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
            requests — stores go live after admin approval.
          </li>
          <li className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4" /> Accounts, orders and bids are stored securely
            with per-account access rules.
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
            {mode === "forgot" ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold">Reset your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your email and we’ll send you a secure link to choose a new
                    password.
                  </p>
                </div>
                <Field
                  id="forgot-email"
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={resetEmail}
                  onChange={setResetEmail}
                  placeholder="you@example.com"
                />
                <Button className="w-full" onClick={handleForgot} disabled={busy}>
                  Send reset link
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("signin")}>
                  Back to sign in
                </Button>
              </>
            ) : (
              <>
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
                  reveal
                  value={signIn.password}
                  onChange={(v) => setSignIn((p) => ({ ...p, password: v }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(signIn.email);
                    setMode("forgot");
                  }}
                  className="text-xs text-muted-foreground underline"
                >
                  Forgot password?
                </button>
                <Button className="w-full" onClick={handleSignIn} disabled={busy}>
                  Sign in
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>
              </>
            )}
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
              reveal
              value={signUp.password}
              onChange={(v) => setSignUp((p) => ({ ...p, password: v }))}
              placeholder="8+ characters, with a letter and a number"
            />
            <Field
              id="rconfirm"
              label="Confirm password"
              icon={Lock}
              type="password"
              reveal
              value={signUp.confirm}
              onChange={(v) => setSignUp((p) => ({ ...p, confirm: v }))}
              placeholder="Re-enter your password"
            />
            {accountType === "vendor" && (
              <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                Vendor accounts start as pending. You can set up your listings right away,
                but your store only appears publicly after an admin approves it.
              </p>
            )}
            {accountType === "admin" && (
              <>
                <Field
                  id="invite"
                  label="Admin invite code"
                  icon={KeyRound}
                  type="password"
                  reveal
                  value={inviteCode}
                  onChange={setInviteCode}
                  placeholder="Provided by the platform owner"
                />
                <p className="text-xs text-muted-foreground">
                  Admin accounts are verified on the server with a private invite code — it
                  can never be guessed from this page.
                </p>
              </>
            )}

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
  reveal = false,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  reveal?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const inputType = reveal && shown ? "text" : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={reveal ? "pl-9 pr-10" : "pl-9"}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
