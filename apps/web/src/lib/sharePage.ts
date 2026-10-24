/**
 * sharePage.ts — Xuất project thành trang HTML tĩnh tự chạy (Phase 8 Q7).
 *
 * Phạm vi TRUNG THỰC:
 * - Trang này CHỈ là trình phát video đã render + thông tin project, KHÔNG
 *   phải bản sao editor, KHÔNG chỉnh sửa được, KHÔNG cần server VCut.
 * - Chế độ "embedded": video nhúng base64 data URI vào đúng 1 file HTML.
 *   Chỉ hợp lý với video nhỏ; vượt ngưỡng sẽ báo lỗi và gợi ý chế độ linked.
 * - Chế độ "linked": HTML tham chiếu file video.mp4 đặt cạnh nó (mở bằng
 *   double-click file HTML là chạy, không cần server — trình duyệt đọc file
 *   local kề bên). Dùng cho video lớn.
 * - KHÔNG có hosting, KHÔNG có link công khai, KHÔNG đếm lượt xem: "chia sẻ"
 *   ở đây nghĩa là gửi file cho người khác, giống gửi file video kèm trang xem.
 * - Tiêu đề và tên clip luôn được escape HTML để không chèn được script.
 */
import type { VideoSpec } from "@repo-1/video-spec";

export const SHARE_EMBED_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export type ShareMode = "embedded" | "linked";

export interface SharePageInput {
  title: string;
  spec: VideoSpec;
  /** MIME của video, vd "video/mp4". */
  videoMime: string;
  /** Chế độ embedded: base64 của video (không có prefix data:). */
  videoBase64?: string;
  /** Chế độ linked: tên file video đặt cạnh HTML, vd "video.mp4". */
  videoFileName?: string;
}

export interface SharePageResult {
  html: string;
  mode: ShareMode;
  /** Cảnh báo không chặn (vd video lớn, thiếu tên clip). */
  warnings: string[];
}

/** Escape HTML để chống chèn script qua tiêu đề/tên clip. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function projectDurationOf(spec: VideoSpec): number {
  let max = 0;
  for (const t of spec.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const clip = c as { start?: number; duration?: number };
      const end = (clip.start ?? 0) + (clip.duration ?? 0);
      if (end > max) max = end;
    }
  }
  return max;
}

function clipRows(spec: VideoSpec): string {
  const rows: string[] = [];
  for (const t of spec.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const clip = c as { id?: string; kind?: string; src?: string; start?: number; duration?: number };
      rows.push(
        `<tr><td>${escapeHtml(t.kind ?? "")}</td><td>${escapeHtml(clip.src ?? clip.id ?? "")}</td>` +
          `<td>${fmtDuration(clip.start ?? 0)} – ${fmtDuration((clip.start ?? 0) + (clip.duration ?? 0))}</td></tr>`,
      );
    }
  }
  return rows.length > 0 ? rows.join("\n") : `<tr><td colspan="3">(Project trống, chưa có clip)</td></tr>`;
}

/**
 * Xây HTML trang chia sẻ. Lỗi chặn (throw) khi: thiếu cả videoBase64 lẫn
 * videoFileName, hoặc video embedded vượt ngưỡng 100MB (ước lượng từ base64).
 */
export function buildSharePage(input: SharePageInput): SharePageResult {
  const warnings: string[] = [];
  const title = input.title.trim() || "Video VCut";
  const duration = projectDurationOf(input.spec);
  let mode: ShareMode;
  let videoSrc: string;
  if (input.videoBase64 !== undefined) {
    const approxBytes = Math.floor((input.videoBase64.length * 3) / 4);
    if (approxBytes > SHARE_EMBED_MAX_BYTES) {
      throw new Error(
        `Video ~${(approxBytes / 1048576).toFixed(0)}MB, vượt ngưỡng nhúng 1 file (${SHARE_EMBED_MAX_BYTES / 1048576}MB) — ` +
          `hãy dùng chế độ linked (HTML + file video.mp4 đặt cạnh nhau).`,
      );
    }
    if (approxBytes > 50 * 1024 * 1024) {
      warnings.push(`Video lớn (~${(approxBytes / 1048576).toFixed(0)}MB) — file HTML sẽ nặng, gửi qua chat/email có thể bị chặn.`);
    }
    mode = "embedded";
    videoSrc = `data:${input.videoMime};base64,${input.videoBase64}`;
  } else if (input.videoFileName) {
    mode = "linked";
    videoSrc = encodeURI(input.videoFileName);
    warnings.push("Chế độ linked: phải gửi kèm file video đặt cùng thư mục với file HTML thì trang mới phát được.");
  } else {
    throw new Error("Cần videoBase64 (embedded) hoặc videoFileName (linked) để tạo trang chia sẻ.");
  }
  const specJson = JSON.stringify(input.spec);
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:24px}
h1{font-size:20px} video{width:100%;max-width:960px;background:#000}
table{border-collapse:collapse;margin-top:16px} td,th{border:1px solid #444;padding:6px 10px;text-align:left}
.note{color:#aaa;font-size:13px;margin-top:16px}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>Thời lượng: ${fmtDuration(duration)} — Trang xem tĩnh xuất từ VCut Studio (chỉ phát video, không chỉnh sửa).</p>
<video controls preload="metadata" src="${mode === "embedded" ? videoSrc : escapeHtml(videoSrc)}"></video>
<table>
<tr><th>Track</th><th>Clip</th><th>Thời gian</th></tr>
${clipRows(input.spec)}
</table>
<p class="note">Mở file này bằng trình duyệt là xem được, không cần cài VCut hay chạy server.</p>
<script type="application/json" id="vcut-spec">${specJson.replace(/<\//g, "<\\/")}</script>
</body>
</html>`;
  return { html, mode, warnings };
}

/** Tải file HTML xuống (trình duyệt). */
export function downloadSharePage(html: string, title: string): void {
  const safe = (title || "video").replace(/[^\w\- ]+/g, "").trim() || "video";
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}-share.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
