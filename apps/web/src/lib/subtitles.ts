/**
 * subtitles.ts — xuất/nhập SRT + WebVTT cho phụ đề (Phase 9 R4).
 *
 * Logic thuần, không chạm DOM/store — test được bằng Node type-stripping.
 * Dùng chung cho 2 luồng: CaptionModal (segments) và timeline (TextClip)
 * qua cuesToTextClips / clipsToCues.
 *
 * Chuẩn áp dụng:
 * - SRT: `N` (số thứ tự, không bắt buộc liên tục), `HH:MM:SS,mmm -->
 *   HH:MM:SS,mmm`, rồi 1+ dòng text, khối cách nhau bằng dòng trống.
 * - WebVTT: dòng đầu `WEBVTT` (kèm header tùy chọn), cue có thể có id,
 *   timestamp dùng dấu `.` thay cho `,` và giờ có thể là `MM:SS.mmm`.
 * Lỗi định dạng: cue hỏng bị BỎ QUA nhưng ghi vào `errors` (số khối + lý
 * do) để UI báo rõ cho user thay vì fail cả file hay im lặng nuốt câu.
 */

export interface SubtitleCue {
  /** giây, gốc 0 */
  start: number;
  /** giây, gốc 0, > start */
  end: number;
  /** text có thể nhiều dòng (nối bằng \n) */
  text: string;
}

export interface SubtitleParseResult {
  cues: SubtitleCue[];
  /** mỗi lỗi: khối thứ mấy (1-based) + lý do, để UI hiển thị */
  errors: { block: number; reason: string }[];
}

/** HH:MM:SS,mmm hoặc HH:MM:SS.mmm → giây; null nếu sai định dạng. */
export function parseTimestamp(raw: string): number | null {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/.exec(raw.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = Number(m[3]);
  if (min >= 60 || sec >= 60) return null;
  const ms = Number(m[4].padEnd(3, "0"));
  return h * 3600 + min * 60 + sec + ms / 1000;
}

/** WebVTT cho phép MM:SS.mmm (không có giờ). */
export function parseTimestampVtt(raw: string): number | null {
  const full = parseTimestamp(raw);
  if (full !== null) return full;
  const m = /^(\d{1,2}):(\d{2})\.(\d{1,3})$/.exec(raw.trim());
  if (!m) return null;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (sec >= 60) return null;
  return min * 60 + sec + Number(m[3].padEnd(3, "0")) / 1000;
}

function fmtTimestamp(sec: number, sep: "," | "."): string {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(totalMs / 3600000);
  const min = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const p2 = (n: number) => String(n).padStart(2, "0");
  const p3 = (n: number) => String(n).padStart(3, "0");
  return `${p2(h)}:${p2(min)}:${p2(s)}${sep}${p3(ms)}`;
}

function parseBlocks(
  text: string,
  parseTs: (raw: string) => number | null,
  opts: { skipHeader?: boolean } = {}
): SubtitleParseResult {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  // WebVTT: bỏ dòng header WEBVTT + các dòng header cho tới dòng trống đầu.
  let startIdx = 0;
  if (opts.skipHeader) {
    if (!/^WEBVTT(\s|$)/.test(lines[0]?.trim() ?? "")) {
      return {
        cues: [],
        errors: [{ block: 1, reason: "Thiếu dòng đầu WEBVTT." }],
      };
    }
    startIdx = 1;
    while (startIdx < lines.length && lines[startIdx].trim() !== "") startIdx++;
    while (startIdx < lines.length && lines[startIdx].trim() === "") startIdx++;
  }
  const cues: SubtitleCue[] = [];
  const errors: { block: number; reason: string }[] = [];
  let blockNo = 0;
  let i = startIdx;
  while (i < lines.length) {
    // Bỏ dòng trống giữa các khối.
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    const blockLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      blockLines.push(lines[i]);
      i++;
    }
    blockNo++;
    // Dạng khối: [id?] + timestamp + text. id là dòng không chứa "-->".
    let idx = 0;
    if (blockLines.length >= 2 && !blockLines[0].includes("-->")) idx = 1;
    const tsLine = blockLines[idx];
    if (!tsLine || !tsLine.includes("-->")) {
      errors.push({ block: blockNo, reason: "Thiếu dòng timestamp (-->)." });
      continue;
    }
    const [rawStart, rawEndPart] = tsLine.split("-->");
    const rawEnd = (rawEndPart || "").trim().split(/\s+/)[0] || "";
    const start = parseTs(rawStart);
    const end = parseTs(rawEnd);
    if (start === null || end === null) {
      errors.push({
        block: blockNo,
        reason: `Timestamp sai định dạng: "${tsLine.trim()}".`,
      });
      continue;
    }
    if (end <= start) {
      errors.push({
        block: blockNo,
        reason: `Thời gian kết thúc (${end}s) không sau bắt đầu (${start}s).`,
      });
      continue;
    }
    const text = blockLines
      .slice(idx + 1)
      .join("\n")
      .trim();
    if (!text) {
      errors.push({ block: blockNo, reason: "Cue không có text." });
      continue;
    }
    cues.push({ start, end, text: text.slice(0, 2000) });
  }
  cues.sort((a, b) => a.start - b.start);
  return { cues, errors };
}

/** Parse SRT. Số thứ tự cue (nếu có) được bỏ qua, không yêu cầu liên tục. */
export function parseSrt(text: string): SubtitleParseResult {
  return parseBlocks(text, parseTimestamp);
}

/** Parse WebVTT. Thiếu header WEBVTT → lỗi toàn file (không cue nào). */
export function parseVtt(text: string): SubtitleParseResult {
  return parseBlocks(text, parseTimestampVtt, { skipHeader: true });
}

/** Format cues thành SRT (số thứ tự 1-based, timestamp dấu phẩy). */
export function formatSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (c, i) =>
        `${i + 1}\n${fmtTimestamp(c.start, ",")} --> ${fmtTimestamp(c.end, ",")}\n${c.text}`
    )
    .join("\n\n") + (cues.length > 0 ? "\n" : "");
}

/** Format cues thành WebVTT (header + timestamp dấu chấm). */
export function formatVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map(
      (c) => `${fmtTimestamp(c.start, ".")} --> ${fmtTimestamp(c.end, ".")}\n${c.text}`
    )
    .join("\n\n");
  return "WEBVTT\n\n" + body + (cues.length > 0 ? "\n" : "");
}

/** Phát hiện định dạng theo nội dung (VTT nếu bắt đầu bằng WEBVTT). */
export function parseSubtitleFile(text: string): SubtitleParseResult {
  const first = text.replace(/\r\n?/g, "\n").split("\n")[0]?.trim() ?? "";
  if (/^WEBVTT(\s|$)/.test(first)) return parseVtt(text);
  return parseSrt(text);
}

/**
 * Đổi TextClip timeline thành cues (giữ nguyên start/duration).
 * Clip chữ nhiều dòng: text chứa \n được giữ nguyên khi format.
 */
export function clipsToCues(
  clips: { start: number; duration: number; text: string }[]
): SubtitleCue[] {
  return clips
    .filter((c) => c.duration > 0 && c.text.trim() !== "")
    .map((c) => ({
      start: Math.round(c.start * 100) / 100,
      end: Math.round((c.start + c.duration) * 100) / 100,
      text: c.text,
    }))
    .sort((a, b) => a.start - b.start);
}

/**
 * Nhãn track phụ đề — Phase 9 D6: track caption do editor tạo có label
 * "Phụ đề N" (CAPTION_TRACK_LABEL + số) hoặc "Phụ đề (EN)" (track dịch).
 * Dùng để nhận diện track phụ đề khi xuất project (xem
 * collectProjectCaptions) — title/text tự do nằm trên track khác thì
 * không bị xuất nhầm thành phụ đề.
 */
export const CAPTION_TRACK_LABEL_PREFIX = "Phụ đề";

/**
 * Thu thập TOÀN BỘ phụ đề của project để xuất SRT/VTT ở cấp project
 * (Phase 9 D6 — R4 chỉ xuất được segments đang review trong CaptionModal).
 * Một clip chữ được tính là phụ đề khi: có link captionOf (câu bám theo
 * clip nguồn), HOẶC nằm trên track phụ đề (label bắt đầu bằng "Phụ đề":
 * gồm track caption thường và track dịch; caption nhập tay từ SRT/VTT
 * không có captionOf nhưng vẫn nằm trên track này nên vẫn được xuất).
 * Title/chữ tự do trên track khác KHÔNG được xuất. Trả về cues đã sắp
 * theo start + tên các track đã góp cue (để UI báo rõ cho user).
 */
export function collectProjectCaptions(
  tracks: import("@repo-1/video-spec").Track[]
): { cues: SubtitleCue[]; trackLabels: string[] } {
  const cues: SubtitleCue[] = [];
  const trackLabels: string[] = [];
  for (const t of tracks) {
    const isCaptionTrack =
      (t.label ?? "").startsWith(CAPTION_TRACK_LABEL_PREFIX);
    const kept = t.clips.filter(
      (
        c
      ): c is import("@repo-1/video-spec").TextClip =>
        c.kind === "text" &&
        c.duration > 0 &&
        (c as import("@repo-1/video-spec").TextClip).text.trim() !== "" &&
        ((c as import("@repo-1/video-spec").TextClip).captionOf !== undefined ||
          isCaptionTrack)
    );
    if (kept.length === 0) continue;
    trackLabels.push(t.label ?? "(không tên)");
    for (const c of kept) {
      cues.push({
        start: Math.round(c.start * 100) / 100,
        end: Math.round((c.start + c.duration) * 100) / 100,
        text: c.text,
      });
    }
  }
  cues.sort((a, b) => a.start - b.start);
  return { cues, trackLabels };
}

/**
 * Đổi cues thành TextClip (style truyền vào từ caller; id do caller cấp
 * qua uid — ở đây dùng prefix cue- + index, caller thay id nếu cần).
 * Karaoke KHÔNG khôi phục được từ SRT/VTT (file không chứa word timestamps)
 * nên clip nhập vào luôn là chữ thường — ghi rõ trong R4_LIMITS.md.
 */
export function cuesToTextClips(
  cues: SubtitleCue[],
  style: import("@repo-1/video-spec").TextStyle,
  uid: (prefix: string) => string
): import("@repo-1/video-spec").TextClip[] {
  return cues.map((c, i) => ({
    kind: "text" as const,
    id: uid(`cue${i + 1}-`),
    text: c.text,
    start: Math.round(c.start * 100) / 100,
    duration: Math.max(0.2, Math.round((c.end - c.start) * 100) / 100),
    style: { ...style },
  }));
}
