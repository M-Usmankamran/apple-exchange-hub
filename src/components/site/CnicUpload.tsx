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

export function CnicUpload({
  accountType,
  className,
}: {
  accountType: "buyer" | "vendor";
  className?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
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

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const status = record.data ? record.data.status : "not_uploaded";
  const locked = status === "pending" || status === "verified";

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const result = await validateAvatarFile(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ file, url: result.objectUrl });
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in first.");
      if (!preview) throw new Error("Choose a CNIC image first.");
      const digits = cnicNumber.replace(/\D/g, "");
      if (digits.length !== 13) throw new Error("Enter your 13-digit CNIC number.");

      const ext = preview.file.type === "image/png" ? "png" : preview.file.type === "image/webp" ? "webp" : "jpg";
      // Path is namespaced by user id; the bucket is private and admin-read only.
      const path = `${user.id}/cnic-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cnic-documents")
        .upload(path, preview.file, { contentType: preview.file.type, upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { error } = await supabase.from("cnic_verifications").upsert(
        {
          user_id: user.id,
          account_type: accountType,
          cnic_number: cnicNumber.trim(),
          document_path: path,
          status: "pending",
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
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
              {record.data?.rejection_reason || "Please upload a clearer photo of your CNIC."}
            </p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <p className="text-sm text-muted-foreground">
          Your identity is verified. Your document stays private and is only visible to authorised
          reviewers.
        </p>
      )}

      {!locked && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnic-number">CNIC number</Label>
              <Input
                id="cnic-number"
                inputMode="numeric"
                placeholder="35202-1234567-1"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic-file">CNIC image (front)</Label>
              <Input
                id="cnic-file"
                ref={inputRef}
                type="file"
                accept={AVATAR_ACCEPTED_TYPES.join(",")}
                onChange={(e) => void pick(e.target.files?.[0])}
              />
            </div>
          </div>

          {preview && (
            <div className="rounded-2xl border bg-secondary/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Preview before submitting</p>
              <img
                src={preview.url}
                alt="CNIC preview"
                className="max-h-56 w-full rounded-xl object-contain"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || !preview}>
              {submit.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              {status === "rejected" ? "Submit new document" : "Submit for verification"}
            </Button>
            {!preview && (
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <IdCard className="mr-2 size-4" /> Choose image
              </Button>
            )}
          </div>
        </>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5" /> Stored in private storage. Never shown on public
        profiles, listings or search results — only authorised admins can open it for review.
      </p>
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
