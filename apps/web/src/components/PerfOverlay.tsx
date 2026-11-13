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
import { useIsMobile } from "../lib/useIsMobile";
import { getLang, t, useLang } from "../i18n";
import { presentedLabel, presentedNote, presentedRate, readPlayingPresentedTotal } from "../lib/perfPresented65R8";

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
  useLang(); // re-render khi đổi ngôn ngữ
  const playing = useStore((s) => s.playing);
  // Đợt 80 H9: ở viewport hẹp (≤768px) pill cố định góc dưới-phải (right:12,
  // bottom:12) đè lên tay cầm trim + clip ở lane video (đo headed 390px:
  // pill 70×44 tại x 308–378, y 788–832 che trọn handle phải clip A và
  // phần nhìn thấy của clip B → trim/chọn clip không bấm được). Dời cả
  // pill lẫn panel sang góc dưới-trái, ngay trên timeline (bottom:262px =
  // timeline mobile 250px + 12px khe): chỉ che video/letterbox, không che
  // nút hay clip nào. Desktop giữ nguyên. Panel khi mở vẫn là overlay
  // chẩn đoán do user mở chủ đích (đóng bằng ✕).
  // Đợt 81 I8 (BUG MỚI do chính lần dời H9): panel mobile cao 292.5px ×
  // rộng 378px (10 hàng số liệu + 2 ghi chú dài) nên mép trên vắt tới
  // y≈289.5, che 2837px² nút TopBar "Cắt lặng" (y 278–322) — click vào tâm
  // nút rơi vào panel, modal không mở (M10 63r1 FAIL, tái hiện bằng diag).
  // Sửa tối thiểu: kẹp panel mobile cao tối đa 140px + cuộn trong (mép trên
  // ≈442, dưới đáy topbar 437px ở 390px, chỉ che preview) — giữ nguyên vị
  // trí bottom:262px để không chạm lại tay cầm trim.
  const isMobile = useIsMobile();
  const btnStyleEff: React.CSSProperties = isMobile
    ? { ...btnStyle, right: "auto", left: "12px", bottom: "262px" }
    : btnStyle;
  const panelStyleEff: React.CSSProperties = isMobile
    ? { ...panelStyle, right: "auto", left: "12px", bottom: "262px", maxHeight: "140px", overflowY: "auto" }
    : panelStyle;
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<WindowStat | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [min, setMin] = useState<number | null>(null);
  const [drops, setDrops] = useState(0);
  const [frames, setFrames] = useState(0);
  const [seconds, setSeconds] = useState(0);
  // Đợt 65 S8 — presented-frame rate qua getVideoPlaybackQuality (xem
  // lib/perfPresented65R8.ts): null = chưa có mẫu / không có clip video
  // đang phát (hiện "…", KHÔNG phải 0 fps).
  const [presented, setPresented] = useState<number | null>(null);
  const prevPresentedRef = useRef<number | null>(null);
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
    prevPresentedRef.current = null;
    setPresented(null);
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
      // Đợt 65 S8 — presented: tổng totalVideoFrames của các element
      // video đang phát trong cửa sổ 1s này; tổng đi lùi (element bị
      // thay) thì hủy cửa sổ, hiện "…" và lấy lại mốc mới.
      const tot = readPlayingPresentedTotal();
      setPresented(presentedRate(prevPresentedRef.current, tot, winMs / 1000));
      prevPresentedRef.current = tot;
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
      <button type="button" className="perf-fps-btn" style={btnStyleEff} onClick={() => setOpen(true)} title={t("perf.openFps")}>
        📈 FPS
      </button>
    );
  }

  return (
    <div className="perf-fps-panel" style={panelStyleEff} role="status" aria-label={t("perf.title")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <strong>📈 FPS preview</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("perf.closeFps")} style={{ background: "none", border: "none", color: "#eee", cursor: "pointer" }}>
          ✕
        </button>
      </div>
      <div>{t("perf.status")} {playing ? t("perf.playing") : t("perf.paused")}</div>
      <div>{t("perf.fpsRecent")} {cur ? cur.fps.toFixed(1) : "…"}</div>
      <div>{t("perf.fpsAvg")} {avg !== null ? avg.toFixed(1) : "…"}</div>
      <div>{t("perf.fpsMin")} {min !== null ? min.toFixed(1) : "…"}</div>
      <div>{presentedLabel(getLang())} {presented !== null ? presented.toFixed(1) : "…"}</div>
      <div>{t("perf.dropped", { ms: String(DROP_MS) })} {drops}</div>
      <div>
        {t("perf.totalFrames")} {frames} / {seconds}s
      </div>
      <div style={{ fontSize: "12px", opacity: 0.75 }}>
        {t("perf.note")}
      </div>
      <div style={{ fontSize: "12px", opacity: 0.75 }}>
        {presentedNote(getLang())}
      </div>
    </div>
  );
}
