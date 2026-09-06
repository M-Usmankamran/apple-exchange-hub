import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a New Password | AppleHub" },
      {
        name: "description",
        content:
          "Set a new password for your AppleHub buyer, vendor or admin account using your secure reset link.",
      },
      { property: "og:title", content: "Reset your AppleHub password" },
      {
        property: "og:description",
        content: "Create a new password for your AppleHub account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z
  .object({
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

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  useEffect(() => {
    // The recovery link puts a one-time session in place; wait for it before
    // letting anyone set a new password.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    const parsed = passwordSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You’re signed in.");
    navigate({ to: "/dashboard/user", replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {ready
          ? "Pick a password you haven’t used before. It needs at least 8 characters, including a letter and a number."
          : "Open this page from the reset link in your email. If the link has expired, request a new one from the sign-in page."}
      </p>

      <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <PasswordField
          id="new-password"
          label="New password"
          shown={shown}
          onToggle={() => setShown((v) => !v)}
          value={form.password}
          onChange={(v) => setForm((p) => ({ ...p, password: v }))}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          shown={shown}
          onToggle={() => setShown((v) => !v)}
          value={form.confirm}
          onChange={(v) => setForm((p) => ({ ...p, confirm: v }))}
        />
        <Button className="w-full" disabled={!ready || busy} onClick={submit}>
          Update password
        </Button>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-10"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
