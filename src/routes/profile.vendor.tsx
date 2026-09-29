import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/site/AvatarUpload";
import { CnicUpload } from "@/components/site/CnicUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_CNIC_LENGTH,
  MAX_PHONE_LENGTH,
  formatCnic,
  formatPhone,
  pkCities,
} from "@/lib/form-options";
import { useProfileForm } from "@/hooks/use-profile-form";

export const Route = createFileRoute("/profile/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Profile & Shop Photo | AppleHub" },
      {
        name: "description",
        content:
          "Manage your vendor profile: upload and crop a shop logo, update shop name, CNIC verification status, address and pickup hours.",
      },
      { property: "og:title", content: "Your vendor profile on AppleHub" },
      {
        property: "og:description",
        content: "Shop logo, verification status, address and pickup hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorProfile,
});

function VendorProfile() {
  const { auth, form, set, save, loadingProfile } = useProfileForm();

  if (!auth.loading && !auth.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in to manage your shop profile</h1>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const shop = form.shop_name || form.display_name || auth.displayName;
  const verified = auth.vendorStatus === "approved";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <Store className="h-3.5 w-3.5" /> Vendor profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{shop}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your shop logo appears on every listing, quote and buyer chat.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Shop logo</h2>
          <Badge variant={verified ? "default" : "secondary"} className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {verified ? "Verified vendor" : "Awaiting approval"}
          </Badge>
        </div>
        <AvatarUpload role="vendor" name={shop} className="mt-5" />
      </section>

      <section className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">CNIC verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A clear CNIC image is required before your vendor verification can be completed.
        </p>
        <CnicUpload accountType="vendor" className="mt-5" />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
        className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Shop details</h2>
        <Field id="v-shop" label="Shop name" value={form.shop_name} onChange={(v) => set("shop_name", v)} />
        <Field id="v-owner" label="Owner name" value={form.owner_name} onChange={(v) => set("owner_name", v)} />
        <Field
          id="v-cnic"
          label="CNIC number"
          placeholder="00000-0000000-0"
          maxLength={MAX_CNIC_LENGTH}
          value={form.cnic_number}
          onChange={(v) => set("cnic_number", formatCnic(v))}
        />
        <Field
          id="v-phone"
          label="Shop phone"
          placeholder="03001234567"
          inputMode="numeric"
          maxLength={MAX_PHONE_LENGTH}
          value={form.phone}
          onChange={(v) => set("phone", formatPhone(v))}
        />
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
        <Field
          id="v-hours"
          label="Pickup hours"
          placeholder="11:00 — 21:00"
          value={form.pickup_hours}
          onChange={(v) => set("pickup_hours", v)}
        />
        <div className="sm:col-span-2">
          <Field
            id="v-address"
            label="Shop address"
            value={form.delivery_address}
            onChange={(v) => set("delivery_address", v)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="v-about">Shop description</Label>
          <Textarea
            id="v-about"
            rows={3}
            value={form.shop_description}
            onChange={(e) => set("shop_description", e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.isPending || loadingProfile}>
            {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button variant="outline" asChild type="button">
            <Link to="/dashboard/vendor">Go to vendor dashboard</Link>
          </Button>
        </div>
      </form>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5" /> Logos are validated by file signature, capped at
        5 MB and re-encoded to a 512×512 square before storage.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  inputMode?: "numeric";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
