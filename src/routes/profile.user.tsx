import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Package, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/site/AvatarUpload";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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

type ProfileForm = {
  display_name: string;
  phone: string;
  city: string;
  delivery_address: string;
};

const EMPTY: ProfileForm = { display_name: "", phone: "", city: "", delivery_address: "" };

function UserProfile() {
  const { user, loading, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(EMPTY);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, city, delivery_address")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setForm({
      display_name: p.display_name ?? "",
      phone: p.phone ?? "",
      city: p.city ?? "",
      delivery_address: p.delivery_address ?? "",
    });
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: async (values: ProfileForm) => {
      if (!user) throw new Error("You need to sign in first.");
      const payload = {
        id: user.id,
        display_name: values.display_name.trim() || null,
        phone: values.phone.trim() || null,
        city: values.city.trim() || null,
        delivery_address: values.delivery_address.trim() || null,
      };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw new Error(error.message);

      const { error: metaError } = await supabase.auth.updateUser({
        data: { display_name: payload.display_name ?? undefined },
      });
      if (metaError) throw new Error(metaError.message);
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in to manage your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your details are saved securely to your AppleHub account.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const heading = form.display_name || displayName;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge variant="secondary" className="gap-1">
        <Package className="h-3.5 w-3.5" /> Buyer profile
      </Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{heading}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your photo appears on orders, sell requests and vendor chats.
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <AvatarUpload role="user" name={heading} className="mt-5" />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
        className="mt-6 grid gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Personal details</h2>
        <Field
          id="u-name"
          label="Full name"
          value={form.display_name}
          onChange={(v) => setForm((f) => ({ ...f, display_name: v }))}
        />
        <div className="space-y-2">
          <Label htmlFor="u-email">Email</Label>
          <Input id="u-email" type="email" value={user?.email ?? ""} readOnly disabled />
        </div>
        <Field
          id="u-phone"
          label="Mobile number"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <Field
          id="u-city"
          label="City"
          value={form.city}
          onChange={(v) => setForm((f) => ({ ...f, city: v }))}
        />
        <div className="sm:col-span-2">
          <Field
            id="u-address"
            label="Delivery address"
            value={form.delivery_address}
            onChange={(v) => setForm((f) => ({ ...f, delivery_address: v }))}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.isPending || profileQuery.isLoading}>
            {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button variant="outline" asChild type="button">
            <Link to="/dashboard/user">
              <MapPin className="mr-2 size-4" /> Go to my dashboard
            </Link>
          </Button>
        </div>
      </form>

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
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
