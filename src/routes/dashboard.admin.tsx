import { AuthGate } from "@/components/site/AuthGate";
import { CnicReviewPanel } from "@/components/site/CnicReviewPanel";
import {
  MAX_CNIC_LENGTH,
  MAX_PHONE_LENGTH,
  formatCnic,
  formatPhone,
  pkCities,
} from "@/lib/form-options";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  CreditCard,
  FileText,
  Download,
  ImageIcon,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/marketplace-data";
import { approveVendorStore, removeVendorStore } from "@/lib/vendor-directory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  decideVendorSignup,
  listVendorSignups,
  type VendorSignup,
} from "@/lib/vendor-approvals.functions";
import {
  addAudit,
  decideListing as decideListingSrv,
  listAllListings,
  listAllOrders,
  listAudit,
  listComplaints,
  listUsers,
  resolveComplaint as resolveComplaintSrv,
  setUserBlocked,
  updateOrder,
} from "@/lib/admin.functions";

import {
  auditCategories,
  auditSeverities,
  auditToCsv,
  downloadCsv,
  formatAuditTime,
  type AuditCategory,
  type AuditEntry,
  type AuditSeverity,
} from "@/lib/audit-log";


export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Centre — Vendors, Listings & Payments | AppleHub" },
      {
        name: "description",
        content:
          "Approve vendors, review listing images, manage users, monitor orders and payments, resolve complaints and audit every admin action.",
      },
      { property: "og:title", content: "AppleHub Admin Control Centre" },
      {
        property: "og:description",
        content:
          "Vendor approvals, image verification, user management, payments, complaints and analytics in one secure panel.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate role="admin" title="the admin dashboard">
      <AdminDashboard />
    </AuthGate>
  ),
});

type Status = "pending" | "approved" | "rejected";

type Complaint = {
  id: string;
  from: string;
  against: string;
  topic: string;
  severity: "High" | "Medium" | "Low";
  detail: string;
  status: "open" | "resolved";
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [userQuery, setUserQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditCategory, setAuditCategory] = useState<string>("all");
  const [auditSeverity, setAuditSeverity] = useState<string>("all");
  const [auditActor, setAuditActor] = useState<string>("all");
  const [auditRange, setAuditRange] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState("10");
  const [openComplaint, setOpenComplaint] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");

  const fetchAudit = useServerFn(listAudit);
  const addAuditFn = useServerFn(addAudit);
  const fetchListings = useServerFn(listAllListings);
  const decideListingFn = useServerFn(decideListingSrv);
  const fetchUsers = useServerFn(listUsers);
  const blockFn = useServerFn(setUserBlocked);
  const fetchOrders = useServerFn(listAllOrders);
  const updateOrderFn = useServerFn(updateOrder);
  const fetchComplaints = useServerFn(listComplaints);
  const resolveFn = useServerFn(resolveComplaintSrv);

  const auditQ = useQuery({ queryKey: ["admin-audit"], queryFn: () => fetchAudit() });
  const listingsQ = useQuery({ queryKey: ["admin-listings"], queryFn: () => fetchListings() });
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const ordersQ = useQuery({ queryKey: ["admin-orders"], queryFn: () => fetchOrders() });
  const complaintsQ = useQuery({ queryKey: ["admin-complaints"], queryFn: () => fetchComplaints() });

  const audit = (auditQ.data ?? []) as AuditEntry[];
  const listings = listingsQ.data ?? [];
  const users = usersQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const complaints = complaintsQ.data ?? [];

  const refreshAudit = () => void queryClient.invalidateQueries({ queryKey: ["admin-audit"] });

  const log = (
    text: string,
    meta?: { category?: AuditCategory; severity?: AuditSeverity; target?: string },
  ) => {
    addAuditFn({
      data: {
        action: text.slice(0, 500),
        category: meta?.category ?? "user",
        severity: meta?.severity ?? "info",
        target: (meta?.target ?? "—").slice(0, 200),
      },
    })
      .then(refreshAudit)
      .catch(() => undefined);
  };

  const auditActors = useMemo(
    () => Array.from(new Set(audit.map((a) => a.actor))).sort(),
    [audit],
  );

  const filteredAudit = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    const cutoff =
      auditRange === "all" ? 0 : Date.now() - Number(auditRange) * 3600_000;
    return audit
      .filter((a) => (auditCategory === "all" ? true : a.category === auditCategory))
      .filter((a) => (auditSeverity === "all" ? true : a.severity === auditSeverity))
      .filter((a) => (auditActor === "all" ? true : a.actor === auditActor))
      .filter((a) => (cutoff ? new Date(a.at).getTime() >= cutoff : true))
      .filter((a) =>
        q
          ? `${a.id} ${a.action} ${a.target} ${a.actor} ${a.ip}`.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [audit, auditQuery, auditCategory, auditSeverity, auditActor, auditRange]);

  const auditPerPage = Number(auditPageSize);
  const auditPages = Math.max(1, Math.ceil(filteredAudit.length / auditPerPage));
  const auditCurrentPage = Math.min(auditPage, auditPages);
  const pagedAudit = filteredAudit.slice(
    (auditCurrentPage - 1) * auditPerPage,
    auditCurrentPage * auditPerPage,
  );

  const resetAuditFilters = () => {
    setAuditQuery("");
    setAuditCategory("all");
    setAuditSeverity("all");
    setAuditActor("all");
    setAuditRange("all");
    setAuditPage(1);
  };

  const exportAudit = () => {
    if (!filteredAudit.length) {
      toast.error("Nothing to export with the current filters.");
      return;
    }
    downloadCsv(
      `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      auditToCsv(filteredAudit),
    );
    toast.success(`Exported ${filteredAudit.length} audit entries to CSV.`);
  };

  const fetchSignups = useServerFn(listVendorSignups);
  const decideSignup = useServerFn(decideVendorSignup);

  const signupsQuery = useQuery({
    queryKey: ["vendor-signups"],
    queryFn: () => fetchSignups(),
  });
  const signups: VendorSignup[] = signupsQuery.data ?? [];
  const pendingSignups = signups.filter((s) => s.status === "pending" || s.status === "none");

  const signupDecision = useMutation({
    mutationFn: (vars: { signup: VendorSignup; status: "approved" | "rejected" }) =>
      decideSignup({
        data: {
          userId: vars.signup.userId,
          status: vars.status,
          shop: vars.signup.shop,
          phone: vars.signup.phone,
          city: vars.signup.city,
        },
      }),
    onSuccess: (_res, vars) => {
      if (vars.status === "approved") {
        approveVendorStore({
          id: vars.signup.userId,
          shop: vars.signup.shop,
          owner: vars.signup.owner,
          city: vars.signup.city === "Not provided" ? "Pakistan" : vars.signup.city,
          phone: vars.signup.phone === "Not provided" ? "" : vars.signup.phone,
        });
      } else {
        removeVendorStore(vars.signup.userId);
      }
      log(`Vendor account ${vars.status === "approved" ? "approved" : "rejected"}`, {
        category: "vendor",
        severity: vars.status === "approved" ? "info" : "warning",
        target: vars.signup.email,
      });
      toast.success(
        vars.status === "approved"
          ? `${vars.signup.shop} approved — they can now use the vendor dashboard`
          : `${vars.signup.shop} rejected`,
      );
      void queryClient.invalidateQueries({ queryKey: ["vendor-signups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: unknown) => toast.error(errMsg(error)),
  });

  const [reviewSignup, setReviewSignup] = useState<VendorSignup | null>(null);
  const [reviewForm, setReviewForm] = useState({
    shop: "",
    phone: "",
    city: "",
    cnic: "",
    cnicChecked: false,
    shopChecked: false,
    billChecked: false,
    notes: "",
  });
  const allDocsChecked =
    reviewForm.cnicChecked && reviewForm.shopChecked && reviewForm.billChecked;

  const openReview = (s: VendorSignup) => {
    setReviewSignup(s);
    setReviewForm({
      shop: s.shop === "Unnamed vendor" ? "" : s.shop,
      phone: s.phone === "Not provided" ? "" : s.phone,
      city: s.city === "Not provided" ? "" : s.city,
      cnic: "",
      cnicChecked: false,
      shopChecked: false,
      billChecked: false,
      notes: "",
    });
  };

  const submitReview = (status: "approved" | "rejected") => {
    if (!reviewSignup) return;
    if (status === "approved" && !reviewForm.shop.trim()) {
      toast.error("Add a shop name before approving.");
      return;
    }
    signupDecision.mutate({
      signup: {
        ...reviewSignup,
        shop: reviewForm.shop.trim() || reviewSignup.shop,
        owner: reviewForm.shop.trim() || reviewSignup.owner,
        phone: reviewForm.phone.trim() || "Not provided",
        city: reviewForm.city.trim() || "Not provided",
      },
      status,
    });
    if (reviewForm.notes.trim()) {
      log(`Review note: ${reviewForm.notes.trim()}`, { category: "vendor", target: reviewSignup.email });
    }
    setReviewSignup(null);
  };

  const listingMut = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) => decideListingFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(`Listing ${v.status === "approved" ? "published" : "removed"}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      refreshAudit();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const decideListing = (id: string, status: Status) => {
    if (status === "pending") return;
    listingMut.mutate({ id, status });
  };

  const blockMut = useMutation({
    mutationFn: (v: { userId: string; blocked: boolean }) => blockFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.blocked ? "Account blocked" : "Account unblocked");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refreshAudit();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const toggleUser = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (u) blockMut.mutate({ userId: id, blocked: !u.blocked });
  };

  const orderMut = useMutation({
    mutationFn: (v: { id: string; action: "refund" | "mark_paid" | "cancel" | "advance" }) =>
      updateOrderFn({ data: v }),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      refreshAudit();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const resolveMut = useMutation({
    mutationFn: (v: { id: string; resolution: string }) => resolveFn({ data: v }),
    onSuccess: () => {
      toast.success("Complaint marked resolved");
      void queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      refreshAudit();
      setOpenComplaint(null);
      setReply("");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const resolveComplaint = () => {
    if (!openComplaint || !reply.trim()) return;
    resolveMut.mutate({ id: openComplaint.id, resolution: reply.trim() });
  };

  const pendingVendors = pendingSignups.length;
  const pendingListings = listings.filter((l) => l.status === "pending").length;
  const openComplaints = complaints.filter((c) => c.status === "open").length;
  const gmv = useMemo(
    () =>
      orders
        .filter((o) => o.payment === "paid" && Date.now() - new Date(o.createdAt).getTime() < 30 * 864e5)
        .reduce((s, o) => s + o.amount, 0),
    [orders],
  );

  const revenueSeries = useMemo(() => {
    const months: { key: string; month: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString("en", { month: "short" }),
        total: 0,
      });
    }
    for (const o of orders) {
      if (o.payment !== "paid") continue;
      const d = new Date(o.createdAt);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.total += o.amount;
    }
    const max = Math.max(1, ...months.map((m) => m.total));
    return months.map((m) => ({ month: m.month, total: m.total, value: Math.round((m.total / max) * 100) }));
  }, [orders]);

  const topVendors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) counts.set(l.vendor, (counts.get(l.vendor) ?? 0) + 1);
    const total = listings.length || 1;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, n]) => ({ name, share: Math.round((n / total) * 100) }));
  }, [listings]);

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(userQuery.toLowerCase()),
  );

  const stats = [
    { label: "Paid volume (30d)", value: formatPrice(gmv), icon: TrendingUp },
    { label: "Vendors pending", value: String(pendingVendors), icon: Store },
    { label: "Listings to review", value: String(pendingListings), icon: ImageIcon },
    { label: "Open complaints", value: String(openComplaints), icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin access
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">Control centre</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Approve vendors, verify listing images, manage accounts, watch payments and settle
            disputes. Every action you take is written to the audit log.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/shop">
            <LayoutDashboard className="mr-2 h-4 w-4" /> View storefront
          </Link>
        </Button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="vendors" className="mt-10">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="vendors">Vendor approvals</TabsTrigger>
          <TabsTrigger value="listings">Listing review</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders &amp; payments</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cnic">CNIC verification</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        {/* Vendor approvals */}
        <TabsContent value="vendors" className="mt-6 space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Vendor sign-ups</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real accounts that registered as vendors on the website.
            </p>
            {signupsQuery.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading vendor sign-ups…</p>
            ) : signupsQuery.isError ? (
              <p className="mt-4 text-sm text-destructive">
                Could not load vendor sign-ups. Please refresh the page.
              </p>
            ) : signups.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No vendor sign-ups yet. New vendor registrations will show up here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {signups.map((s) => {
                  const isPending = s.status === "pending" || s.status === "none";
                  return (
                    <div
                      key={s.userId}
                      className="flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{s.shop}</h3>
                          <StatusBadge status={isPending ? "pending" : (s.status as Status)} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.email} · {s.phone} · {s.city}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Registered {new Date(s.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openReview(s)}>
                          <FileText className="mr-2 h-4 w-4" /> Review application
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Dialog
            open={Boolean(reviewSignup)}
            onOpenChange={(open) => {
              if (!open) setReviewSignup(null);
            }}
          >
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Vendor application</DialogTitle>
                <DialogDescription>
                  Check the details and documents, then approve or reject this vendor.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{reviewSignup?.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registered{" "}
                    {reviewSignup
                      ? new Date(reviewSignup.submittedAt).toLocaleDateString()
                      : "—"}{" "}
                    · current status {reviewSignup?.status}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Shop / store name
                    </label>
                    <Input
                      value={reviewForm.shop}
                      onChange={(e) => setReviewForm((f) => ({ ...f, shop: e.target.value }))}
                      placeholder="e.g. iZone Digital"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Contact phone
                    </label>
                    <Input
                      value={reviewForm.phone}
                      inputMode="numeric"
                      maxLength={MAX_PHONE_LENGTH}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
                      }
                      placeholder="03001234567"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">City</label>
                    <Select
                      value={reviewForm.city}
                      onValueChange={(v) => setReviewForm((f) => ({ ...f, city: v }))}
                    >
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
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      CNIC number
                    </label>
                    <Input
                      value={reviewForm.cnic}
                      inputMode="numeric"
                      maxLength={MAX_CNIC_LENGTH}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, cnic: formatCnic(e.target.value) }))
                      }
                      placeholder="35202-1234567-8"
                    />
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Documents verified
                  </p>
                  {(
                    [
                      ["cnicChecked", "CNIC scan matches the owner"],
                      ["shopChecked", "Shop photo looks genuine"],
                      ["billChecked", "Utility bill / address proof seen"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={reviewForm[key]}
                        onChange={(e) =>
                          setReviewForm((f) => ({ ...f, [key]: e.target.checked }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Review notes (saved to the audit log)
                  </label>
                  <Textarea
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="What you checked, anything still missing…"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => submitReview("rejected")}
                    disabled={signupDecision.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    onClick={() => submitReview("approved")}
                    disabled={signupDecision.isPending || !allDocsChecked}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve vendor
                  </Button>
                </div>
                {!allDocsChecked && (
                  <p className="text-right text-xs text-muted-foreground">
                    Tick all three document checks to enable approval.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>


        </TabsContent>

        {/* Listing / image review */}
        <TabsContent value="listings" className="mt-6 space-y-4">
          {!listingsQ.isLoading && listings.length === 0 && (
            <p className="text-sm text-muted-foreground">No vendor listings yet.</p>
          )}
          {listingsQ.isError && <p className="text-sm text-destructive">{errMsg(listingsQ.error)}</p>}
          {listings.map((l) => (
            <div key={l.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{l.product}</h3>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {l.vendor} · {formatPrice(l.price)} · {l.images} images uploaded
                  </p>
                  {l.flags.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {l.flags.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-destructive"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5" /> Photos, description and stock look complete.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {l.status !== "approved" && (
                    <Button size="sm" disabled={listingMut.isPending} onClick={() => decideListing(l.id, "approved")}>
                      Publish
                    </Button>
                  )}
                  {l.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={listingMut.isPending}
                      onClick={() => decideListing(l.id, "rejected")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search name, email or role"
              className="pl-9"
              aria-label="Search users"
            />
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="font-medium">{u.name}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.joined}</TableCell>
                    <TableCell className="text-sm">{u.orders}</TableCell>
                    <TableCell>
                      {u.blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleUser(u.id)}>
                        <Ban className="mr-2 h-4 w-4" />
                        {u.blocked ? "Unblock" : "Block"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {usersQ.isLoading ? "Loading accounts…" : usersQ.isError ? errMsg(usersQ.error) : "No accounts match that search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Orders & payments */}
        <TabsContent value="orders" className="mt-6">
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer / Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Fulfilment</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      {ordersQ.isLoading ? "Loading orders…" : ordersQ.isError ? errMsg(ordersQ.error) : "No orders yet."}
                    </TableCell>
                  </TableRow>
                )}
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {o.shortId}
                      <span className="block text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.buyer}
                      <span className="block text-xs text-muted-foreground">{o.vendor}</span>
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(o.amount)}</TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" /> {o.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={o.payment === "paid" ? "outline" : o.payment === "refunded" || o.payment === "failed" ? "destructive" : "secondary"}
                      >
                        {o.payment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">{o.fulfilment}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {o.fulfilment !== "delivered" && o.fulfilment !== "cancelled" && (
                          <Button size="sm" variant="outline" disabled={orderMut.isPending} onClick={() => orderMut.mutate({ id: o.id, action: "advance" })}>
                            Advance
                          </Button>
                        )}
                        {o.payment !== "paid" && o.payment !== "refunded" && (
                          <Button size="sm" variant="outline" disabled={orderMut.isPending} onClick={() => orderMut.mutate({ id: o.id, action: "mark_paid" })}>
                            Mark paid
                          </Button>
                        )}
                        {o.payment === "paid" && (
                          <Button size="sm" variant="outline" disabled={orderMut.isPending} onClick={() => { if (confirm("Refund this order?")) orderMut.mutate({ id: o.id, action: "refund" }); }}>
                            Refund
                          </Button>
                        )}
                        {o.payment !== "paid" && o.fulfilment !== "cancelled" && (
                          <Button size="sm" variant="ghost" disabled={orderMut.isPending} onClick={() => orderMut.mutate({ id: o.id, action: "cancel" })}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints" className="mt-6 space-y-4">
          {complaints.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {complaintsQ.isLoading ? "Loading complaints…" : "No complaints have been filed."}
            </p>
          )}
          {complaints.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.topic}</h3>
                    <Badge variant={c.severity === "High" ? "destructive" : c.severity === "Medium" ? "secondary" : "outline"}>
                      {c.severity}
                    </Badge>
                    {c.status === "resolved" && <Badge variant="outline">Resolved</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.from} → {c.against} · #{c.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{c.detail}</p>
                </div>
                {c.status === "open" && (
                  <Button size="sm" onClick={() => setOpenComplaint(c)}>
                    Review
                  </Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold">
              <Activity className="h-4 w-4" /> Monthly paid volume (last 6 months)
            </h3>
            <div className="mt-6 flex h-48 items-end gap-3">
              {revenueSeries.map((r) => (
                <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(r.value, 2)}%` }}
                    title={`${r.month}: ${formatPrice(r.total)}`}
                    aria-label={`${r.month}: ${formatPrice(r.total)}`}
                  />
                  <span className="text-xs text-muted-foreground">{r.month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4" /> Top vendors by listings
            </h3>
            <div className="mt-5 space-y-4">
              {topVendors.length === 0 && <p className="text-sm text-muted-foreground">No listings yet.</p>}
              {topVendors.map((v) => (
                <div key={v.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground">{v.share}%</span>
                  </div>
                  <Progress value={v.share} className="mt-2" />
                </div>
              ))}
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-muted-foreground">
              {listings.filter((l) => l.status === "approved").length} live listings ·{" "}
              {users.filter((u) => u.role === "Vendor").length} vendors ·{" "}
              {users.filter((u) => u.role === "Buyer").length} buyers · {orders.length} orders.
            </p>
          </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetAuditFilters}>
                  Reset filters
                </Button>
                <Button onClick={exportAudit}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={auditQuery}
                  onChange={(e) => {
                    setAuditQuery(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Search action, target, actor or IP…"
                  className="pl-9"
                  aria-label="Search audit log"
                />
              </div>
              <Select
                value={auditCategory}
                onValueChange={(v) => {
                  setAuditCategory(v);
                  setAuditPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {auditCategories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={auditSeverity}
                onValueChange={(v) => {
                  setAuditSeverity(v);
                  setAuditPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by severity">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  {auditSeverities.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={auditActor}
                onValueChange={(v) => {
                  setAuditActor(v);
                  setAuditPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by actor">
                  <SelectValue placeholder="Actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actors</SelectItem>
                  {auditActors.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={auditRange}
                onValueChange={(v) => {
                  setAuditRange(v);
                  setAuditPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by time range">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="1">Last hour</SelectItem>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="72">Last 3 days</SelectItem>
                  <SelectItem value="168">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={auditPageSize}
                onValueChange={(v) => {
                  setAuditPageSize(v);
                  setAuditPage(1);
                }}
              >
                <SelectTrigger aria-label="Rows per page">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAudit.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatAuditTime(a.at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{a.actor}</TableCell>
                      <TableCell className="text-sm font-medium">{a.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.target}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={a.severity} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {a.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!pagedAudit.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No audit entries match these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing {pagedAudit.length} of {filteredAudit.length} filtered entries ·{" "}
                {audit.length} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditCurrentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {auditCurrentPage} of {auditPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => Math.min(auditPages, p + 1))}
                  disabled={auditCurrentPage >= auditPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CNIC identity verification */}
        <TabsContent value="cnic" className="mt-6">
          <CnicReviewPanel onLog={log} />
        </TabsContent>

      </Tabs>

      <Dialog open={!!openComplaint} onOpenChange={(o) => !o && setOpenComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openComplaint?.topic}</DialogTitle>
            <DialogDescription>
              {openComplaint?.from} vs {openComplaint?.against} · #{openComplaint?.id}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{openComplaint?.detail}</p>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Resolution note sent to both parties…"
            rows={4}
          />
          <Button onClick={resolveComplaint} disabled={!reply.trim()}>
            Resolve &amp; notify
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "approved") return <Badge variant="outline">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function DocChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
        ok ? "text-muted-foreground" : "border-destructive/40 text-destructive"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  if (severity === "critical") return <Badge variant="destructive">Critical</Badge>;
  if (severity === "warning") return <Badge variant="secondary">Warning</Badge>;
  return <Badge variant="outline">Info</Badge>;
}
