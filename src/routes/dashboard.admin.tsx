import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  CreditCard,
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
import { formatPrice, products, vendors } from "@/lib/marketplace-data";
import { approveVendorStore, removeVendorStore } from "@/lib/vendor-directory";

import {
  auditCategories,
  auditSeverities,
  auditToCsv,
  downloadCsv,
  formatAuditTime,
  initialAudit,
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
  component: AdminDashboard,
});

type Status = "pending" | "approved" | "rejected";

type VendorApplication = {
  id: string;
  shop: string;
  owner: string;
  city: string;
  cnic: string;
  phone: string;
  submitted: string;
  docs: { cnic: boolean; shopPhoto: boolean; utilityBill: boolean };
  status: Status;
};

type ListingReview = {
  id: string;
  product: string;
  vendor: string;
  price: number;
  images: number;
  flags: string[];
  status: Status;
};

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: "Buyer" | "Vendor" | "Admin";
  joined: string;
  orders: number;
  blocked: boolean;
};

type AdminOrder = {
  id: string;
  buyer: string;
  vendor: string;
  amount: number;
  method: "Card" | "Bank transfer" | "Cash on collection";
  payment: "Paid" | "Escrow" | "Refund requested" | "Pending";
  fulfilment: "Delivered" | "Rider en route" | "Awaiting pickup" | "Processing";
};

type Complaint = {
  id: string;
  from: string;
  against: string;
  topic: string;
  severity: "High" | "Medium" | "Low";
  detail: string;
  status: "open" | "resolved";
};

const initialApplications: VendorApplication[] = [
  {
    id: "va-1",
    shop: "iZone Digital",
    owner: "Faizan Malik",
    city: "Lahore",
    cnic: "35202-*******-7",
    phone: "+92 300 1122334",
    submitted: "2 hours ago",
    docs: { cnic: true, shopPhoto: true, utilityBill: false },
    status: "pending",
  },
  {
    id: "va-2",
    shop: "MacPoint Karachi",
    owner: "Sana Yousuf",
    city: "Karachi",
    cnic: "42101-*******-2",
    phone: "+92 321 8877665",
    submitted: "Yesterday",
    docs: { cnic: true, shopPhoto: true, utilityBill: true },
    status: "pending",
  },
  {
    id: "va-3",
    shop: "Gadget Bazaar",
    owner: "Imran Shah",
    city: "Rawalpindi",
    cnic: "37405-*******-9",
    phone: "+92 333 4455667",
    submitted: "3 days ago",
    docs: { cnic: false, shopPhoto: true, utilityBill: false },
    status: "pending",
  },
];

const initialListings: ListingReview[] = [
  {
    id: "lr-1",
    product: "iPhone 15 Pro Max 256GB",
    vendor: "Apex Apple Store",
    price: 389000,
    images: 6,
    flags: [],
    status: "pending",
  },
  {
    id: "lr-2",
    product: "iPhone 13 128GB",
    vendor: "CoreX Mobiles",
    price: 164000,
    images: 3,
    flags: ["Stock photo detected", "Serial not visible"],
    status: "pending",
  },
  {
    id: "lr-3",
    product: 'MacBook Air 13" M3',
    vendor: "Orchard Tech",
    price: 428000,
    images: 5,
    flags: ["Watermark from another store"],
    status: "pending",
  },
];

const initialUsers: PlatformUser[] = [
  {
    id: "u-1",
    name: "Hamza Sheikh",
    email: "hamza@example.com",
    role: "Buyer",
    joined: "Mar 2026",
    orders: 7,
    blocked: false,
  },
  {
    id: "u-2",
    name: "Bilal Ahmed",
    email: "bilal@apexapple.pk",
    role: "Vendor",
    joined: "Jan 2019",
    orders: 412,
    blocked: false,
  },
  {
    id: "u-3",
    name: "Maryam Iqbal",
    email: "maryam@example.com",
    role: "Buyer",
    joined: "Nov 2025",
    orders: 12,
    blocked: false,
  },
  {
    id: "u-4",
    name: "Rehan Qureshi",
    email: "rehan@example.com",
    role: "Buyer",
    joined: "Jul 2026",
    orders: 1,
    blocked: true,
  },
  {
    id: "u-5",
    name: "Ayesha Khan",
    email: "ayesha@orchardtech.pk",
    role: "Vendor",
    joined: "Feb 2021",
    orders: 188,
    blocked: false,
  },
];

const initialOrders: AdminOrder[] = [
  {
    id: "AH-24817",
    buyer: "Hamza Sheikh",
    vendor: "Apex Apple Store",
    amount: 389000,
    method: "Card",
    payment: "Paid",
    fulfilment: "Delivered",
  },
  {
    id: "AH-24818",
    buyer: "Maryam Iqbal",
    vendor: "CoreX Mobiles",
    amount: 1181000,
    method: "Bank transfer",
    payment: "Escrow",
    fulfilment: "Rider en route",
  },
  {
    id: "AH-24819",
    buyer: "Usman Kamran",
    vendor: "Lumen Accessories",
    amount: 9800,
    method: "Cash on collection",
    payment: "Pending",
    fulfilment: "Awaiting pickup",
  },
  {
    id: "AH-24820",
    buyer: "Rehan Qureshi",
    vendor: "Orchard Tech",
    amount: 312000,
    method: "Card",
    payment: "Refund requested",
    fulfilment: "Processing",
  },
];

const initialComplaints: Complaint[] = [
  {
    id: "c-1",
    from: "Rehan Qureshi",
    against: "Orchard Tech",
    topic: "Item not as described",
    severity: "High",
    detail:
      "Listing showed 256GB iPad Pro but the delivered unit is 128GB. Requesting a full refund.",
    status: "open",
  },
  {
    id: "c-2",
    from: "Hamza Sheikh",
    against: "CoreX Mobiles",
    topic: "Late rider pickup",
    severity: "Medium",
    detail: "Rider arrived four hours after the confirmed inspection slot.",
    status: "open",
  },
  {
    id: "c-3",
    from: "Maryam Iqbal",
    against: "Lumen Accessories",
    topic: "Custom print misaligned",
    severity: "Low",
    detail: "Printed case artwork is shifted 4mm from the preview.",
    status: "resolved",
  },
];

const revenueSeries = [
  { month: "Mar", value: 42 },
  { month: "Apr", value: 55 },
  { month: "May", value: 61 },
  { month: "Jun", value: 74 },
  { month: "Jul", value: 88 },
  { month: "Aug", value: 96 },
];

function AdminDashboard() {
  const [applications, setApplications] = useState(initialApplications);
  const [listings, setListings] = useState(initialListings);
  const [users, setUsers] = useState(initialUsers);
  const [orders, setOrders] = useState(initialOrders);
  const [complaints, setComplaints] = useState(initialComplaints);
  const [userQuery, setUserQuery] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [auditQuery, setAuditQuery] = useState("");
  const [auditCategory, setAuditCategory] = useState<string>("all");
  const [auditSeverity, setAuditSeverity] = useState<string>("all");
  const [auditActor, setAuditActor] = useState<string>("all");
  const [auditRange, setAuditRange] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState("10");
  const [openComplaint, setOpenComplaint] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");

  const log = (
    text: string,
    meta?: { category?: AuditCategory; severity?: AuditSeverity; target?: string },
  ) => {
    setAudit((prev) => [
      {
        id: `a-${Date.now()}`,
        at: new Date().toISOString(),
        actor: "admin@applehub.pk",
        category: meta?.category ?? "user",
        severity: meta?.severity ?? "info",
        action: text,
        target: meta?.target ?? "—",
        ip: "39.52.14.201",
      },
      ...prev,
    ]);
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


  const pendingVendors = applications.filter((a) => a.status === "pending").length;
  const pendingListings = listings.filter((l) => l.status === "pending").length;
  const openComplaints = complaints.filter((c) => c.status === "open").length;
  const gmv = useMemo(() => orders.reduce((s, o) => s + o.amount, 0), [orders]);

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(userQuery.toLowerCase()),
  );

  const decideVendor = (id: string, status: Status) => {
    const app = applications.find((a) => a.id === id);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (app) {
      if (status === "approved") {
        approveVendorStore({
          id: app.id,
          shop: app.shop,
          owner: app.owner,
          city: app.city,
          phone: app.phone,
        });
      } else {
        removeVendorStore(app.id);
      }
    }
    log(`Vendor “${app?.shop}” ${status === "approved" ? "approved" : "rejected"}`);
    toast.success(
      status === "approved"
        ? `${app?.shop} approved — now live on the Vendors page`
        : `${app?.shop} rejected`,
    );
  };


  const decideListing = (id: string, status: Status) => {
    const item = listings.find((l) => l.id === id);
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    log(`Listing “${item?.product}” ${status === "approved" ? "published" : "removed"}`);
    toast.success(`Listing ${status === "approved" ? "published" : "removed"}`);
  };

  const toggleUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u)));
    log(`${user?.blocked ? "Unblocked" : "Blocked"} account ${user?.email}`);
    toast.success(`${user?.name} ${user?.blocked ? "unblocked" : "blocked"}`);
  };

  const refund = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, payment: "Paid", fulfilment: "Processing" } : o)),
    );
    log(`Refund approved for order ${id}`);
    toast.success(`Refund approved for ${id}`);
  };

  const resolveComplaint = () => {
    if (!openComplaint) return;
    setComplaints((prev) =>
      prev.map((c) => (c.id === openComplaint.id ? { ...c, status: "resolved" } : c)),
    );
    log(`Complaint ${openComplaint.id} resolved against ${openComplaint.against}`);
    toast.success("Complaint marked resolved");
    setOpenComplaint(null);
    setReply("");
  };

  const stats = [
    { label: "Gross volume (30d)", value: formatPrice(gmv), icon: TrendingUp },
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
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        {/* Vendor approvals */}
        <TabsContent value="vendors" className="mt-6 space-y-4">
          {applications.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{a.shop}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.owner} · {a.city} · {a.phone}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CNIC {a.cnic} · submitted {a.submitted}
                  </p>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decideVendor(a.id, "approved")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideVendor(a.id, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <DocChip label="CNIC scan" ok={a.docs.cnic} />
                <DocChip label="Shop photo" ok={a.docs.shopPhoto} />
                <DocChip label="Utility bill" ok={a.docs.utilityBill} />
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Listing / image review */}
        <TabsContent value="listings" className="mt-6 space-y-4">
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
                      <BadgeCheck className="h-3.5 w-3.5" /> Image checks passed — originals
                      match the device serial.
                    </p>
                  )}
                </div>
                {l.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decideListing(l.id, "approved")}>
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decideListing(l.id, "rejected")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
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
                      No accounts match that search.
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
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell className="text-sm">
                      {o.buyer}
                      <span className="block text-xs text-muted-foreground">{o.vendor}</span>
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(o.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" /> {o.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.payment === "Paid"
                            ? "outline"
                            : o.payment === "Refund requested"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {o.payment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.fulfilment}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={o.payment !== "Refund requested"}
                        onClick={() => refund(o.id)}
                      >
                        Approve refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints" className="mt-6 space-y-4">
          {complaints.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.topic}</h3>
                    <Badge
                      variant={
                        c.severity === "High"
                          ? "destructive"
                          : c.severity === "Medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {c.severity}
                    </Badge>
                    {c.status === "resolved" && <Badge variant="outline">Resolved</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.from} → {c.against} · #{c.id}
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
              <Activity className="h-4 w-4" /> Monthly gross volume (PKR millions)
            </h3>
            <div className="mt-6 flex h-48 items-end gap-3">
              {revenueSeries.map((r) => (
                <div key={r.month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-primary/80"
                    style={{ height: `${r.value}%` }}
                    aria-label={`${r.month}: ${r.value}M`}
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
              {vendors.map((v) => {
                const share = Math.round(
                  (v.products / vendors.reduce((s, x) => s + x.products, 0)) * 100,
                );
                return (
                  <div key={v.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{v.name}</span>
                      <span className="text-muted-foreground">{share}%</span>
                    </div>
                    <Progress value={share} className="mt-2" />
                  </div>
                );
              })}
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-muted-foreground">
              {products.length} live listings across {vendors.length} approved stores ·
              average store rating{" "}
              {(vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(2)}.
            </p>
          </div>
        </TabsContent>

        {/* Audit log */}
        <TabsContent value="audit" className="mt-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">Account audit log</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Immutable record of every administrative action, sign-in and payout.
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
