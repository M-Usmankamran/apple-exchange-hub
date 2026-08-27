import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/site/AvatarUpload";

export const Route = createFileRoute("/profile/admin")({
  head: () => ({
    meta: [
      { title: "Admin Profile & Security | AppleHub" },
      {
        name: "description",
        content:
          "Manage the admin profile: upload and crop an identity photo, review contact details and two-factor security settings.",
      },
      { property: "og:title", content: "Admin profile on AppleHub" },
      {
        property: "og:description",
        content: "Identity photo, contact details and two-factor security for platform admins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProfile,
});

function AdminProfile() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" /> Admin profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Hamza Sheikh</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your photo is attached to every approval, refund and audit-log entry you create.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Identity photo</h2>
        <AvatarUpload role="admin" name="Hamza Sheikh" className="mt-5" />
      </section>

      <section className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Account details</h2>
        <Field id="a-name" label="Full name" defaultValue="Hamza Sheikh" />
        <Field id="a-email" label="Work email" type="email" defaultValue="hamza@applehub.pk" />
        <Field id="a-phone" label="Mobile number" defaultValue="+92 333 9876543" />
        <Field id="a-role" label="Access level" defaultValue="Super admin" />

        <div className="flex items-center justify-between rounded-2xl border p-4 sm:col-span-2">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              Required for approvals, refunds and role changes.
            </p>
          </div>
          <Switch defaultChecked aria-label="Two-factor authentication" />
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button>Save changes</Button>
          <Button variant="outline">
            <KeyRound className="mr-2 size-4" /> Reset password
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/dashboard/admin">Go to admin control centre</Link>
          </Button>
        </div>
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5" /> Photo uploads are signature-checked and
        re-encoded in the browser; only pixel data is stored, never the original file.
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
