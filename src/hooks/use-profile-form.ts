import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type ProfileFields = {
  display_name: string;
  phone: string;
  city: string;
  delivery_address: string;
  shop_name: string;
  owner_name: string;
  cnic_number: string;
  pickup_hours: string;
  shop_description: string;
};

const EMPTY: ProfileFields = {
  display_name: "",
  phone: "",
  city: "",
  delivery_address: "",
  shop_name: "",
  owner_name: "",
  cnic_number: "",
  pickup_hours: "",
  shop_description: "",
};

const KEYS = Object.keys(EMPTY) as (keyof ProfileFields)[];

/** Loads the signed-in user's profile row and saves every field back to the database. */
export function useProfileForm() {
  const auth = useAuth();
  const { user } = auth;
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileFields>(EMPTY);

  const query = useQuery({
    queryKey: ["profile-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(KEYS.join(","))
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as Partial<Record<keyof ProfileFields, string | null>> | null;
    },
  });

  useEffect(() => {
    const p = query.data;
    if (!p) return;
    const next = { ...EMPTY };
    for (const k of KEYS) next[k] = (p[k] as string | null) ?? "";
    setForm(next);
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (values: ProfileFields) => {
      if (!user) throw new Error("You need to sign in first.");
      const payload: Record<string, string | null> = { id: user.id };
      for (const k of KEYS) payload[k] = values[k].trim() || null;
      const { error } = await supabase
        .from("profiles")
        .upsert(payload as never, { onConflict: "id" });
      if (error) throw new Error(error.message);
      if (payload["display_name"]) {
        await supabase.auth.updateUser({ data: { display_name: payload["display_name"] } });
      }
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile-full", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof ProfileFields>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return { auth, form, set, save, loadingProfile: query.isLoading };
}
