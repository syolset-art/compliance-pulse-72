import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";

export type DemoCursorHandle = {
  moveTo: (target: HTMLElement | { x: number; y: number } | null) => Promise<void>;
  moveToSelector: (selector: string) => Promise<void>;
  click: () => Promise<void>;
  hide: () => void;
  show: () => void;
};

type Props = {
  /** Move duration in ms (default 700) */
  moveDurationMs?: number;
};

/**
 * Visual demo cursor overlay. Renders as a fixed-position SVG pointer that
 * smoothly moves to target elements and emits a click-pulse. Used during
 * auto-play demos so viewers can follow what's being interacted with.
 * Never blocks real input (pointer-events: none).
 */
const DemoCursor = forwardRef<DemoCursorHandle, Props>(function DemoCursor(
  { moveDurationMs = 700 },
  ref,
) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== "undefined" ? window.innerWidth * 0.85 : 1200,
    y: typeof window !== "undefined" ? window.innerHeight * 0.85 : 800,
  }));
  const [visible, setVisible] = useState(true);
  const [pulses, setPulses] = useState<number[]>([]);
  const pulseId = useRef(0);

  // Keep the cursor within the viewport on resize.
  useEffect(() => {
    const onResize = () => {
      setPos((p) => ({
        x: Math.min(p.x, window.innerWidth - 24),
        y: Math.min(p.y, window.innerHeight - 24),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

  useImperativeHandle(ref, () => ({
    async moveTo(target) {
      if (!target) return;
      let x: number;
      let y: number;
      if (target instanceof HTMLElement) {
        const r = target.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      } else {
        x = target.x;
        y = target.y;
      }
      setVisible(true);
      setPos({ x, y });
      await wait(moveDurationMs);
    },
    async moveToSelector(selector) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(120);
      const r = el.getBoundingClientRect();
      setVisible(true);
      setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      await wait(moveDurationMs);
    },
    async click() {
      const id = ++pulseId.current;
      setPulses((arr) => [...arr, id]);
      await wait(450);
      setPulses((arr) => arr.filter((p) => p !== id));
    },
    hide() { setVisible(false); },
    show() { setVisible(true); },
  }), [moveDurationMs]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease-out" }}
    >
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          transform: `translate(${pos.x - 8}px, ${pos.y - 6}px)`,
          transition: `transform ${moveDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: "transform",
        }}
      >
        {/* Click pulses */}
        {pulses.map((id) => (
          <span
            key={id}
            className="absolute rounded-full"
            style={{
              left: -10,
              top: -8,
              width: 44,
              height: 44,
              background: "hsl(var(--primary) / 0.25)",
              border: "2px solid hsl(var(--primary) / 0.6)",
              animation: "demo-cursor-pulse 450ms ease-out forwards",
            }}
          />
        ))}
        {/* Pointer SVG */}
        <svg
          width="26"
          height="30"
          viewBox="0 0 26 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))" }}
        >
          <path
            d="M3 2 L3 22 L9 17 L12.5 25 L16 23.5 L12.5 16 L20 16 Z"
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <style>{`
        @keyframes demo-cursor-pulse {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

export default DemoCursor;
