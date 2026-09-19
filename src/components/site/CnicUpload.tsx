import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, IdCard, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AVATAR_ACCEPTED_TYPES, validateAvatarFile } from "@/lib/avatar-store";
import { MAX_CNIC_LENGTH, formatCnic } from "@/lib/form-options";
import { cn } from "@/lib/utils";

type Row = {
  status: "pending" | "verified" | "rejected";
  cnic_number: string | null;
  rejection_reason: string | null;
  submitted_at: string;
};

const STATUS_LABEL = {
  not_uploaded: "Not uploaded",
  pending: "Pending verification",
  verified: "Verified",
  rejected: "Rejected",
} as const;

type Picked = { file: File; url: string } | null;

export function CnicUpload({
  accountType,
  className,
}: {
  accountType: "buyer" | "vendor";
  className?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [front, setFront] = useState<Picked>(null);
  const [back, setBack] = useState<Picked>(null);
  const [cnicNumber, setCnicNumber] = useState("");

  const record = useQuery({
    queryKey: ["cnic", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row | null> => {
      const { data, error } = await supabase
        .from("cnic_verifications")
        .select("status, cnic_number, rejection_reason, submitted_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Row) ?? null;
    },
  });

  useEffect(() => {
    if (record.data?.cnic_number) setCnicNumber(record.data.cnic_number);
  }, [record.data?.cnic_number]);

  useEffect(
    () => () => {
      if (front) URL.revokeObjectURL(front.url);
      if (back) URL.revokeObjectURL(back.url);
    },
    [front, back],
  );

  const status = record.data ? record.data.status : "not_uploaded";
  const locked = status === "pending" || status === "verified";

  const pick = async (file: File | undefined, side: "front" | "back") => {
    if (!file) return;
    const result = await validateAvatarFile(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const current = side === "front" ? front : back;
    if (current) URL.revokeObjectURL(current.url);
    const next = { file, url: result.objectUrl };
    if (side === "front") setFront(next);
    else setBack(next);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in first.");
      if (!front) throw new Error("Attach the front picture of your CNIC.");
      if (!back) throw new Error("Attach the back picture of your CNIC.");
      const digits = cnicNumber.replace(/\D/g, "");
      if (digits.length !== 13) throw new Error("Enter your 13-digit CNIC number.");

      const ext = (file: File) =>
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const stamp = Date.now();
      // Paths are namespaced by user id; the bucket is private and admin-read only.
      const frontPath = `${user.id}/cnic-front-${stamp}.${ext(front.file)}`;
      const backPath = `${user.id}/cnic-back-${stamp}.${ext(back.file)}`;

      for (const [path, file] of [
        [frontPath, front.file],
        [backPath, back.file],
      ] as const) {
        const { error: uploadError } = await supabase.storage
          .from("cnic-documents")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) throw new Error(uploadError.message);
      }

      const { error } = await supabase.from("cnic_verifications").upsert(
        {
          user_id: user.id,
          account_type: accountType,
          cnic_number: cnicNumber.trim(),
          document_path: frontPath,
          document_back_path: backPath,
          status: "pending",
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (front) URL.revokeObjectURL(front.url);
      if (back) URL.revokeObjectURL(back.url);
      setFront(null);
      setBack(null);
      if (frontRef.current) frontRef.current.value = "";
      if (backRef.current) backRef.current.value = "";
      toast.success("CNIC submitted for verification.");
      queryClient.invalidateQueries({ queryKey: ["cnic", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Sign in to submit your CNIC for identity verification.
      </p>
    );
  }

  const digits = cnicNumber.replace(/\D/g, "");
  const ready = Boolean(front && back && digits.length === 13);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {record.data && (
          <span className="text-xs text-muted-foreground">
            Submitted {new Date(record.data.submitted_at).toLocaleString()}
          </span>
        )}
      </div>

      {status === "rejected" && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 text-destructive" />
          <div>
            <p className="font-medium">Your document was rejected</p>
            <p className="text-muted-foreground">
              {record.data?.rejection_reason || "Please upload clearer photos of your CNIC."}
            </p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <p className="text-sm text-muted-foreground">
          Your identity is verified. Your documents stay private and are only visible to authorised
          reviewers.
        </p>
      )}

      {!locked && (
        <>
          <p className="text-sm text-muted-foreground">
            Both sides of your CNIC are required — attach the front picture and the back picture.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cnic-number">CNIC number (13 digits)</Label>
              <Input
                id="cnic-number"
                inputMode="numeric"
                maxLength={MAX_CNIC_LENGTH}
                placeholder="35202-1234567-1"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(formatCnic(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic-front">CNIC front picture (required)</Label>
              <Input
                id="cnic-front"
                ref={frontRef}
                type="file"
                accept={AVATAR_ACCEPTED_TYPES.join(",")}
                onChange={(e) => void pick(e.target.files?.[0], "front")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic-back">CNIC back picture (required)</Label>
              <Input
                id="cnic-back"
                ref={backRef}
                type="file"
                accept={AVATAR_ACCEPTED_TYPES.join(",")}
                onChange={(e) => void pick(e.target.files?.[0], "back")}
              />
            </div>
          </div>

          {(front || back) && (
            <div className="grid gap-3 rounded-2xl border bg-secondary/40 p-3 sm:grid-cols-2">
              <Preview label="Front" picked={front} />
              <Preview label="Back" picked={back} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || !ready}>
              {submit.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              {status === "rejected" ? "Submit new documents" : "Submit for verification"}
            </Button>
            {!ready && (
              <span className="text-xs text-muted-foreground">
                Add the CNIC number and both pictures to continue.
              </span>
            )}
          </div>
        </>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5" /> Stored in private storage. Never shown on public
        profiles, listings or search results — only authorised admins can open them for review.
      </p>
    </div>
  );
}

function Preview({ label, picked }: { label: string; picked: Picked }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label} preview</p>
      {picked ? (
        <img
          src={picked.url}
          alt={`CNIC ${label} preview`}
          className="max-h-48 w-full rounded-xl object-contain"
        />
      ) : (
        <div className="grid h-32 place-items-center rounded-xl border border-dashed text-xs text-muted-foreground">
          Not attached yet
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  if (status === "verified") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="size-3.5" /> {STATUS_LABEL.verified}
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="size-3.5" /> {STATUS_LABEL.pending}
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="size-3.5" /> {STATUS_LABEL.rejected}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <IdCard className="size-3.5" /> {STATUS_LABEL.not_uploaded}
    </Badge>
  );
}
