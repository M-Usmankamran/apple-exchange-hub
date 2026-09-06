import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/hooks/use-auth";

/**
 * Builds the sign-in link for the page/action the visitor tried to reach, so we
 * can bring them straight back after they authenticate.
 */
export function signInHref(returnTo: string) {
  return `/auth?redirect=${encodeURIComponent(returnTo)}`;
}

/**
 * Use inside click handlers for protected actions (add to cart, place a bid,
 * submit a sell/exchange request…). Returns true when the visitor is signed in;
 * otherwise it sends them to the sign-in page and returns false.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });

  return (message = "Please sign in to continue.") => {
    if (loading) return false;
    if (user) return true;
    toast.error(message);
    navigate({ to: "/auth", search: { redirect: pathname }, replace: false });
    return false;
  };
}

/**
 * Wraps a whole page that must not be visible to the wrong audience. Renders a
 * clear sign-in / no-access panel instead of the page content. The database
 * itself is the real gate — access rules on every table reject data requests
 * from the wrong account, so this is the polish on top, not the only defence.
 */
export function AuthGate({
  role,
  title,
  children,
}: {
  role?: AppRole;
  title?: string;
  children: React.ReactNode;
}) {
  const { user, loading, roles } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.href });

  if (loading) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Sign in to continue</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {title
            ? `You need an account to open ${title}.`
            : "You need an account to open this page."}{" "}
          Browsing the marketplace stays open to everyone.
        </p>
        <Button asChild className="mt-6">
          <Link to={signInHref(pathname)}>Sign in or create an account</Link>
        </Button>
      </div>
    );
  }

  if (role && !roles.includes(role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">You don’t have access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This area is limited to {role} accounts. If you believe this is a
          mistake, contact the platform owner.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Back to homepage</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
