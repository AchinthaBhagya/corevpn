import { useRef, useState } from "react";
import { Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { PaymentRow } from "@/lib/plans";

const MAX_BYTES = 10 * 1024 * 1024;

export function SlipStatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning-foreground">
      <Clock className="h-3 w-3" /> Awaiting admin
    </span>
  );
}

export function SlipUpload({
  subscriptionId,
  userId,
  latest,
  onUploaded,
}: {
  subscriptionId: string;
  userId: string;
  latest?: PaymentRow | null;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Slip එකක් විදිහට image එකක් හෝ PDF එකක් තෝරන්න");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File එක 10MB ට වඩා විශාලයි");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${userId}/${subscriptionId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("slips").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("payments").insert({
        subscription_id: subscriptionId,
        user_id: userId,
        slip_path: path,
        status: "pending",
      });
      if (insErr) throw insErr;

      toast.success("Slip එක upload උනා — admin verify කරලා 30 days activate කරයි");
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Upload your bank slip</div>
          <p className="text-xs text-muted-foreground">
            Image or PDF, max 10MB. Admin verify කළාම config එක 30 days activate වෙනවා.
          </p>
        </div>
        {latest && <SlipStatusBadge status={latest.status} />}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        {busy ? "Uploading…" : latest ? "Upload another slip" : "Choose slip file"}
      </Button>
    </div>
  );
}
