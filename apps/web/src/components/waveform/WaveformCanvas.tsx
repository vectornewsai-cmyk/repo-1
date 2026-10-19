/**
 * WaveformCanvas — Vẽ waveform từ mảng peaks lên <canvas>.
 * Tự scale theo devicePixelRatio để nét trên màn hình HiDPI.
 */
import { useEffect, useRef } from "react";

interface WaveformCanvasProps {
  /** Mảng peak 0..1 (tính từ PCM thật — xem lib/waveform.ts). */
  peaks: number[];
  /** Kích thước CSS pixel. */
  width: number;
  height: number;
  /** Màu thanh sóng. */
  color?: string;
  /** 0..1 — phần đã phát (tới playhead) vẽ trắng nổi bật hơn. Không bắt buộc. */
  progress?: number;
}

export function WaveformCanvas({
  peaks,
  width,
  height,
  color = "rgba(255, 255, 255, 0.72)",
  progress,
}: WaveformCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const n = peaks.length;
    if (n === 0) return;
    const barW = width / n;
    const midY = height / 2;
    const maxH = Math.max(1, height - 4);
    // Vẽ từ giữa ra 2 phía (kiểu sóng đối xứng như CapCut).
    for (let i = 0; i < n; i++) {
      const p = Math.min(1, Math.max(0, peaks[i]));
      const h = Math.max(1, p * maxH);
      const played = progress !== undefined && i / n <= progress;
      ctx.fillStyle = played ? "#ffffff" : color;
      const bw = Math.max(1, barW - 1); // chừa 1px khe giữa các thanh
      // Thanh cuối không tràn quá width.
      const x = Math.min(i * barW, width - bw);
      ctx.fillRect(x, midY - h / 2, bw, h);
    }
  }, [peaks, width, height, color, progress]);

  return (
    <canvas
      ref={ref}
      className="waveform-canvas"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
