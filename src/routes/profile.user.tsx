import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Package, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/site/AvatarUpload";

export const Route = createFileRoute("/profile/user")({
  head: () => ({
    meta: [
      { title: "Buyer Profile & Photo | AppleHub" },
      {
        name: "description",
        content:
          "Manage your buyer profile: upload and crop a profile photo, update contact details, city and delivery address.",
      },
      { property: "og:title", content: "Your buyer profile on AppleHub" },
      {
        property: "og:description",
        content: "Profile photo, contact details and delivery address in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UserProfile,
});

function UserProfile() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <Package className="h-3.5 w-3.5" /> Buyer profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Ayesha Khan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your photo appears on orders, sell requests and vendor chats.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <AvatarUpload role="user" name="Ayesha Khan" className="mt-5" />
      </section>

      <section className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Personal details</h2>
        <Field id="u-name" label="Full name" defaultValue="Ayesha Khan" />
        <Field id="u-email" label="Email" type="email" defaultValue="ayesha@example.com" />
        <Field id="u-phone" label="Mobile number" defaultValue="+92 300 1234567" />
        <Field id="u-city" label="City" defaultValue="Karachi" />
        <div className="sm:col-span-2">
          <Field id="u-address" label="Delivery address" defaultValue="Block 4, Clifton, Karachi" />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button>Save changes</Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/user">
              <MapPin className="mr-2 size-4" /> Go to my dashboard
            </Link>
          </Button>
        </div>
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5" /> Uploads are type-checked, size-limited and
        re-encoded in your browser before storage, so no metadata leaves your device.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}
