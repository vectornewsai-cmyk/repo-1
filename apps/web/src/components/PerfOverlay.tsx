/**
 * PerfOverlay — FPS meter cho preview (Phase 9 R3).
 *
 * Đo bằng requestAnimationFrame của chính app: mỗi lần rAF bắn là 1 frame
 * của vòng vẽ. Khi đang phát preview, vòng rAF này gắn với preview nên số
 * đo phản ánh tốc độ preview thực tế trên máy người dùng (decode video +
 * canvas + filter). Khi đứng yên, số đo là tốc độ vòng vẽ idle, KHÔNG phải
 * FPS phát — xem nhãn trạng thái.
 *
 * TRUNG THỰC — giới hạn đo (xem R3_LIMITS.md):
 * - Đây KHÔNG phải probe trực tiếp draw call của canvas preview, vì brief
 *   R3 cấm sửa preview.tsx. Số đo là rAF của app, không tách được phần
 *   decode video khỏi phần vẽ canvas.
 * - Chỉ đo khi panel mở (tránh tốn rAF thừa khi không cần).
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";

/** Một khoảng giữa 2 frame > 50ms được tính là 1 frame giật (drop). */
const DROP_MS = 50;

interface WindowStat {
  fps: number;
  frames: number;
  drops: number;
}

const panelStyle: React.CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom: "12px",
  zIndex: 300,
  background: "rgba(12, 12, 20, 0.92)",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  lineHeight: "1.5",
  minWidth: "210px",
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom: "12px",
  zIndex: 300,
  background: "#222",
  color: "#eee",
  border: "1px solid #555",
  borderRadius: "999px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "13px",
};

export function PerfOverlay() {
  const playing = useStore((s) => s.playing);
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<WindowStat | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [min, setMin] = useState<number | null>(null);
  const [drops, setDrops] = useState(0);
  const [frames, setFrames] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const statsRef = useRef({ winStart: 0, winFrames: 0, total: 0, totalMs: 0, minFps: Infinity, dropCount: 0, last: 0, startedAt: 0 });

  useEffect(() => {
    if (!open) return;
    const st = statsRef.current;
    st.winStart = performance.now();
    st.winFrames = 0;
    st.total = 0;
    st.totalMs = 0;
    st.minFps = Infinity;
    st.dropCount = 0;
    st.last = performance.now();
    st.startedAt = performance.now();
    let raf = 0;
    let timer = 0;
    const tick = (now: number) => {
      const dt = now - st.last;
      st.last = now;
      if (dt > DROP_MS) st.dropCount += 1;
      st.winFrames += 1;
      st.total += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Mỗi 1s chốt 1 cửa sổ đo.
    timer = window.setInterval(() => {
      const now = performance.now();
      const winMs = now - st.winStart;
      const fps = winMs > 0 ? (st.winFrames * 1000) / winMs : 0;
      st.winStart = now;
      st.winFrames = 0;
      st.totalMs = now - st.startedAt;
      if (fps > 0 && fps < st.minFps) st.minFps = fps;
      setCur({ fps, frames: st.total, drops: st.dropCount });
      setAvg(st.totalMs > 0 ? (st.total * 1000) / st.totalMs : null);
      setMin(st.minFps === Infinity ? null : st.minFps);
      setDrops(st.dropCount);
      setFrames(st.total);
      setSeconds(Math.floor(st.totalMs / 1000));
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
    };
  }, [open ]);

  if (!open) {
    return (
      <button type="button" style={btnStyle} onClick={() => setOpen(true)} title="Mở đồng hồ đo FPS preview">
        📈 FPS
      </button>
    );
  }

  return (
    <div style={panelStyle} role="status" aria-label="Đồng hồ đo FPS preview">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <strong>📈 FPS preview</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label="Đóng đồng hồ FPS" style={{ background: "none", border: "none", color: "#eee", cursor: "pointer" }}>
          ✕
        </button>
      </div>
      <div>Trạng thái: {playing ? "▶ Đang phát" : "⏸ Đứng yên (số này không phải FPS phát)"}</div>
      <div>FPS (1s gần nhất): {cur ? cur.fps.toFixed(1) : "…"}</div>
      <div>FPS trung bình: {avg !== null ? avg.toFixed(1) : "…"}</div>
      <div>FPS thấp nhất (cửa sổ 1s): {min !== null ? min.toFixed(1) : "…"}</div>
      <div>Frame giật (&gt;{DROP_MS}ms): {drops}</div>
      <div>
        Tổng frame: {frames} / {seconds}s
      </div>
      <div style={{ fontSize: "12px", opacity: 0.75 }}>
        Đo bằng rAF của app, không phải draw call trực tiếp của canvas preview.
      </div>
    </div>
  );
}
