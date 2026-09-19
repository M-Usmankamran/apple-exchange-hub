import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Eye, IdCard, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  decideCnic,
  getCnicDocumentUrl,
  listCnicSubmissions,
  type CnicSubmission,
} from "@/lib/cnic.functions";

export function CnicReviewPanel({ onLog }: { onLog?: (message: string) => void }) {
  const fetchSubmissions = useServerFn(listCnicSubmissions);
  const fetchUrl = useServerFn(getCnicDocumentUrl);
  const decide = useServerFn(decideCnic);
  const queryClient = useQueryClient();

  const [active, setActive] = useState<CnicSubmission | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const submissions = useQuery({
    queryKey: ["cnic-submissions"],
    queryFn: () => fetchSubmissions(),
  });

  const open = async (s: CnicSubmission) => {
    setActive(s);
    setReason(s.rejectionReason ?? "");
    setDocUrl(null);
    setBackUrl(null);
    setBackError(null);
    try {
      const { url } = await fetchUrl({ data: { userId: s.userId, side: "front" } });
      setDocUrl(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open that document.");
    }
    try {
      const { url } = await fetchUrl({ data: { userId: s.userId, side: "back" } });
      setBackUrl(url);
    } catch (error) {
      setBackError(
        error instanceof Error ? error.message : "Could not open the back picture.",
      );
    }
  };

  const decision = useMutation({
    mutationFn: (vars: { s: CnicSubmission; status: "verified" | "rejected"; reason: string }) =>
      decide({ data: { userId: vars.s.userId, status: vars.status, reason: vars.reason } }),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.status === "verified"
          ? `${vars.s.displayName} identity verified`
          : `${vars.s.displayName} document rejected`,
      );
      onLog?.(
        `CNIC ${vars.status === "verified" ? "verified" : "rejected"} for ${vars.s.email}${
          vars.status === "rejected" ? ` — ${vars.reason}` : ""
        }`,
      );
      setActive(null);
      setDocUrl(null);
      void queryClient.invalidateQueries({ queryKey: ["cnic-submissions"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save that decision."),
  });

  const rows = submissions.data ?? [];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">CNIC verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Identity documents submitted by buyers and vendors. Documents are stored privately and opened
        through a short-lived secure link.
      </p>

      {submissions.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading submissions…</p>
      ) : submissions.isError ? (
        <p className="mt-4 text-sm text-destructive">
          Could not load CNIC submissions. Please refresh the page.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No CNIC documents submitted yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((s) => (
            <div
              key={s.userId}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{s.displayName}</h3>
                  <Badge
                    variant={
                      s.status === "verified"
                        ? "default"
                        : s.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {s.status === "verified"
                      ? "Verified"
                      : s.status === "rejected"
                        ? "Rejected"
                        : "Pending verification"}
                  </Badge>
                  <Badge variant="outline">{s.accountType}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.email} · {s.phone} · {s.city}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  CNIC {s.cnicNumber} · submitted {new Date(s.submittedAt).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void open(s)}>
                <Eye className="mr-2 h-4 w-4" /> Review document
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(active)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setActive(null);
            setDocUrl(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Identity document review</DialogTitle>
            <DialogDescription>
              Check that the CNIC is clear and matches the account details before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{active?.displayName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {active?.email} · {active?.phone} · {active?.city} · CNIC {active?.cnicNumber}
              </p>
            </div>

            <div className="grid min-h-48 place-items-center rounded-xl border bg-secondary/40 p-3">
              {docUrl ? (
                <img
                  src={docUrl}
                  alt="Submitted CNIC document"
                  className="max-h-72 w-full rounded-lg object-contain"
                />
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Opening secure document…
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Reason / request a new upload (required to reject)
              </label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Photo is blurred — please upload a clearer image of the CNIC front."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={decision.isPending || !active}
                onClick={() =>
                  active && decision.mutate({ s: active, status: "verified", reason: "" })
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve verification
              </Button>
              <Button
                variant="destructive"
                disabled={decision.isPending || !active || !reason.trim()}
                onClick={() =>
                  active && decision.mutate({ s: active, status: "rejected", reason })
                }
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject with reason
              </Button>
              <Button variant="ghost" onClick={() => setActive(null)}>
                <IdCard className="mr-2 h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
