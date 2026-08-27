import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/site/AvatarUpload";

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
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <Store className="h-3.5 w-3.5" /> Vendor profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Apex Apple Store</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your shop logo appears on every listing, quote and buyer chat.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Shop logo</h2>
          <Badge className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified vendor
          </Badge>
        </div>
        <AvatarUpload role="vendor" name="Apex Apple Store" className="mt-5" />
      </section>

      <section className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Shop details</h2>
        <Field id="v-shop" label="Shop name" defaultValue="Apex Apple Store" />
        <Field id="v-owner" label="Owner name" defaultValue="Bilal Ahmed" />
        <Field id="v-cnic" label="CNIC number" defaultValue="35202-1234567-1" />
        <Field id="v-phone" label="Shop phone" defaultValue="+92 321 7654321" />
        <Field id="v-city" label="City" defaultValue="Lahore" />
        <Field id="v-hours" label="Pickup hours" defaultValue="11:00 — 21:00" />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="v-about">Shop description</Label>
          <Textarea
            id="v-about"
            rows={3}
            defaultValue="Authorised reseller of new and certified pre-owned Apple devices with 7-day checked warranty."
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button>Save changes</Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/vendor">Go to vendor dashboard</Link>
          </Button>
        </div>
      </section>

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
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={defaultValue} />
    </div>
  );
}
