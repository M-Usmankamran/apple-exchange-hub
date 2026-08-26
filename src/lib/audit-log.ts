export type AuditCategory =
  | "auth"
  | "vendor"
  | "listing"
  | "user"
  | "payment"
  | "complaint";

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditEntry = {
  id: string;
  at: string; // ISO timestamp
  actor: string;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  target: string;
  ip: string;
};

export const auditCategories: AuditCategory[] = [
  "auth",
  "vendor",
  "listing",
  "user",
  "payment",
  "complaint",
];

export const auditSeverities: AuditSeverity[] = ["info", "warning", "critical"];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const initialAudit: AuditEntry[] = [
  {
    id: "a-1001",
    at: hoursAgo(0.4),
    actor: "admin@applehub.pk",
    category: "auth",
    severity: "info",
    action: "Admin signed in",
    target: "Session #f81c",
    ip: "39.52.14.201",
  },
  {
    id: "a-1002",
    at: hoursAgo(1.2),
    actor: "admin@applehub.pk",
    category: "payment",
    severity: "warning",
    action: "Payout batch released",
    target: "Batch #338 · 6 vendors",
    ip: "39.52.14.201",
  },
  {
    id: "a-1003",
    at: hoursAgo(2.5),
    actor: "admin@applehub.pk",
    category: "vendor",
    severity: "warning",
    action: "CNIC resubmission requested",
    target: "Gadget Bazaar",
    ip: "39.52.14.201",
  },
  {
    id: "a-1004",
    at: hoursAgo(5),
    actor: "reviewer@applehub.pk",
    category: "listing",
    severity: "info",
    action: "Listing images verified",
    target: "iPhone 15 Pro Max · p-1",
    ip: "103.255.4.88",
  },
  {
    id: "a-1005",
    at: hoursAgo(7.5),
    actor: "reviewer@applehub.pk",
    category: "listing",
    severity: "critical",
    action: "Listing removed — stock photo fraud",
    target: "iPhone 12 mini · l-77",
    ip: "103.255.4.88",
  },
  {
    id: "a-1006",
    at: hoursAgo(11),
    actor: "admin@applehub.pk",
    category: "user",
    severity: "critical",
    action: "Account suspended",
    target: "faisal.k@mail.com",
    ip: "39.52.14.201",
  },
  {
    id: "a-1007",
    at: hoursAgo(14),
    actor: "system",
    category: "auth",
    severity: "critical",
    action: "5 failed sign-in attempts blocked",
    target: "admin@applehub.pk",
    ip: "45.118.132.9",
  },
  {
    id: "a-1008",
    at: hoursAgo(20),
    actor: "support@applehub.pk",
    category: "complaint",
    severity: "info",
    action: "Complaint resolved",
    target: "#C-2291 · refund issued",
    ip: "103.255.4.90",
  },
  {
    id: "a-1009",
    at: hoursAgo(27),
    actor: "admin@applehub.pk",
    category: "vendor",
    severity: "info",
    action: "Vendor approved",
    target: "Orchard Tech",
    ip: "39.52.14.201",
  },
  {
    id: "a-1010",
    at: hoursAgo(33),
    actor: "system",
    category: "payment",
    severity: "warning",
    action: "Chargeback opened by gateway",
    target: "Order #ORD-8841",
    ip: "—",
  },
  {
    id: "a-1011",
    at: hoursAgo(40),
    actor: "admin@applehub.pk",
    category: "user",
    severity: "info",
    action: "Role changed to vendor",
    target: "zainab.t@mail.com",
    ip: "39.52.14.201",
  },
  {
    id: "a-1012",
    at: hoursAgo(52),
    actor: "reviewer@applehub.pk",
    category: "listing",
    severity: "warning",
    action: "Listing flagged for battery mismatch",
    target: "iPhone 13 · p-8",
    ip: "103.255.4.88",
  },
  {
    id: "a-1013",
    at: hoursAgo(61),
    actor: "system",
    category: "auth",
    severity: "info",
    action: "Two-factor enforced for all admins",
    target: "Security policy",
    ip: "—",
  },
  {
    id: "a-1014",
    at: hoursAgo(70),
    actor: "support@applehub.pk",
    category: "complaint",
    severity: "warning",
    action: "Dispute escalated to admin",
    target: "#C-2274 · fake accessory",
    ip: "103.255.4.90",
  },
  {
    id: "a-1015",
    at: hoursAgo(80),
    actor: "admin@applehub.pk",
    category: "payment",
    severity: "info",
    action: "Vendor commission updated to 6%",
    target: "CoreX Mobiles",
    ip: "39.52.14.201",
  },
  {
    id: "a-1016",
    at: hoursAgo(96),
    actor: "admin@applehub.pk",
    category: "vendor",
    severity: "critical",
    action: "Vendor rejected — invalid documents",
    target: "QuickCell Traders",
    ip: "39.52.14.201",
  },
  {
    id: "a-1017",
    at: hoursAgo(120),
    actor: "system",
    category: "user",
    severity: "warning",
    action: "Suspicious login from new country",
    target: "hamza.s@mail.com",
    ip: "185.220.101.4",
  },
  {
    id: "a-1018",
    at: hoursAgo(150),
    actor: "reviewer@applehub.pk",
    category: "listing",
    severity: "info",
    action: "Listing images verified",
    target: "MacBook Air M3 · p-3",
    ip: "103.255.4.88",
  },
];

export const formatAuditTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const csvCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

export const auditToCsv = (rows: AuditEntry[]) =>
  [
    ["ID", "Timestamp (ISO)", "Actor", "Category", "Severity", "Action", "Target", "IP"],
    ...rows.map((r) => [
      r.id,
      r.at,
      r.actor,
      r.category,
      r.severity,
      r.action,
      r.target,
      r.ip,
    ]),
  ]
    .map((cols) => cols.map(csvCell).join(","))
    .join("\r\n");

export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
