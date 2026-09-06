import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "vendor" | "user";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string;
  roles: AppRole[];
  isAdmin: boolean;
  isVendor: boolean;
  emailVerified: boolean;
  vendorStatus: "none" | "pending" | "approved" | "rejected";
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [vendorStatus, setVendorStatus] =
    useState<AuthState["vendorStatus"]>("none");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setVendorStatus("none");
      return;
    }
    let active = true;
    void (async () => {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("profiles")
          .select("vendor_status")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (!active) return;
      setRoles(((roleRows ?? []).map((r) => r.role) as AppRole[]) ?? []);
      setVendorStatus(
        ((profile?.vendor_status as AuthState["vendorStatus"]) ?? "none"),
      );
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const user = session?.user ?? null;
  const meta = (user?.user_metadata ?? {}) as { display_name?: string };
  const displayName = meta.display_name || user?.email?.split("@")[0] || "Guest";

  return {
    session,
    user,
    loading,
    displayName,
    roles,
    isAdmin: roles.includes("admin"),
    isVendor: roles.includes("vendor"),
    emailVerified: Boolean(user?.email_confirmed_at ?? user?.confirmed_at),
    vendorStatus,
  };
}

export function homePathForRoles(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/dashboard/admin";
  if (roles.includes("vendor")) return "/dashboard/vendor";
  return "/dashboard/user";
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
