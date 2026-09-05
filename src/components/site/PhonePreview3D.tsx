import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, Smartphone } from "lucide-react";

type Props = {
  /** CSS background applied to the case back and side rails. */
  caseBackground: string;
  /** Base colour, used for rail tinting and glow. */
  color: string;
  model: string;
  finish: string;
  text: string;
  textSize: number;
  magsafe: boolean;
};

const WIDTH = 240;
const HEIGHT = 496;
const DEPTH = 26;

/**
 * A CSS 3D phone mock-up: real body volume (front glass, case back, four side
 * rails, raised camera plateau) that the visitor can spin a full 360° by
 * dragging, with keyboard and button controls as accessible fallbacks.
 */
export function PhonePreview3D({
  caseBackground,
  color,
  model,
  finish,
  text,
  textSize,
  magsafe,
}: Props) {
  const [angle, setAngle] = useState(-22);
  const [tilt, setTilt] = useState(-8);
  const [dragging, setDragging] = useState(false);
  const [spin, setSpin] = useState(false);
  const drag = useRef<{ x: number; y: number; a: number; t: number } | null>(null);

  useEffect(() => {
    if (!spin || dragging) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      setAngle((a) => a + dt * 0.03);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spin, dragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, a: angle, t: tilt };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setAngle(d.a + (e.clientX - d.x) * 0.55);
    setTilt(Math.max(-32, Math.min(32, d.t - (e.clientY - d.y) * 0.25)));
  };

  const endDrag = (e: React.PointerEvent) => {
    drag.current = null;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const railStyle: React.CSSProperties = {
    backgroundColor: "#e9e9ee",
    backgroundImage: caseBackground,
    backfaceVisibility: "hidden",
    boxShadow: "inset 0 0 12px rgba(0,0,0,.35)",
  };


  const norm = ((angle % 360) + 360) % 360;
  const facing = norm > 90 && norm < 270 ? "Back" : "Front";

  return (
    <div className="select-none">
      <div
        role="img"
        aria-label={`Rotatable 3D preview of a custom ${finish} case for ${model}, currently showing the ${facing.toLowerCase()}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setAngle((a) => a - 15);
          if (e.key === "ArrowRight") setAngle((a) => a + 15);
          if (e.key === "ArrowUp") setTilt((t) => Math.max(-32, t - 6));
          if (e.key === "ArrowDown") setTilt((t) => Math.min(32, t + 6));
        }}
        className={`mx-auto flex touch-none items-center justify-center rounded-3xl outline-none ring-offset-4 focus-visible:ring-2 focus-visible:ring-ring ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ perspective: "1400px", height: HEIGHT + 90, width: "100%" }}
      >
        <div
          className="relative"
          style={{
            width: WIDTH,
            height: HEIGHT,
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt}deg) rotateY(${angle}deg)`,
            transition: dragging || spin ? "none" : "transform .5s cubic-bezier(.22,.61,.36,1)",
          }}
        >
          {/* ---------- Front: glass + screen ---------- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[2.6rem]"
            style={{
              transform: `translateZ(${DEPTH / 2}px)`,
              backfaceVisibility: "hidden",
              background: "linear-gradient(160deg,#2b2b2f,#08080a 45%,#131317)",
              boxShadow: `inset 0 0 0 3px rgba(255,255,255,.08), inset 0 0 0 9px ${color}`,
            }}
          >
            <div
              className="absolute inset-[9px] overflow-hidden rounded-[2.1rem]"
              style={{ background: "radial-gradient(120% 90% at 20% 0%, #22242b, #050507 70%)" }}
            >
              {/* wallpaper tinted by the chosen colour */}
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background: `radial-gradient(70% 45% at 30% 12%, ${color}cc, transparent 70%), radial-gradient(60% 40% at 85% 85%, ${color}66, transparent 70%)`,
                }}
              />
              {/* dynamic island */}
              <div className="absolute left-1/2 top-3 h-6 w-[86px] -translate-x-1/2 rounded-full bg-black/95" />
              {/* clock + app grid to sell the realism */}
              <div className="absolute left-0 right-0 top-16 text-center">
                <p className="text-[11px] font-medium tracking-wide text-white/80">
                  Friday, 9 May
                </p>
                <p className="text-4xl font-semibold text-white/95">9:41</p>
              </div>
              <div className="absolute bottom-14 left-0 right-0 grid grid-cols-4 gap-3 px-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[14px] bg-white/15 backdrop-blur-sm"
                  />
                ))}
              </div>
              <div className="absolute bottom-4 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/60" />
              {/* glass sheen */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(115deg, rgba(255,255,255,.24) 0 18%, transparent 34% 68%, rgba(255,255,255,.1) 88%)",
                }}
              />
            </div>
          </div>

          {/* ---------- Back: the custom case ---------- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[2.6rem]"
            style={{
              transform: `translateZ(-${DEPTH / 2}px) rotateY(180deg)`,
              backfaceVisibility: "hidden",
              backgroundColor: "#e9e9ee",
              backgroundImage: caseBackground,
              backgroundSize: "cover",
              boxShadow:
                "inset 0 0 0 3px rgba(255,255,255,.22), inset 0 -60px 90px rgba(0,0,0,.28), inset 0 60px 90px rgba(255,255,255,.12)",
            }}
          >
            {/* finish sheen */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(120deg, rgba(255,255,255,.34) 0 14%, transparent 30% 70%, rgba(0,0,0,.18) 100%)",
              }}
            />
            {magsafe && (
              <div className="absolute left-1/2 top-[30%] size-[92px] -translate-x-1/2 rounded-full border border-white/40 shadow-[inset_0_0_18px_rgba(255,255,255,.25)]">
                <div className="absolute inset-3 rounded-full border border-dashed border-white/30" />
              </div>
            )}
            {text.trim() && (
              <span
                className="absolute inset-x-0 bottom-14 text-center font-semibold text-white"
                style={{
                  fontSize: textSize,
                  textShadow: "0 1px 0 rgba(0,0,0,.45), 0 0 12px rgba(255,255,255,.25)",
                }}
              >
                {text}
              </span>
            )}

            {/* raised camera plateau */}
            <div
              className="absolute left-4 top-4 rounded-[26px]"
              style={{
                width: 96,
                height: 96,
                transform: "translateZ(7px)",
                background: "linear-gradient(150deg, rgba(255,255,255,.5), rgba(0,0,0,.25))",
                boxShadow: "0 6px 14px rgba(0,0,0,.35)",
              }}
            >
              {[
                { left: 8, top: 8 },
                { left: 50, top: 8 },
                { left: 8, top: 50 },
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute size-9 rounded-full"
                  style={{
                    ...p,
                    background:
                      "radial-gradient(circle at 34% 28%, #6f7480 0 18%, #14161b 55%, #05060a 100%)",
                    boxShadow: "inset 0 0 6px #000, 0 1px 2px rgba(0,0,0,.6)",
                  }}
                >
                  <span className="absolute left-2 top-2 size-2 rounded-full bg-white/50 blur-[1px]" />
                </div>
              ))}
              <div
                className="absolute bottom-3 right-3 size-4 rounded-full"
                style={{ background: "radial-gradient(circle, #ffe9a8, #b9903c)" }}
              />
            </div>
          </div>

          {/* ---------- Side rails ---------- */}
          <div
            className="absolute rounded-[10px]"
            style={{
              ...railStyle,
              width: DEPTH,
              height: HEIGHT - 24,
              top: 12,
              left: WIDTH / 2 - DEPTH / 2,
              transform: `rotateY(90deg) translateZ(${WIDTH / 2}px)`,
            }}
          >
            {/* power button */}
            <div className="absolute left-0 top-[30%] h-16 w-full rounded-sm bg-black/25" />
          </div>
          <div
            className="absolute rounded-[10px]"
            style={{
              ...railStyle,
              width: DEPTH,
              height: HEIGHT - 24,
              top: 12,
              left: WIDTH / 2 - DEPTH / 2,
              transform: `rotateY(-90deg) translateZ(${WIDTH / 2}px)`,
            }}
          >
            <div className="absolute left-0 top-[24%] h-10 w-full rounded-sm bg-black/25" />
            <div className="absolute left-0 top-[38%] h-10 w-full rounded-sm bg-black/25" />
          </div>
          <div
            className="absolute rounded-[10px]"
            style={{
              ...railStyle,
              width: WIDTH - 24,
              height: DEPTH,
              left: 12,
              top: HEIGHT / 2 - DEPTH / 2,
              transform: `rotateX(90deg) translateZ(${HEIGHT / 2}px)`,
            }}
          />
          <div
            className="absolute rounded-[10px]"
            style={{
              ...railStyle,
              width: WIDTH - 24,
              height: DEPTH,
              left: 12,
              top: HEIGHT / 2 - DEPTH / 2,
              transform: `rotateX(-90deg) translateZ(${HEIGHT / 2}px)`,
            }}
          >
            {/* speaker grille + port on the bottom rail */}
            <div className="absolute bottom-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/40" />
          </div>

          {/* contact shadow */}
          <div
            className="absolute left-1/2 top-full h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl"
            style={{ transform: "translate(-50%, 10px) rotateX(90deg)" }}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setAngle((a) => a - 45)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          <RotateCcw className="size-3.5" /> Rotate
        </button>
        <button
          type="button"
          onClick={() => setAngle((a) => (facing === "Front" ? a + 180 : a - 180))}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          <Smartphone className="size-3.5" /> Flip to {facing === "Front" ? "back" : "front"}
        </button>
        <button
          type="button"
          onClick={() => setAngle((a) => a + 45)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          <RotateCw className="size-3.5" /> Rotate
        </button>
        <button
          type="button"
          onClick={() => setSpin((s) => !s)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            spin ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
          }`}
        >
          {spin ? "Stop 360° spin" : "Auto 360° spin"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Drag the phone to spin it a full 360°, drag up or down to tilt, or use the arrow keys.
      </p>
    </div>
  );
}
