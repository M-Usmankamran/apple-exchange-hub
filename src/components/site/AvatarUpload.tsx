import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, ShieldCheck, Trash2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AVATAR_ACCEPTED_TYPES,
  clearAvatar,
  cropToDataUrl,
  loadAvatar,
  saveAvatar,
  validateAvatarFile,
  type AvatarRole,
} from "@/lib/avatar-store";
import { cn } from "@/lib/utils";

const FRAME = 288;

type Picked = { objectUrl: string; width: number; height: number; name: string };

export function AvatarUpload({
  role,
  name,
  className,
}: {
  role: AvatarRole;
  name: string;
  className?: string;
}) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ px: number; py: number } | null>(null);

  useEffect(() => {
    setAvatar(loadAvatar(role));
  }, [role]);

  const closeEditor = useCallback(() => {
    setPicked((current) => {
      if (current) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const result = await validateAvatarFile(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setPicked({
      objectUrl: result.objectUrl,
      width: result.width,
      height: result.height,
      name: file.name,
    });
  };

  const base = picked ? Math.max(FRAME / picked.width, FRAME / picked.height) : 1;
  const scale = base * zoom;
  const dw = picked ? picked.width * scale : 0;
  const dh = picked ? picked.height * scale : 0;
  const limitX = Math.max(0, (dw - FRAME) / 2);
  const limitY = Math.max(0, (dh - FRAME) / 2);
  const clamped = {
    x: Math.min(limitX, Math.max(-limitX, offset.x)),
    y: Math.min(limitY, Math.max(-limitY, offset.y)),
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.px;
    const dy = e.clientY - drag.py;
    dragRef.current = { px: e.clientX, py: e.clientY };
    setOffset((o) => ({
      x: Math.min(limitX, Math.max(-limitX, o.x + dx)),
      y: Math.min(limitY, Math.max(-limitY, o.y + dy)),
    }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      const dataUrl = await cropToDataUrl(picked.objectUrl, {
        sx: (dw - FRAME) / 2 / scale - clamped.x / scale,
        sy: (dh - FRAME) / 2 / scale - clamped.y / scale,
        size: FRAME / scale,
      });
      saveAvatar(role, dataUrl);
      setAvatar(dataUrl);
      closeEditor();
      toast.success("Profile photo updated.");
    } catch {
      toast.error("We couldn't process that image. Please try another one.");
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    clearAvatar(role);
    setAvatar(null);
    toast.success("Profile photo removed.");
  };

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative">
        <div className="size-20 overflow-hidden rounded-full border bg-secondary">
          {avatar ? (
            <img src={avatar} alt={`${name} profile photo`} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-lg font-semibold text-muted-foreground">
              {initials}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload profile photo"
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border bg-card shadow-sm transition-colors hover:bg-accent"
        >
          <Camera className="size-4" />
        </button>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <ImageUp className="mr-2 size-4" />
            {avatar ? "Change photo" : "Upload photo"}
          </Button>
          {avatar && (
            <Button size="sm" variant="ghost" onClick={remove}>
              <Trash2 className="mr-2 size-4" /> Remove
            </Button>
          )}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" /> PNG, JPEG or WebP · max 5 MB · min 200×200 ·
          re-encoded to strip metadata
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={!!picked} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
            <DialogDescription>
              Drag to reposition and zoom to frame your face. Saved as a 512×512 square.
            </DialogDescription>
          </DialogHeader>

          {picked && (
            <>
              <div
                className="relative mx-auto touch-none overflow-hidden rounded-full border bg-secondary"
                style={{ width: FRAME, height: FRAME }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <img
                  src={picked.objectUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: dw,
                    height: dh,
                    transform: `translate(calc(-50% + ${clamped.x}px), calc(-50% + ${clamped.y}px))`,
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <ZoomIn className="size-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.01}
                  onValueChange={([v]) => setZoom(v ?? 1)}
                  aria-label="Zoom"
                />
              </div>
              <p className="truncate text-xs text-muted-foreground">{picked.name}</p>
            </>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeEditor}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
