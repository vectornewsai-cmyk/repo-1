/**
 * MixerMeter — thanh đo mức âm thanh thật của preview (Phase 9, batch
 * "timeline markers + mixer meter").
 *
 * NGUỒN ĐO (ghi rõ, không claim quá): AnalyserNode của master bus trong
 * AudioEngine (preview.tsx) — tức tín hiệu SAU master gain, TRƯỚC loa, là
 * mix TỔNG của mọi media element đang phát trong preview (video/audio/clip
 * kế thừa), không phải meter của 1 clip riêng lẻ. Khi preview chưa phát lần
 * nào trong phiên (AudioContext chưa mở), analyser = null và meter hiện
 * trạng thái idle 0 — không bịa số.
 *
 * MONO, không tách L/R: một AnalyserNode duy nhất trên master bus chỉ cho
 * time-domain đã mix (Web Audio không tách kênh ở đây), nên meter vẽ 1 thanh
 * mono + peak-hold. Muốn L/R thật phải chèn SplitterNode trước master —
 * chưa làm, xem MARKERS_LIMITS.md.
 *
 * Hiệu năng: vòng lặp requestAnimationFrame chỉ chạm DOM trực tiếp qua ref
 * (không setState mỗi frame — giống vu-meter sẵn có trong preview.tsx).
 * Peak-hold: giữ đỉnh 1 giây rồi decay về mức hiện tại.
 */
import { useEffect, useRef } from "react";
import { t as i18nT, useLang } from "../i18n";

const PEAK_HOLD_MS = 1000;

export function MixerMeter({
  getAnalyser,
}: {
  /** Trả về AnalyserNode của master bus, hoặc null khi graph chưa mở. */
  getAnalyser: () => AnalyserNode | null;
}) {
  useLang();
  const barRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  const dbRef = useRef<HTMLSpanElement>(null);
  const idleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let buf: Uint8Array | null = null;
    let peak = 0;
    let peakAt = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const analyser = getAnalyser();
      const bar = barRef.current;
      const peakEl = peakRef.current;
      const dbEl = dbRef.current;
      const idleEl = idleRef.current;
      if (!bar || !peakEl || !dbEl || !idleEl) return;
      if (!analyser) {
        // Graph chưa mở (chưa play): idle, không bịa số.
        bar.style.transform = "scaleX(0)";
        peakEl.style.left = "0%";
        dbEl.textContent = "−∞ dBFS";
        idleEl.style.display = "";
        return;
      }
      idleEl.style.display = "none";
      if (!buf || buf.length !== analyser.fftSize) buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      let max = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
        if (Math.abs(v) > max) max = Math.abs(v);
      }
      const rms = Math.sqrt(sum / buf.length);
      const now = performance.now();
      if (max >= peak) {
        peak = max;
        peakAt = now;
      } else if (now - peakAt > PEAK_HOLD_MS) {
        // Decay sau thời gian giữ: giảm 10%/frame (~0.6%/ms ở 60fps).
        peak = Math.max(max, peak * 0.9);
      }
      const level = Math.min(1, rms * 1.6);
      bar.style.transform = `scaleX(${level.toFixed(3)})`;
      peakEl.style.left = `${(Math.min(1, peak) * 100).toFixed(1)}%`;
      dbEl.textContent =
        rms <= 0.000001 ? "−∞ dBFS" : `${(20 * Math.log10(rms)).toFixed(1)} dBFS`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getAnalyser]);

  return (
    <div className="mixer-meter" title={i18nT("mixer.title")}>
      <span className="mixer-meter-label">{i18nT("mixer.label")}</span>
      <div className="mixer-meter-track">
        <div ref={barRef} className="mixer-meter-fill" />
        <div ref={peakRef} className="mixer-meter-peak" />
      </div>
      <span ref={dbRef} className="mixer-meter-db">−∞ dBFS</span>
      <span ref={idleRef} className="mixer-meter-idle">{i18nT("mixer.idle")}</span>
    </div>
  );
}
