/**
 * sampleMedia.ts — sinh media mẫu 100% bằng code, ngay trên máy người dùng (R1, Phase 9).
 *
 * - Không dùng ảnh/video/audio ngoài nào: mọi pixel đều do Canvas vẽ, mọi frame
 *   video đều do MediaRecorder ghi từ chính canvas đó. License sạch tuyệt đối.
 * - Khác sample.ts (project mẫu cố định 2 clip): module này sinh media theo
 *   yêu cầu của template pack — đúng aspect, đúng độ dài clip, nhãn theo pack.
 * - Video cần MediaRecorder (Chrome/Edge/Firefox mới đều có). Không có thì trả
 *   lỗi rõ ràng, KHÔNG dùng ảnh tĩnh giả làm video (preview/render sẽ vỡ).
 */

export interface GeneratedMedia {
  file: File;
  /** Thumbnail dataURL để hiện trong MediaBin (không bắt buộc). */
  thumb: string;
}

const PALETTES: Array<[string, string, string]> = [
  ["#1e1b4b", "#7c3aed", "#f0abfc"],
  ["#082f49", "#0284c7", "#67e8f9"],
  ["#3b0764", "#db2777", "#fde68a"],
  ["#052e16", "#16a34a", "#bef264"],
  ["#450a0a", "#ea580c", "#fcd34d"],
  ["#111827", "#4f46e5", "#93c5fd"],
];

function drawPackFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dur: number,
  variant: number,
  label: string,
): void {
  const [c0, c1, accent] = PALETTES[variant % PALETTES.length];
  const p = dur > 0 ? t / dur : 0;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // vòng tròn chuyển động — đủ khác nhau giữa các variant để nhìn là biết
  for (let i = 0; i < 4; i++) {
    const x = w * ((p * (0.5 + i * 0.12) + i * 0.27) % 1.2) - w * 0.1;
    const y = h * (0.3 + 0.4 * Math.abs(Math.sin(p * Math.PI * 2 + i * 1.4)));
    const r = Math.max(8, h * 0.09 * (1 + 0.3 * Math.sin(p * Math.PI * 4 + i)));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // nhãn pack — chữ trắng, font hệ thống (không cần font ngoài)
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `700 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, w / 2, h / 2 - h * 0.03);
  ctx.font = `400 ${Math.round(h * 0.045)}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("VCut Studio · media mẫu tự sinh", w / 2, h / 2 + h * 0.08);
}

/** Kích thước sinh: giữ đúng aspect, cạnh lớn nhất 640px (đủ xem, nhẹ máy). */
export function packSize(aspect: string): { width: number; height: number } {
  const m = aspect.match(/^(\d+):(\d+)$/);
  const aw = m ? Number(m[1]) : 16;
  const ah = m ? Number(m[2]) : 9;
  const scale = 640 / Math.max(aw, ah);
  return {
    width: Math.max(2, Math.round(aw * scale)),
    height: Math.max(2, Math.round(ah * scale)),
  };
}

/** Ảnh tĩnh mẫu (PNG) cho placeholder kind=image. Không cần MediaRecorder. */
export function stillPackMedia(
  name: string,
  aspect: string,
  variant: number,
  label: string,
): GeneratedMedia {
  const { width, height } = packSize(aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  drawPackFrame(ctx, width, height, 0.5, 1, variant, label);
  const dataUrl = canvas.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return {
    file: new File([bytes], name, { type: "image/png" }),
    thumb: dataUrl,
  };
}

/**
 * Video mẫu (webm) cho placeholder kind=video. Ghi realtime nên mất đúng
 * `seconds` giây. Trả null khi trình duyệt không ghi được (caller phải báo
 * lỗi rõ, không được giả vờ có video).
 *
 * Đợt 61 R5 — timeout (đóng nợ đợt 60 Q10 §4.4): trước đây `await done`
 * (đợi MediaRecorder `onstop`) không có chặn trên — nếu `onstop` không bao
 * giờ fire thì hàm treo vĩnh viễn, và TemplatePackModal đang chặn đóng lúc
 * busy nên modal kẹt tới reload. Nay toàn bộ quá trình ghi bị đua với
 * timeout: quá hạn thì thử `rec.stop()` (nếu còn ghi) rồi ném
 * `RecordPackTimeoutError`; caller (`generatePackFiles`) đổi thành
 * `PackError("RECORD_TIMEOUT")` để modal báo lỗi rõ + mở khóa busy.
 * Timeout mặc định = max(20s, (seconds + 15)s): ghi realtime `seconds` giây
 * + 15s dư cho `onstop` (bình thường fire trong ~1s sau stop), sàn 20s cho
 * clip ngắn. Có thể truyền `opts.timeoutMs` để test nhanh / siết riêng.
 */
export class RecordPackTimeoutError extends Error {
  readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(
      `recordPackMedia timeout sau ${timeoutMs}ms (MediaRecorder onstop không fire)`,
    );
    this.name = "RecordPackTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export interface RecordPackMediaOptions {
  /** Chặn trên cho toàn bộ quá trình ghi (mặc định xem recordPackMediaTimeoutMs). */
  timeoutMs?: number;
}

/** Timeout mặc định cho 1 lần ghi dài `seconds` giây. */
export function recordPackMediaTimeoutMs(seconds: number): number {
  return Math.max(20_000, (seconds + 15) * 1000);
}

export async function recordPackMedia(
  name: string,
  aspect: string,
  seconds: number,
  variant: number,
  label: string,
  opts?: RecordPackMediaOptions,
): Promise<GeneratedMedia | null> {
  const timeoutMs = opts?.timeoutMs ?? recordPackMediaTimeoutMs(seconds);
  // Recorder để timeout handler dừng được từ bên ngoài `work` (đua race).
  let rec: MediaRecorder | null = null;
  const work = (async (): Promise<GeneratedMedia | null> => {
  try {
    if (typeof MediaRecorder === "undefined") return null;
    const { width, height } = packSize(aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const stream = canvas.captureStream(30);
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m),
    );
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const done = new Promise<void>((resolve) => {
      rec!.onstop = () => resolve();
    });
    drawPackFrame(ctx, width, height, seconds / 2, seconds, variant, label);
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
        drawPackFrame(ctx, width, height, t, seconds, variant, label);
        requestAnimationFrame(tick);
      };
      tick();
    });
    rec.stop();
    await done;
    const blob = new Blob(chunks, { type: "video/webm" });
    if (blob.size === 0) return null;
    return { file: new File([blob], name, { type: "video/webm" }), thumb };
  } catch {
    return null;
  }
  })();
  // Đua toàn bộ quá trình ghi với timeout: treo ở bất cứ chỗ nào (tick
  // rAF không chạy, onstop không fire) cũng settle trong `timeoutMs`.
  // Timeout thắng → thử dừng recorder rồi ném lỗi (không return null để
  // caller phân biệt được timeout với "thiếu MediaRecorder" / blob rỗng).
  // `work` thắng trước thì clearTimeout, không để timer treo sau khi xong.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try {
        if (rec && rec.state === "recording") rec.stop();
      } catch {
        /* recorder đã dừng / lỗi — lỗi timeout vẫn là kết quả chính */
      }
      reject(new RecordPackTimeoutError(timeoutMs));
    }, timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
