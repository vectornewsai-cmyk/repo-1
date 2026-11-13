/**
 * Dự án mẫu: tự sinh 2 clip video thật bằng Canvas + MediaRecorder
 * (không cần file ngoài), kèm 1 clip chữ — để người dùng mở app
 * là thấy ngay editor hoạt động: phát, cắt, kéo, chữ...
 */
import type { VideoSpec } from "@repo-1/video-spec";
import { SPEC_VERSION } from "@repo-1/video-spec";
import type { MediaItem } from "./media";
import { uid } from "./lib";
import { AssetStore } from "./lib/assetStore";
import { extensionForContainer, recorderContainerType } from "./lib/sampleMime";

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

/** Ghi canvas thành blob video trong `seconds` giây (webm trên Chromium, mp4 trên Safari — xem đuôi tên ở dưới). null nếu trình duyệt không hỗ trợ. */
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
    // Đợt 73 A7: nhãn Blob theo đúng container recorder thật sự dùng
    // (rec.mimeType) — Safari ghi mp4 mặc định khi webm không được hỗ trợ;
    // hard-code "video/webm" sẽ gán nhãn sai khiến <video> không phát được
    // clip mẫu trên Safari. Chromium vẫn ra "video/webm" như cũ.
    return { blob: new Blob(chunks, { type: recorderContainerType(rec.mimeType) }), thumb };
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
    // Đợt 74 B3 — đuôi theo container thật của blob (đợt 73 A7 đã sửa
    // nhãn MIME nhưng tên vẫn hard-code .webm): Chromium ghi webm →
    // "mau-1.webm" như cũ; Safari ghi mp4 → "mau-1.mp4", tên khớp bytes
    // nên <video> + rehydrate không bị lừa bởi đuôi sai. Spec src lấy
    // từ chính tên này nên liên kết không vỡ.
    const ext = isVideo ? extensionForContainer(blob.type) : "png";
    // Đợt 36 S5 — bền vững media mẫu qua reload: ingest blob mẫu vào
    // AssetStore (IndexedDB) để bước rehydrate lúc khởi động nạp lại
    // được media bin từ tên thô `mau-*` (khớp originalName).
    // Best-effort tuyệt đối: IndexedDB / crypto.subtle không khả dụng
    // (private mode, non-secure context) thì mẫu vẫn chạy trong phiên,
    // chỉ không bền qua reload — không được làm hỏng loadSample.
    // Sau ingest, tỉa các manifest mẫu cũ cùng tên để kho mẫu không
    // phình theo mỗi lần tạo mẫu (mỗi lần ghi MediaRecorder cho bytes
    // khác nhau nên dedup theo sha không gom được chúng).
    // Đợt 53 J5 — giữ assetId của manifest mẫu để MediaItem mẫu cũng
    // nối được proxy về manifest khi user tạo proxy tay cho clip mẫu
    // (mau-* chỉ 640×360 nên auto-proxy bỏ qua, nhưng nút Proxy
    // tay vẫn hiện vì item có file sau rehydrate).
    let sampleAssetId: string | undefined;
    try {
      const store = new AssetStore();
      const kept = await store.ingest(blob, {
        name: `mau-${variant + 1}.${ext}`,
        width: W,
        height: H,
        duration: seconds,
        thumbnail: thumb,
      });
      sampleAssetId = kept.assetId;
      const all = await store.list();
      // Đợt 74 B3 — tỉa cả manifest mẫu cũ mang đuôi còn lại: Safari
      // trước đợt này lưu "mau-1.webm" cho bytes mp4; nay tên mới là
      // "mau-1.mp4", không tỉa chéo thì bản cũ nằm lại IDB mãi (mồ côi).
      const legacyName = kept.originalName.replace(/\.(webm|mp4)$/, (m) =>
        m === ".webm" ? ".mp4" : ".webm",
      );
      for (const m of all) {
        if ((m.originalName === kept.originalName || m.originalName === legacyName) && m.assetId !== kept.assetId) {
          await store.remove(m.assetId);
        }
      }
    } catch {
      // nuốt lỗi bền vững mẫu — xem chú thích trên.
    }
    // Đợt 58 O2 — gắn `file` thật cho media mẫu trong phiên: blob mẫu
    // đã có sẵn trong tay, nhưng trước đây MediaItem mẫu không mang
    // `file` nên ExportPanel.collectMediaFiles coi mau-* là thiếu
    // (render báo lỗi missingMedia) và nút Proxy/reframe cũng ẩn cho
    // tới khi user reload trang (lúc đó rehydrate mới dựng File từ
    // IndexedDB). Gắn File tại đây để item trong phiên đồng nhất với
    // item sau rehydrate (rehydrate36S5.ts dựng `new File([blob], …)`
    // y hệt); không đổi bytes, tên hay đường ingest.
    media.push({
      id: uid("m"),
      name: `mau-${variant + 1}.${ext}`,
      kind: isVideo ? "video" : "image",
      url: URL.createObjectURL(blob),
      duration: seconds,
      width: W,
      height: H,
      thumbnail: thumb,
      file: new File([blob], `mau-${variant + 1}.${ext}`, { type: blob.type }),
      ...(sampleAssetId ? { assetId: sampleAssetId } : {}),
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
              // Đợt 59 P1: phải có đủ field như DEFAULT_TEXT_STYLE
              // (normalizeTextStyle điền italic:false lúc load nên mẫu
              // thiếu field này sẽ toast "đã điền style" ở lần reload
              // đầu sau mỗi lần tạo mẫu — xem LIMITS đợt 59 P1 §2).
              italic: false,
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
