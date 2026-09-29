import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/site/AvatarUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_PHONE_LENGTH, formatPhone, pkCities } from "@/lib/form-options";
import { useProfileForm } from "@/hooks/use-profile-form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/admin")({
  head: () => ({
    meta: [
      { title: "Admin Profile & Security | AppleHub" },
      {
        name: "description",
        content:
          "Manage the admin profile: upload and crop an identity photo, review contact details and security settings.",
      },
      { property: "og:title", content: "Admin profile on AppleHub" },
      {
        property: "og:description",
        content: "Identity photo, contact details and security for platform admins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProfile,
});

function AdminProfile() {
  const { auth, form, set, save, loadingProfile } = useProfileForm();
  const [resetting, setResetting] = useState(false);

  if (!auth.loading && !auth.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in to manage your admin profile</h1>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const name = form.display_name || auth.displayName;

  const resetPassword = async () => {
    if (!auth.user?.email) return;
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(auth.user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" /> Admin profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your photo is attached to every approval, refund and audit-log entry you create.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Identity photo</h2>
        <AvatarUpload role="admin" name={name} className="mt-5" />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
        className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Account details</h2>
        <div className="space-y-2">
          <Label htmlFor="a-name">Full name</Label>
          <Input
            id="a-name"
            value={form.display_name}
            onChange={(e) => set("display_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-email">Work email</Label>
          <Input id="a-email" type="email" value={auth.user?.email ?? ""} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-phone">Mobile number</Label>
          <Input
            id="a-phone"
            inputMode="numeric"
            placeholder="03001234567"
            maxLength={MAX_PHONE_LENGTH}
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Select value={form.city} onValueChange={(v) => set("city", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {pkCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="a-address">Office address</Label>
          <Input
            id="a-address"
            value={form.delivery_address}
            onChange={(e) => set("delivery_address", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="a-role">Access level</Label>
          <Input
            id="a-role"
            value={auth.isAdmin ? "Admin" : "No admin access"}
            readOnly
            disabled
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.isPending || loadingProfile}>
            {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button variant="outline" type="button" onClick={resetPassword} disabled={resetting}>
            <KeyRound className="mr-2 size-4" /> Reset password
          </Button>
          <Button variant="ghost" asChild type="button">
            <Link to="/dashboard/admin">Go to admin control centre</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
