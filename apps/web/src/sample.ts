/**
 * Dự án mẫu: tự sinh 2 clip video thật bằng Canvas + MediaRecorder
 * (không cần file ngoài), kèm 1 clip chữ — để người dùng mở app
 * là thấy ngay editor hoạt động: phát, cắt, kéo, chữ...
 */
import type { VideoSpec } from "@repo-1/video-spec";
import { SPEC_VERSION } from "@repo-1/video-spec";
import type { MediaItem } from "./media";
import { uid } from "./lib";

const W = 640;
const H = 360;
const FPS = 30;

/** Vẽ 1 frame của clip mẫu. `variant` đổi bảng màu & chuyển động. */
function drawSampleFrame(ctx: CanvasRenderingContext2D, t: number, dur: number, variant: 0 | 1) {
  const p = t / dur;
  // nền gradient xoay hue
  const hue = variant === 0 ? 225 + 40 * Math.sin(p * Math.PI * 2) : 160 + 40 * Math.cos(p * Math.PI * 2);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, `hsl(${hue}, 55%, 16%)`);
  g.addColorStop(1, `hsl(${(hue + 50) % 360}, 60%, 32%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // các vòng tròn chuyển động
  for (let i = 0; i < 5; i++) {
    const x = W * ((p * (0.6 + i * 0.15) + i * 0.23) % 1.2) - W * 0.1;
    const y = H * (0.25 + 0.5 * Math.abs(Math.sin(p * Math.PI * 2 + i * 1.3)));
    const r = 26 + 14 * Math.sin(p * Math.PI * 4 + i);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(6, r), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(hue + 90 + i * 30) % 360}, 80%, 62%, 0.55)`;
    ctx.fill();
  }

  // lưới mờ trang trí
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // nhãn clip
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "700 44px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(variant === 0 ? "CLIP MẪU 01" : "CLIP MẪU 02", W / 2, H / 2 - 12);
  ctx.font = "400 20px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("kéo • cắt • tách thử ngay", W / 2, H / 2 + 30);

  // thanh tiến trình
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(40, H - 34, W - 80, 6);
  ctx.fillStyle = "#8b7cf6";
  ctx.fillRect(40, H - 34, (W - 80) * p, 6);
}

/** Ghi canvas thành blob webm trong `seconds` giây. null nếu trình duyệt không hỗ trợ. */
async function recordSample(
  variant: 0 | 1,
  seconds: number,
): Promise<{ blob: Blob; thumb: string } | null> {
  try {
    if (typeof MediaRecorder === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const stream = canvas.captureStream(FPS);
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m),
    );
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const done = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    // thumbnail từ frame giữa
    drawSampleFrame(ctx, seconds / 2, seconds, variant);
    const thumb = canvas.toDataURL("image/jpeg", 0.7);

    rec.start(200);
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        if (t >= seconds) {
          resolve();
          return;
        }
        drawSampleFrame(ctx, t, seconds, variant);
        requestAnimationFrame(tick);
      };
      tick();
    });
    rec.stop();
    await done;
    return { blob: new Blob(chunks, { type: "video/webm" }), thumb };
  } catch {
    return null;
  }
}

/** Fallback khi không ghi được video: dùng ảnh tĩnh PNG làm clip mẫu. */
function stillSample(variant: 0 | 1, seconds: number): { blob: Blob; thumb: string } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawSampleFrame(ctx, seconds / 2, seconds, variant);
  const dataUrl = canvas.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: "image/png" }), thumb: dataUrl };
}

export async function buildSampleProject(): Promise<{ spec: VideoSpec; media: MediaItem[] }> {
  const seconds = 4;
  const media: MediaItem[] = [];

  for (const variant of [0, 1] as const) {
    const rec = await recordSample(variant, seconds);
    const isVideo = rec !== null;
    const { blob, thumb } = rec ?? stillSample(variant, seconds);
    const ext = isVideo ? "webm" : "png";
    media.push({
      id: uid("m"),
      name: `mau-${variant + 1}.${ext}`,
      kind: isVideo ? "video" : "image",
      url: URL.createObjectURL(blob),
      duration: seconds,
      width: W,
      height: H,
      thumbnail: thumb,
    });
  }

  const spec: VideoSpec = {
    version: SPEC_VERSION,
    meta: { name: "Dự án mẫu", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        label: "Video 1",
        clips: [
          {
            kind: "video",
            id: uid("c"),
            src: media[0].name,
            start: 0,
            duration: seconds,
            in: 0,
            out: seconds,
            transitionOut: { type: "fade", duration: 0.6 },
          },
          {
            kind: "video",
            id: uid("c"),
            src: media[1].name,
            start: seconds,
            duration: seconds,
            in: 0,
            out: seconds,
          },
        ],
      },
      {
        id: "t1",
        kind: "text",
        label: "Chữ 1",
        clips: [
          {
            kind: "text",
            id: uid("c"),
            text: "Xin chào! Đây là VCut Studio",
            start: 0.5,
            duration: 5,
            style: {
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 72,
              color: "#ffffff",
              bold: true,
              x: 0.5,
              y: 0.32,
              animation: "fadeUp",
            },
          },
        ],
      },
    ],
  };

  return { spec, media };
}
